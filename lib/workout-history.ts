import type { CompletedWorkout } from "./workout-data";

export type WorkoutHistoryExercise = { exerciseId: string; sets: { weight: number; reps: number }[]; volume: number };

export function groupWorkoutHistoryExercises(workout: Pick<CompletedWorkout, "sets">): WorkoutHistoryExercise[] {
  const grouped = new Map<string, { weight: number; reps: number }[]>();
  (workout.sets ?? []).forEach((set) => grouped.set(set.exerciseId, [...(grouped.get(set.exerciseId) ?? []), { weight: set.weight, reps: set.reps }]));
  return Array.from(grouped.entries()).map(([exerciseId, sets]) => ({ exerciseId, sets, volume: sets.reduce((sum, set) => sum + set.weight * set.reps, 0) }));
}
