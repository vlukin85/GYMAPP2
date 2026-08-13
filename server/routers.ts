import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

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
      sets: z.array(z.object({
        exerciseId: z.string().min(1).max(128),
        setNumber: z.number().int().min(1),
        reps: z.number().int().min(0).max(1000),
        weightKg: z.number().min(0).max(10000),
      })).max(500),
    })).mutation(({ ctx, input }) => db.saveCompletedWorkout({ userId: ctx.user?.id ?? 0, ...input })),
    byExercise: publicProcedure.input(z.object({ exerciseId: z.string().min(1).max(128) })).query(({ ctx, input }) => db.getExerciseHistoryFromDb(ctx.user?.id ?? 0, input.exerciseId)),
  }),
});

export type AppRouter = typeof appRouter;
