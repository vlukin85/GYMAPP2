import { describe, expect, it } from "vitest";
import { formatWorkoutAchievementShare, getWorkoutRecordAchievements } from "../lib/workout-achievements";
import type { CompletedWorkout, PersonalRecord } from "../lib/workout-data";

describe("workout achievements", () => {
  const workout: CompletedWorkout = { id: "workout-1", programId: "upper-strength", date: "2026-08-18", durationMinutes: 55, totalVolume: 4425, sets: [{ exerciseId: "bench-press", weight: 90, reps: 5 }] };
  const records: Record<string, PersonalRecord> = {
    bench: { exerciseId: "bench-press", weight: 90, reps: 5, estimatedOneRepMax: 105, achievedAt: "2026-08-18T11:00:00.000Z", achievedWorkoutId: "workout-1" },
    squat: { exerciseId: "squat", weight: 140, reps: 3, estimatedOneRepMax: 154, achievedAt: "2026-08-18T11:00:00.000Z", achievedWorkoutId: "workout-1" },
    olderBench: { exerciseId: "bench-press", weight: 85, reps: 5, estimatedOneRepMax: 99, achievedAt: "2026-08-17T11:00:00.000Z", achievedWorkoutId: "workout-0" },
  };

  it("includes only records that were set in the selected workout", () => {
    expect(getWorkoutRecordAchievements(workout, records).map((record) => record.exerciseId)).toEqual(["bench-press"]);
  });

  it("uses a same-day fallback for legacy records without a workout identifier", () => {
    const legacy = { bench: { ...records.bench, achievedWorkoutId: undefined } };
    expect(getWorkoutRecordAchievements(workout, legacy)).toHaveLength(1);
  });

  it("formats a compact shareable workout achievement summary", () => {
    const text = formatWorkoutAchievementShare({ workout, programName: "Верх тела · Сила", records: [{ ...records.bench, name: "Жим лёжа" }] });
    expect(text).toContain("Жим лёжа: 90 кг × 5");
    expect(text).toContain("4 425 кг");
    // Язык — необязательное поле: без него текст остаётся русским.
    expect(text).toContain("Новые личные рекорды:");

    const english = formatWorkoutAchievementShare({ workout, programName: "Upper body · Strength", records: [{ ...records.bench, name: "Bench press" }], lang: "en" });
    expect(english).toContain("Workout: 55 min · 4,425 kg · 1 sets");
    expect(english).toContain("New personal records:");
    expect(english).toContain("• Bench press: 90 kg × 5 · 1RM 105.0 kg");
    expect(english).toContain("#IronRise #Workout");
    expect(/[А-Яа-яЁё]/.test(english)).toBe(false);
  });
});
