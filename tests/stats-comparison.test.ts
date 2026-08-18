import { describe, expect, it } from "vitest";
import { getPercentageChange, getStatsPeriodComparison } from "../lib/stats-comparison";

const now = new Date("2026-08-18T12:00:00");

describe("statistics period comparison", () => {
  const workouts = [
    { id: "previous", programId: "p", date: "2026-08-11", durationMinutes: 35, totalVolume: 800, sets: [{ exerciseId: "bench", weight: 40, reps: 10 }] },
    { id: "current", programId: "p", date: "2026-08-17", durationMinutes: 45, totalVolume: 1200, sets: [{ exerciseId: "bench", weight: 60, reps: 10 }] },
    { id: "other", programId: "p", date: "2026-08-18", durationMinutes: 30, totalVolume: 500, sets: [{ exerciseId: "squat", weight: 50, reps: 10 }] },
  ];

  it("compares the active week with the equally long preceding week", () => {
    const comparison = getStatsPeriodComparison(workouts, { mode: "week" }, null, now);
    expect(comparison?.current).toEqual({ workoutCount: 2, volume: 1700, minutes: 75 });
    expect(comparison?.previous).toEqual({ workoutCount: 1, volume: 800, minutes: 35 });
  });

  it("uses selected exercise sets for volume while retaining matched sessions", () => {
    const comparison = getStatsPeriodComparison(workouts, { mode: "week" }, "bench", now);
    expect(comparison?.current).toEqual({ workoutCount: 1, volume: 600, minutes: 45 });
    expect(comparison?.previous).toEqual({ workoutCount: 1, volume: 400, minutes: 35 });
    expect(getPercentageChange(600, 400)).toBe(50);
    expect(getPercentageChange(600, 0)).toBeNull();
  });
});
