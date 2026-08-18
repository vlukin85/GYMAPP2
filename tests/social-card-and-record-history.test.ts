import { describe, expect, it } from "vitest";
import { formatWorkoutSocialTemplate } from "../lib/workout-achievements";
import { getExercisePersonalRecordHistory } from "../lib/record-history";
import type { CompletedWorkout } from "../lib/workout-data";

describe("social card and record history", () => {
  const completed: CompletedWorkout[] = [
    { id: "w-1", programId: "p", date: "2026-08-01", durationMinutes: 45, totalVolume: 2000, sets: [{ exerciseId: "bench-press", weight: 70, reps: 5 }] },
    { id: "w-2", programId: "p", date: "2026-08-08", durationMinutes: 48, totalVolume: 2500, sets: [{ exerciseId: "bench-press", weight: 72.5, reps: 5 }] },
    { id: "w-3", programId: "p", date: "2026-08-15", durationMinutes: 42, totalVolume: 1800, sets: [{ exerciseId: "bench-press", weight: 65, reps: 5 }] },
  ];

  it("keeps only the dates where the personal record improved", () => {
    expect(getExercisePersonalRecordHistory(completed, "bench-press", "epley").map((point) => point.workoutId)).toEqual(["w-1", "w-2"]);
  });

  it("creates focused Telegram and Instagram texts", () => {
    const input = { workout: completed[1], programName: "Верх тела · Сила", records: [{ exerciseId: "bench-press", weight: 72.5, reps: 5, estimatedOneRepMax: 84.6, achievedAt: "2026-08-08", name: "Жим лёжа" }] };
    expect(formatWorkoutSocialTemplate("telegram", input)).toContain("🏋️");
    expect(formatWorkoutSocialTemplate("instagram", input)).toContain("#IronRise");
  });
});
