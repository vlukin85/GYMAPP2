import { describe, expect, it } from "vitest";
import { rebuildPersonalRecords } from "../lib/workout-store";
import type { CompletedWorkout } from "../lib/workout-data";

describe("completed workout deletion", () => {
  const completed: CompletedWorkout[] = [
    { id: "w-early", programId: "p", date: "2026-08-01", durationMinutes: 40, totalVolume: 2000, sets: [{ exerciseId: "bench-press", weight: 70, reps: 5 }] },
    { id: "w-record", programId: "p", date: "2026-08-08", durationMinutes: 45, totalVolume: 2500, sets: [{ exerciseId: "bench-press", weight: 80, reps: 5 }] },
  ];

  it("restores the preceding personal record after removing the recorded session", () => {
    const remaining = completed.filter((workout) => workout.id !== "w-record");
    expect(rebuildPersonalRecords(remaining, "epley")["bench-press"]).toMatchObject({ achievedWorkoutId: "w-early", weight: 70, reps: 5 });
  });
});
