import { describe, expect, it } from "vitest";
import { filterWorkoutsByStatsPeriod, getLatestPersonalRecords } from "../lib/stats-period";

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
});
