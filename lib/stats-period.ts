import type { CompletedWorkout, PersonalRecord } from "./workout-data";

export type StatsPeriod = "week" | "month" | "year";
export type StatsFilterMode = StatsPeriod | "date" | "custom" | "last30" | "last90";
export type StatsDateFilter = { mode: StatsFilterMode; date?: string; start?: string; end?: string };

function isIsoDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()));
}

export function getStatsFilterBounds(filter: StatsDateFilter, now = new Date()) {
  if (filter.mode === "date" && isIsoDate(filter.date)) return { start: filter.date!, end: filter.date! };
  if (filter.mode === "custom" && isIsoDate(filter.start) && isIsoDate(filter.end)) {
    return filter.start! <= filter.end! ? { start: filter.start!, end: filter.end! } : { start: filter.end!, end: filter.start! };
  }
  if (filter.mode === "last30" || filter.mode === "last90") {
    const start = new Date(now);
    start.setDate(start.getDate() - (filter.mode === "last30" ? 29 : 89));
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
  }
  const start = getStatsPeriodStart(filter.mode as StatsPeriod, now).toISOString().slice(0, 10);
  return { start, end: now.toISOString().slice(0, 10) };
}

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

export function filterWorkoutsByStatsFilter(workouts: CompletedWorkout[], filter: StatsDateFilter, now = new Date()) {
  const { start, end } = getStatsFilterBounds(filter, now);
  return workouts.filter((workout) => {
    const date = workout.date.slice(0, 10);
    return date >= start && date <= end;
  });
}

export function getLatestPersonalRecordsByFilter(records: Record<string, PersonalRecord>, filter: StatsDateFilter, now = new Date()) {
  const { start, end } = getStatsFilterBounds(filter, now);
  return Object.values(records)
    .filter((record) => {
      const date = record.achievedAt.slice(0, 10);
      return date >= start && date <= end;
    })
    .sort((first, second) => new Date(second.achievedAt).getTime() - new Date(first.achievedAt).getTime());
}
