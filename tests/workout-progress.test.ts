import { describe, expect, it } from "vitest";
import { getWorkoutProgress } from "../lib/workout-progress";

describe("прогресс активной тренировки", () => {
  it("считает завершённые упражнения и процент", () => {
    expect(getWorkoutProgress(2, 5)).toEqual({ completed: 2, total: 5, ratio: 0.4, percent: 40 });
  });

  it("ограничивает недопустимые значения", () => {
    expect(getWorkoutProgress(8, 3)).toEqual({ completed: 3, total: 3, ratio: 1, percent: 100 });
    expect(getWorkoutProgress(1, 0).percent).toBe(0);
  });
});
