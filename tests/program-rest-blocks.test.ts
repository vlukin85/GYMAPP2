import { describe, expect, it } from "vitest";
import {
  getProgramRestBlockAfterExercise,
  normalizeProgramRestBlocks,
  type WorkoutProgram,
} from "../lib/workout-data";

const program: WorkoutProgram = {
  id: "rest-test",
  name: "Тест отдыха",
  description: "",
  exercises: [
    { exerciseId: "squat", sets: 3, reps: 8, weight: 80, rest: 90 },
    { exerciseId: "bench-press", sets: 3, reps: 8, weight: 60, rest: 90 },
  ],
  restBlocks: [
    { id: "transition", afterExerciseId: "squat", durationSeconds: 150 },
  ],
};

describe("блоки отдыха программы", () => {
  it("оставляет только один валидный блок после упражнения и ограничивает длительность", () => {
    expect(
      normalizeProgramRestBlocks(
        [
          { id: "first", afterExerciseId: "squat", durationSeconds: 120 },
          { id: "duplicate", afterExerciseId: "squat", durationSeconds: 180 },
          { id: "unknown", afterExerciseId: "missing", durationSeconds: 90 },
          { id: "short", afterExerciseId: "bench-press", durationSeconds: 1 },
        ],
        ["squat", "bench-press"],
      ),
    ).toEqual([
      { id: "first", afterExerciseId: "squat", durationSeconds: 120 },
      { id: "short", afterExerciseId: "bench-press", durationSeconds: 15 },
    ]);
  });

  it("находит длительность переходного отдыха после завершённого упражнения", () => {
    expect(getProgramRestBlockAfterExercise(program, "squat")).toEqual(
      program.restBlocks?.[0],
    );
    expect(getProgramRestBlockAfterExercise(program, "bench-press")).toBeUndefined();
  });
});
