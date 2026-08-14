import { describe, expect, it } from "vitest";
import { normalizeAiProgram } from "../lib/ai-program";
import { exercises } from "../lib/workout-data";

describe("AI program normalization", () => {
  it("keeps only catalog exercises and clamps training parameters", () => {
    const program = normalizeAiProgram({
      name: "Сила верха",
      description: "Тяжёлая тренировка груди и спины",
      exercises: [
        { exerciseId: "bench-press", sets: 20, reps: 0, weight: 700, rest: 10, setType: "working" },
        { exerciseId: "missing-movement", sets: 3, reps: 8, weight: 50, rest: 90 },
        { exerciseName: "Тяга штанги в наклоне", sets: 4, reps: 8, weight: 70, rest: 120, setType: "warmup" },
      ],
    }, exercises);

    expect(program.exercises).toEqual([
      { exerciseId: "bench-press", sets: 8, reps: 1, weight: 500, rest: 30, setType: "working", supersetGroup: undefined },
      { exerciseId: "barbell-row", sets: 4, reps: 8, weight: 70, rest: 120, setType: "warmup", supersetGroup: undefined },
    ]);
  });

  it("rejects a model response without at least two valid catalog exercises", () => {
    expect(() => normalizeAiProgram({ exercises: [{ exerciseId: "missing" }] }, exercises)).toThrow("не подобрал достаточно упражнений");
  });
});
