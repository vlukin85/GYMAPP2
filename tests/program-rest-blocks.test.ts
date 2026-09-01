import { describe, expect, it } from "vitest";
import {
  getProgramRestBlockAfterExercise,
  estimateProgramDurationSeconds,
  formatProgramDuration,
  normalizeBetweenSetRestSeconds,
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

  it("нормализует интервал отдыха между подходами и сохраняет отсутствие значения для старых программ", () => {
    expect(normalizeBetweenSetRestSeconds(90)).toBe(90);
    expect(normalizeBetweenSetRestSeconds(1)).toBe(5);
    expect(normalizeBetweenSetRestSeconds(2_000)).toBe(1_800);
    expect(normalizeBetweenSetRestSeconds(undefined)).toBeUndefined();
  });

  it("считает суммарную длительность тренировки по упражнениям и интервалам", () => {
    const seconds = estimateProgramDurationSeconds(
      [
        { sets: 3, reps: 8, rest: 90, restBetweenSets: 90 },
        { sets: 2, reps: 10, rest: 60, restBetweenSets: 60 },
      ],
      [{ durationSeconds: 150 }],
    );
    expect(seconds).toBe(3 * 8 * 3 + 2 * 90 + 2 * 10 * 3 + 60 + 150);
    expect(formatProgramDuration(seconds)).toBe("8 мин 42 сек");
  });

  it("находит длительность переходного отдыха после завершённого упражнения", () => {
    expect(getProgramRestBlockAfterExercise(program, "squat")).toEqual(
      program.restBlocks?.[0],
    );
    expect(getProgramRestBlockAfterExercise(program, "bench-press")).toBeUndefined();
  });
});
