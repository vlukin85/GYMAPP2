import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, workoutSessions, workoutSets } from "../drizzle/schema";
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

export type PersistedSetInput = { exerciseId: string; setNumber: number; reps: number; weightKg: number };

export async function saveCompletedWorkout(input: { userId: number; programId: string; durationMinutes: number; sets: PersistedSetInput[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const totalVolumeCentiKg = input.sets.reduce((sum, set) => sum + Math.round(set.weightKg * 100) * set.reps, 0);
  const sessionResult = await db.insert(workoutSessions).values({ userId: input.userId, programId: input.programId, durationMinutes: input.durationMinutes, totalVolumeCentiKg });
  const sessionId = Number((sessionResult as any)?.[0]?.insertId ?? (sessionResult as any)?.insertId);
  if (!sessionId) throw new Error("Could not determine saved workout session id");
  if (input.sets.length > 0) {
    await db.insert(workoutSets).values(input.sets.map((set) => ({ sessionId, userId: input.userId, exerciseId: set.exerciseId, setNumber: set.setNumber, reps: set.reps, weightCentiKg: Math.round(set.weightKg * 100), volumeCentiKg: Math.round(set.weightKg * 100) * set.reps })));
  }
  return { sessionId };
}

export async function getExerciseHistoryFromDb(userId: number, exerciseId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ date: workoutSets.completedAt, setNumber: workoutSets.setNumber, reps: workoutSets.reps, weightCentiKg: workoutSets.weightCentiKg, volumeCentiKg: workoutSets.volumeCentiKg, sessionId: workoutSets.sessionId }).from(workoutSets).where(and(eq(workoutSets.userId, userId), eq(workoutSets.exerciseId, exerciseId))).orderBy(desc(workoutSets.completedAt), workoutSets.sessionId, workoutSets.setNumber);
}
