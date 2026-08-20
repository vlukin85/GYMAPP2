import type { DailyEnergyInput } from "./workout-energy";
import { calculateDailyEnergy } from "./workout-energy";
import type { CompletedWorkout } from "./workout-data";

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
): HomeEnergyTrendPoint[] {
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
      label: date.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "").toUpperCase(),
      totalCalories: estimate.totalCalories,
      workoutCalories,
    };
  });
}
