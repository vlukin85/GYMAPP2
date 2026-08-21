import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workoutScreen = readFileSync("/home/ubuntu/gym-training-diary/app/workout.tsx", "utf8");

describe("workout completion feedback", () => {
  it("starts rest only from the explicit set-completion action", () => {
    const finishSetBlock = workoutScreen.slice(workoutScreen.indexOf("const finishFocusedSet"), workoutScreen.indexOf("const focusedSet"));
    const saveExerciseBlock = workoutScreen.slice(workoutScreen.indexOf("const saveExercise"), workoutScreen.indexOf("const removeExerciseFromSession"));
    expect(finishSetBlock).toContain("startRestAfterSetInput");
    expect(saveExerciseBlock).not.toContain("startRestTimer");
    expect(workoutScreen).not.toContain("onEndEditing={() => startRestAfterSetInput");
  });

  it("сразу сохраняет завершённый подход для расчёта общего прогресса программы", () => {
    const finishSetBlock = workoutScreen.slice(workoutScreen.indexOf("const finishFocusedSet"), workoutScreen.indexOf("const focusedSet"));
    expect(finishSetBlock).toContain("setSetsByExercise");
    expect(finishSetBlock).toContain("[activeId]: draft");
    expect(workoutScreen).toContain("const completedSetCount");
    expect(workoutScreen).toContain("setsByExercise[item.exerciseId]");
  });

  it("uses a green check mark for an exercise saved as complete", () => {
    expect(workoutScreen).toContain('backgroundColor: filled ? colors.success');
    expect(workoutScreen).toContain('name="check"');
  });
});
