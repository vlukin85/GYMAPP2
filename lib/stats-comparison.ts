import type { CompletedWorkout } from "./workout-data";
import { filterWorkoutsByStatsFilter, getPreviousPeriodBounds, type StatsDateFilter } from "./stats-period";

export type StatsMetrics = { workoutCount: number; volume: number; minutes: number };

export function getStatsMetrics(workouts: CompletedWorkout[], filter: StatsDateFilter, exerciseId: string | null, now = new Date()): StatsMetrics {
  const periodWorkouts = filterWorkoutsByStatsFilter(workouts, filter, now);
  const scopedWorkouts = exerciseId
    ? periodWorkouts.filter((workout) => (workout.sets ?? []).some((set) => set.exerciseId === exerciseId))
    : periodWorkouts;
  const volume = exerciseId
    ? periodWorkouts.reduce((sum, workout) => sum + (workout.sets ?? []).filter((set) => set.exerciseId === exerciseId).reduce((setSum, set) => setSum + set.weight * set.reps, 0), 0)
    : periodWorkouts.reduce((sum, workout) => sum + workout.totalVolume, 0);
  return { workoutCount: scopedWorkouts.length, volume, minutes: scopedWorkouts.reduce((sum, workout) => sum + workout.durationMinutes, 0) };
}

export function getStatsPeriodComparison(workouts: CompletedWorkout[], filter: StatsDateFilter, exerciseId: string | null, now = new Date()) {
  const previousBounds = getPreviousPeriodBounds(filter, now);
  if (!previousBounds) return null;
  const previousFilter: StatsDateFilter = { mode: "custom", ...previousBounds };
  return {
    current: getStatsMetrics(workouts, filter, exerciseId, now),
    previous: getStatsMetrics(workouts, previousFilter, exerciseId, now),
    previousBounds,
  };
}

export function getPercentageChange(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}
