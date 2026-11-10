import type { DailyEnergyInput } from "./workout-energy";
import { calculateDailyEnergy } from "./workout-energy";
import type { CompletedWorkout } from "./workout-data";
import type { Lang } from "./i18n/types";

export type HomeEnergyTrendPoint = {
  date: string;
  label: string;
  totalCalories: number;
  workoutCalories: number;
};

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

/** Builds seven calendar-day estimates using the current local profile and completed workout calories. */
export function buildHomeEnergyTrend(
  referenceDate: Date,
  workouts: CompletedWorkout[],
  context: Omit<DailyEnergyInput, "workoutCalories">,
  lang: Lang = "ru",
): HomeEnergyTrendPoint[] {
  // Подписи оси — по выбранному языку, а не жёстко по ru-RU.
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const workoutCaloriesByDate = new Map<string, number>();
  workouts.forEach((workout) => {
    workoutCaloriesByDate.set(workout.date, (workoutCaloriesByDate.get(workout.date) ?? 0) + Math.max(0, workout.caloriesBurned ?? 0));
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - (6 - index));
    const key = dateKey(date);
    const workoutCalories = workoutCaloriesByDate.get(key) ?? 0;
    const estimate = calculateDailyEnergy({ ...context, workoutCalories });
    return {
      date: key,
      label: date.toLocaleDateString(locale, { weekday: "short" }).replace(".", "").toUpperCase(),
      totalCalories: estimate.totalCalories,
      workoutCalories,
    };
  });
}
