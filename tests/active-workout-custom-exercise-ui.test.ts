import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");

describe("создание упражнения из поиска активной тренировки", () => {
  it("предлагает создать упражнение, когда непустой поисковый запрос не дал результатов", () => {
    expect(workout).toContain("catalogSearch.trim().length > 0");
    expect(workout).toContain("не найдено в каталоге");
    expect(workout).toContain("ДОБАВИТЬ НОВОЕ УПРАЖНЕНИЕ");
    expect(workout).toContain("openCustomExerciseCreator");
  });

  it("сохраняет упражнение в личной базе и сразу добавляет его в активную программу", () => {
    expect(workout).toContain("addCustomExercise");
    expect(workout).toContain("createAndAddCustomExercise");
    expect(workout).toContain("СОЗДАТЬ И ДОБАВИТЬ");
    expect(workout).toContain("addExerciseToSession(exercise)");
    expect(workout).toContain("customExercises");
  });
});
