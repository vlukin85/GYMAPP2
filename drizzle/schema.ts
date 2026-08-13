import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workoutSessions = mysqlTable("workoutSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programId: varchar("programId", { length: 128 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  totalVolumeCentiKg: int("totalVolumeCentiKg").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export const workoutSets = mysqlTable("workoutSets", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  exerciseId: varchar("exerciseId", { length: 128 }).notNull(),
  setNumber: int("setNumber").notNull(),
  reps: int("reps").notNull(),
  weightCentiKg: int("weightCentiKg").notNull(),
  volumeCentiKg: int("volumeCentiKg").notNull(),
  oneRepMaxCentiKg: int("oneRepMaxCentiKg").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export const trainingBackups = mysqlTable("trainingBackups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  snapshotJson: text("snapshotJson").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertWorkoutSet = typeof workoutSets.$inferInsert;
export type TrainingBackup = typeof trainingBackups.$inferSelect;
