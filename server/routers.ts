import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const persistedSetSchema = z.object({
  exerciseId: z.string().min(1).max(128),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(0).max(1000),
  weightKg: z.number().min(0).max(10000),
  setType: z.enum(["warmup", "working", "drop", "failure"]).optional(),
  supersetGroup: z.string().min(1).max(32).optional(),
  dropSubsets: z.array(z.object({ weightKg: z.number().min(0).max(10000), reps: z.number().int().min(1).max(1000) })).max(5).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("manus_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workoutHistory: router({
    save: publicProcedure.input(z.object({
      programId: z.string().min(1).max(128),
      durationMinutes: z.number().int().min(0).max(24 * 60),
      formula: z.enum(["epley", "brzycki"]),
      completedAt: z.coerce.date().optional(),
      sets: z.array(persistedSetSchema).max(500),
    })).mutation(({ ctx, input }) => db.saveCompletedWorkout({ userId: ctx.user?.id ?? 0, ...input })),
    import: publicProcedure.input(z.object({
      formula: z.enum(["epley", "brzycki"]),
      sessions: z.array(z.object({
        programId: z.string().min(1).max(128),
        durationMinutes: z.number().int().min(0).max(24 * 60),
        completedAt: z.coerce.date(),
        importFingerprint: z.string().regex(/^v1-[0-9a-f]{8}$/),
        sets: z.array(persistedSetSchema).min(1).max(500),
      })).min(1).max(100),
    })).mutation(({ ctx, input }) => db.saveImportedWorkouts({ userId: ctx.user?.id ?? 0, ...input })),
    importedFingerprints: publicProcedure.input(z.object({ fingerprints: z.array(z.string().regex(/^v1-[0-9a-f]{8}$/)).max(100) })).query(({ ctx, input }) => db.getExistingImportFingerprints(ctx.user?.id ?? 0, input.fingerprints)),
    byExercise: publicProcedure.input(z.object({ exerciseId: z.string().min(1).max(128) })).query(({ ctx, input }) => db.getExerciseHistoryFromDb(ctx.user?.id ?? 0, input.exerciseId)),
    all: publicProcedure.query(({ ctx }) => db.getAllWorkoutSetsFromDb(ctx.user?.id ?? 0)),
  }),
  trainingBackup: router({
    save: publicProcedure.input(z.object({ snapshotJson: z.string().min(2).max(200_000) })).mutation(({ ctx, input }) => db.saveTrainingBackup(ctx.user?.id ?? 0, input.snapshotJson)),
    get: publicProcedure.query(({ ctx }) => db.getTrainingBackup(ctx.user?.id ?? 0)),
  }),
});

export type AppRouter = typeof appRouter;
