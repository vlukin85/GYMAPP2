import { describe, expect, it } from "vitest";
import { filterWorkoutsByStatsFilter, filterWorkoutsByStatsPeriod, getLatestPersonalRecords, getPreviousPeriodBounds, getStatsFilterBounds } from "../lib/stats-period";

const now = new Date("2026-08-18T12:00:00");

describe("statistics period filters", () => {
  it("limits workout metrics to the selected weekly period", () => {
    const workouts = [
      { id: "new", programId: "p", date: "2026-08-17", durationMinutes: 40, totalVolume: 1200, sets: [] },
      { id: "old", programId: "p", date: "2026-08-09", durationMinutes: 40, totalVolume: 1200, sets: [] },
    ];
    expect(filterWorkoutsByStatsPeriod(workouts, "week", now).map((workout) => workout.id)).toEqual(["new"]);
  });

  it("keeps only current-period records and sorts newer updates first", () => {
    const records = {
      old: { exerciseId: "old", weight: 50, reps: 5, estimatedOneRepMax: 58.3, achievedAt: "2026-07-01T12:00:00.000Z" },
      early: { exerciseId: "early", weight: 60, reps: 5, estimatedOneRepMax: 70, achievedAt: "2026-08-17T10:00:00.000Z" },
      latest: { exerciseId: "latest", weight: 70, reps: 5, estimatedOneRepMax: 81.7, achievedAt: "2026-08-17T12:00:00.000Z" },
    };
    expect(getLatestPersonalRecords(records, "week", now).map((record) => record.exerciseId)).toEqual(["latest", "early"]);
  });

  it("filters one selected day and normalizes a user-entered date range", () => {
    const workouts = [
      { id: "first", programId: "p", date: "2026-08-10", durationMinutes: 40, totalVolume: 1200, sets: [] },
      { id: "target", programId: "p", date: "2026-08-12", durationMinutes: 40, totalVolume: 1200, sets: [] },
      { id: "last", programId: "p", date: "2026-08-14", durationMinutes: 40, totalVolume: 1200, sets: [] },
    ];
    expect(filterWorkoutsByStatsFilter(workouts, { mode: "date", date: "2026-08-12" }, now).map((workout) => workout.id)).toEqual(["target"]);
    expect(getStatsFilterBounds({ mode: "custom", start: "2026-08-14", end: "2026-08-10" }, now)).toEqual({ start: "2026-08-10", end: "2026-08-14" });
    expect(getStatsFilterBounds({ mode: "last30" }, now)).toEqual({ start: "2026-07-20", end: "2026-08-18" });
  });

  it("calculates matching previous windows for week and month comparisons", () => {
    expect(getPreviousPeriodBounds({ mode: "week" }, now)).toEqual({ start: "2026-08-10", end: "2026-08-16" });
    expect(getPreviousPeriodBounds({ mode: "month" }, now)).toEqual({ start: "2026-07-01", end: "2026-07-31" });
    expect(getPreviousPeriodBounds({ mode: "last30" }, now)).toBeNull();
  });
});
