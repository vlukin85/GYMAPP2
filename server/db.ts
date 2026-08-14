import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, trainingBackups, users, workoutSessions, workoutSets } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => { const value = user[field]; if (value === undefined) return; const normalized = value ?? null; values[field] = normalized; updateSet[field] = normalized; };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export type PersistedSetInput = { exerciseId: string; setNumber: number; reps: number; weightKg: number; setType?: "warmup" | "working" | "drop" | "failure"; supersetGroup?: string; dropSubsets?: { weightKg: number; reps: number }[] };

type WorkoutPersistenceInput = { userId: number; programId: string; durationMinutes: number; formula: "epley" | "brzycki"; completedAt?: Date; importFingerprint?: string; sets: PersistedSetInput[] };

async function writeCompletedWorkout(db: any, input: WorkoutPersistenceInput) {
  const partsFor = (set: PersistedSetInput) => set.setType === "drop" && set.dropSubsets?.length ? set.dropSubsets.slice(0, 5).filter((part) => part.weightKg >= 0 && Number.isInteger(part.reps) && part.reps > 0) : [{ weightKg: set.weightKg, reps: set.reps }];
  const oneRepMaxCentiKgFor = (weightCentiKg: number, reps: number) => { const cappedReps = Math.min(reps, 30); return Math.round(input.formula === "brzycki" ? weightCentiKg * (36 / (37 - cappedReps)) : weightCentiKg * (1 + cappedReps / 30)); };
  const totalVolumeCentiKg = input.sets.reduce((sum, set) => sum + partsFor(set).reduce((setTotal, part) => setTotal + Math.round(part.weightKg * 100) * part.reps, 0), 0);
  const completedAt = input.completedAt ?? new Date();
  const sessionResult = await db.insert(workoutSessions).values({ userId: input.userId, programId: input.programId, durationMinutes: input.durationMinutes, totalVolumeCentiKg, importFingerprint: input.importFingerprint, completedAt });
  const sessionId = Number((sessionResult as any)?.[0]?.insertId ?? (sessionResult as any)?.insertId);
  if (!sessionId) throw new Error("Could not determine saved workout session id");
  if (input.sets.length > 0) {
    await db.insert(workoutSets).values(input.sets.map((set) => { const parts = partsFor(set); const primary = parts[0] ?? { weightKg: set.weightKg, reps: set.reps }; const weightCentiKg = Math.round(primary.weightKg * 100); const volumeCentiKg = parts.reduce((sum, part) => sum + Math.round(part.weightKg * 100) * part.reps, 0); const oneRepMaxCentiKg = Math.max(0, ...parts.map((part) => oneRepMaxCentiKgFor(Math.round(part.weightKg * 100), part.reps))); return { sessionId, userId: input.userId, exerciseId: set.exerciseId, setNumber: set.setNumber, reps: primary.reps, weightCentiKg, volumeCentiKg, oneRepMaxCentiKg, setType: set.setType ?? "working", supersetGroup: set.supersetGroup, dropSubsetsJson: set.setType === "drop" && parts.length ? JSON.stringify(parts) : null, completedAt }; }));
  }
  return { sessionId };
}

export async function saveCompletedWorkout(input: WorkoutPersistenceInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return writeCompletedWorkout(db, input);
}

export async function saveImportedWorkouts(input: { userId: number; formula: "epley" | "brzycki"; sessions: Omit<WorkoutPersistenceInput, "userId" | "formula">[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const fingerprints = input.sessions.map((session) => session.importFingerprint).filter((value): value is string => Boolean(value));
  const existing = fingerprints.length ? await db.select({ importFingerprint: workoutSessions.importFingerprint }).from(workoutSessions).where(and(eq(workoutSessions.userId, input.userId), inArray(workoutSessions.importFingerprint, fingerprints))) : [];
  const existingFingerprints = new Set(existing.map((row) => row.importFingerprint).filter((value): value is string => Boolean(value)));
  const pending = input.sessions.filter((session) => !session.importFingerprint || !existingFingerprints.has(session.importFingerprint));
  return db.transaction(async (tx) => {
    const imports: { sessionId: number; fingerprint: string }[] = [];
    for (const session of pending) {
      const saved = await writeCompletedWorkout(tx, { userId: input.userId, formula: input.formula, ...session });
      if (session.importFingerprint) imports.push({ sessionId: saved.sessionId, fingerprint: session.importFingerprint });
    }
    return { imports, skippedFingerprints: [...existingFingerprints] };
  });
}

export async function getExistingImportFingerprints(userId: number, fingerprints: string[]) {
  const db = await getDb();
  if (!db || !fingerprints.length) return [];
  const rows = await db.select({ importFingerprint: workoutSessions.importFingerprint }).from(workoutSessions).where(and(eq(workoutSessions.userId, userId), inArray(workoutSessions.importFingerprint, fingerprints)));
  return rows.map((row) => row.importFingerprint).filter((value): value is string => Boolean(value));
}

export async function getExerciseHistoryFromDb(userId: number, exerciseId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ date: workoutSets.completedAt, setNumber: workoutSets.setNumber, reps: workoutSets.reps, weightCentiKg: workoutSets.weightCentiKg, volumeCentiKg: workoutSets.volumeCentiKg, oneRepMaxCentiKg: workoutSets.oneRepMaxCentiKg, setType: workoutSets.setType, supersetGroup: workoutSets.supersetGroup, dropSubsetsJson: workoutSets.dropSubsetsJson, sessionId: workoutSets.sessionId }).from(workoutSets).where(and(eq(workoutSets.userId, userId), eq(workoutSets.exerciseId, exerciseId))).orderBy(desc(workoutSets.completedAt), workoutSets.sessionId, workoutSets.setNumber);
}

export async function getAllWorkoutSetsFromDb(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ sessionId: workoutSets.sessionId, date: workoutSessions.completedAt, programId: workoutSessions.programId, durationMinutes: workoutSessions.durationMinutes, exerciseId: workoutSets.exerciseId, setNumber: workoutSets.setNumber, reps: workoutSets.reps, weightCentiKg: workoutSets.weightCentiKg, volumeCentiKg: workoutSets.volumeCentiKg, oneRepMaxCentiKg: workoutSets.oneRepMaxCentiKg }).from(workoutSets).innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id)).where(eq(workoutSets.userId, userId)).orderBy(desc(workoutSessions.completedAt), workoutSets.setNumber);
}

export async function saveTrainingBackup(userId: number, snapshotJson: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(trainingBackups).values({ userId, snapshotJson }).onDuplicateKeyUpdate({ set: { snapshotJson, updatedAt: new Date() } });
}

export async function getTrainingBackup(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trainingBackups).where(eq(trainingBackups.userId, userId)).limit(1);
  return result[0];
}
