import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workoutScreen = readFileSync(
  resolve(process.cwd(), "app/workout.tsx"),
  "utf8",
);

describe("workout completion feedback", () => {
  it("показывает в таймере текущие состояния звука и вибрации", () => {
    expect(workoutScreen).toContain("Звук выкл.");
    expect(workoutScreen).toContain("Вибрация выкл.");
    expect(workoutScreen).toContain("restAlertStatus");
  });

  it("starts rest only from the explicit set-completion action", () => {
    const finishSetBlock = workoutScreen.slice(
      workoutScreen.indexOf("const finishFocusedSet"),
      workoutScreen.indexOf("const focusedSet"),
    );
    const saveExerciseBlock = workoutScreen.slice(
      workoutScreen.indexOf("const saveExercise"),
      workoutScreen.indexOf("const removeExerciseFromSession"),
    );
    expect(finishSetBlock).toContain("startRestAfterSetInput");
    expect(saveExerciseBlock).not.toContain("startRestTimer");
    expect(workoutScreen).not.toContain(
      "onEndEditing={() => startRestAfterSetInput",
    );
  });

  it("сразу сохраняет завершённый подход для расчёта общего прогресса программы", () => {
    const finishSetBlock = workoutScreen.slice(
      workoutScreen.indexOf("const finishFocusedSet"),
      workoutScreen.indexOf("const focusedSet"),
    );
    expect(finishSetBlock).toContain("setSetsByExercise");
    expect(finishSetBlock).toContain("[activeId]: draft");
    expect(workoutScreen).toContain("const completedSetCount");
    expect(workoutScreen).toContain("setsByExercise[item.exerciseId]");
  });

  it("uses a green check mark for an exercise saved as complete", () => {
    expect(workoutScreen).toMatch(
      /backgroundColor:\s*filled\s*\?\s*colors\.success/,
    );
    expect(workoutScreen).toContain('name="check"');
  });
});
