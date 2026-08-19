import { describe, expect, it } from "vitest";
import { formatCardioPace, getCardioWorkoutSummary, getWeeklyCardioMinutes } from "../lib/cardio-metrics";

describe("cardio metrics", () => {
  it("calculates distance and pace from timed cardio sets", () => {
    const summary = getCardioWorkoutSummary([{ exerciseId: "treadmill", reps: 25, distanceKm: 5 }]);
    expect(summary.minutes).toBe(25);
    expect(summary.distanceKm).toBe(5);
    expect(formatCardioPace(summary.paceSecondsPerKm)).toBe("5:00 мин/км");
  });

  it("builds a seven-day cardio series without counting non-cardio minutes", () => {
    const points = getWeeklyCardioMinutes([
      { id: "run", programId: "p", date: "2026-08-19", durationMinutes: 30, totalVolume: 0, sets: [{ exerciseId: "treadmill", weight: 0, reps: 20, distanceKm: 4 }] },
      { id: "plank", programId: "p", date: "2026-08-19", durationMinutes: 5, totalVolume: 0, sets: [{ exerciseId: "plank", weight: 0, reps: 5 }] },
    ], new Date("2026-08-19T12:00:00"));
    expect(points).toHaveLength(7);
    expect(points.at(-1)?.minutes).toBe(20);
  });
});
