import { describe, expect, it } from "vitest";
import { calculateCompletedWorkoutVolume, rebuildPersonalRecords, resolveWorkoutStartTime } from "../lib/workout-store";
import type { CompletedWorkout } from "../lib/workout-data";

describe("manual completed-workout editing", () => {
  it("recalculates volume from corrected strength sets and excludes timed activity", () => {
    expect(calculateCompletedWorkoutVolume([
      { exerciseId: "bench-press", weight: 80, reps: 5 },
      { exerciseId: "running", weight: 0, reps: 20, distanceKm: 3 },
    ], 75, 65)).toBe(400);
  });

  it("rebuilds the personal record from corrected factual sets", () => {
    const completed: CompletedWorkout[] = [
      { id: "w-1", programId: "p", date: "2026-08-01", durationMinutes: 40, totalVolume: 1500, sets: [{ exerciseId: "bench-press", weight: 70, reps: 5 }] },
      { id: "w-2", programId: "p", date: "2026-08-08", durationMinutes: 42, totalVolume: 1600, sets: [{ exerciseId: "bench-press", weight: 65, reps: 5 }] },
    ];
    expect(rebuildPersonalRecords(completed, "epley")["bench-press"]).toMatchObject({ achievedWorkoutId: "w-1", weight: 70, reps: 5 });
  });

  it("keeps a local training note alongside corrected results", () => {
    const completed: CompletedWorkout = { id: "w-note", programId: "p", date: "2026-08-09", durationMinutes: 35, totalVolume: 1200, notes: "Техника стабильная, без боли." };
    expect(completed.notes).toBe("Техника стабильная, без боли.");
  });
});

describe("active workout start time", () => {
  it("keeps the original start time when a user reopens the same active program", () => {
    expect(resolveWorkoutStartTime({ programId: "upper", startedAt: 1_000 }, "upper", undefined, 9_000)).toBe(1_000);
  });

  it("uses the requested draft start time in preference to a fresh timestamp", () => {
    expect(resolveWorkoutStartTime({ programId: "upper", startedAt: 1_000 }, "upper", 500, 9_000)).toBe(500);
  });
});
