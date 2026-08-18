import type { CompletedWorkout, PersonalRecord } from "./workout-data";

export type StatsPeriod = "week" | "month" | "year";

export function getStatsPeriodStart(period: StatsPeriod, now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  if (period === "week") {
    const shift = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - shift);
    return date;
  }
  if (period === "month") return new Date(date.getFullYear(), date.getMonth(), 1);
  return new Date(date.getFullYear(), 0, 1);
}

export function filterWorkoutsByStatsPeriod(workouts: CompletedWorkout[], period: StatsPeriod, now = new Date()) {
  const start = getStatsPeriodStart(period, now).getTime();
  return workouts.filter((workout) => new Date(`${workout.date.slice(0, 10)}T12:00:00`).getTime() >= start);
}

export function getLatestPersonalRecords(records: Record<string, PersonalRecord>, period: StatsPeriod, now = new Date()) {
  const start = getStatsPeriodStart(period, now).getTime();
  return Object.values(records)
    .filter((record) => new Date(record.achievedAt).getTime() >= start)
    .sort((first, second) => new Date(second.achievedAt).getTime() - new Date(first.achievedAt).getTime());
}
