import { bestOneRepMax, type CompletedWorkout, type OneRepMaxFormula } from "./workout-data";

export type LocalWorkoutHistoryRow = {
  sessionId: string;
  date: string;
  programId: string;
  durationMinutes: number;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightCentiKg: number;
  volumeCentiKg: number;
  oneRepMaxCentiKg: number;
  setType: string;
  dropSubsetsJson?: string;
};

/** Converts persisted on-device sessions into the analytics shape used by reports and comparisons. */
export function buildLocalWorkoutHistoryRows(completed: CompletedWorkout[], formula: OneRepMaxFormula): LocalWorkoutHistoryRow[] {
  return completed.flatMap((workout) => (workout.sets ?? []).map((set, index) => {
    const weightCentiKg = Math.round(set.weight * 100);
    return {
      sessionId: workout.id,
      date: workout.date,
      programId: workout.programId,
      durationMinutes: workout.durationMinutes,
      exerciseId: set.exerciseId,
      setNumber: index + 1,
      reps: set.reps,
      weightCentiKg,
      volumeCentiKg: Math.round(set.weight * set.reps * 100),
      oneRepMaxCentiKg: Math.round(bestOneRepMax([{ weight: set.weight, reps: set.reps }], formula) * 100),
      setType: "working",
    };
  })).sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}
