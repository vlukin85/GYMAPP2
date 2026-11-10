import type { CompletedWorkout } from "./workout-data";
import type { Lang } from "./i18n/types";

export type HomeWorkoutTrendPoint = { date: string; label: string; volume: number; workouts: number; workoutId: string };

/** Builds up to seven chronological data points from real persisted workouts only. */
export function buildHomeWorkoutTrend(workouts: CompletedWorkout[], limit = 7, lang: Lang = "ru"): HomeWorkoutTrendPoint[] {
  // Подписи оси — по выбранному языку, а не жёстко по ru-RU.
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const byDate = new Map<string, { volume: number; workouts: number; workoutId: string }>();
  workouts.forEach((workout) => {
    const current = byDate.get(workout.date) ?? { volume: 0, workouts: 0, workoutId: workout.id };
    byDate.set(workout.date, { volume: current.volume + workout.totalVolume, workouts: current.workouts + 1, workoutId: workout.id });
  });
  return Array.from(byDate.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .slice(-limit)
    .map(([date, value]) => ({ date, label: new Date(`${date}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" }).replace(".", ""), ...value }));
}
