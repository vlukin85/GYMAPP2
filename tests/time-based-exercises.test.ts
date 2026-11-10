import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getExercise, isTimeBasedExercise } from "../lib/workout-data";
import { rebuildPersonalRecords } from "../lib/workout-store";

// Русские подписи живут в словаре домена workout, поэтому экран проверяется
// вместе со своим словарём локализации (как экран настроек с доменом settings).
const workoutDict = readFileSync(
  resolve(process.cwd(), "lib/i18n/domains/workout.ts"),
  "utf8",
);

const workoutScreen = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8") + workoutDict;
const historyScreen = readFileSync(resolve(process.cwd(), "app/workout-history/exercise.tsx"), "utf8") + workoutDict;

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
    // Подписи полей и подсказки плана берутся из домена workout.
    expect(workoutScreen).toContain('t("workout.setEditor.minutes")');
    expect(workoutScreen).toContain('t("workout.setEditor.reps")');
    expect(workoutScreen).toContain('t("workout.editor.planMinutes"');
    expect(workoutScreen).toMatch(
      /!activeIsTimed\s*&&\s*\(\s*<View\s+style=\{styles\.setEditorFieldWrap\}/,
    );
    expect(historyScreen).toContain('t("workout.historyExercise.minutes")');
    expect(historyScreen).toContain('t("workout.historyExercise.reps")');
    expect(historyScreen).toContain('t("workout.unit.min")');
  });
});
