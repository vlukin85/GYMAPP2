import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getExercise, isTimeBasedExercise } from "../lib/workout-data";
import { rebuildPersonalRecords } from "../lib/workout-store";

const workoutScreen = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const historyScreen = readFileSync(resolve(process.cwd(), "app/workout-history/exercise.tsx"), "utf8");

describe("time-based exercise entries", () => {
  it("marks cardio and explicit duration movements as minute-based", () => {
    expect(isTimeBasedExercise(getExercise("treadmill"))).toBe(true);
    expect(isTimeBasedExercise(getExercise("rower"))).toBe(true);
    expect(isTimeBasedExercise(getExercise("plank"))).toBe(true);
    expect(isTimeBasedExercise(getExercise("bench-press"))).toBe(false);
  });

  it("does not create a 1RM record from minutes stored for a timed activity", () => {
    const records = rebuildPersonalRecords([{ id: "timed", programId: "conditioning", date: "2026-08-19", durationMinutes: 25, totalVolume: 0, sets: [{ exerciseId: "treadmill", weight: 0, reps: 25 }] }], "epley");
    expect(records.treadmill).toBeUndefined();
  });

  it("renders minutes without a weight editor and preserves minutes in history", () => {
    expect(workoutScreen).toContain('activeIsTimed ? "МИНУТЫ" : "ПОВТОРЫ"');
    expect(workoutScreen).toContain('placeholder={`план ${activePlan?.reps ?? "—"} мин`}');
    expect(workoutScreen).toContain("!activeIsTimed && <View style={styles.setEditorFieldWrap}");
    expect(historyScreen).toContain('isTimed ? "Минуты" : "Повторы"');
    expect(historyScreen).toContain('isTimed ? `${set.reps} мин` : set.reps');
  });
});
