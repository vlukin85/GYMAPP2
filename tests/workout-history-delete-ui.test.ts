import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync("/home/ubuntu/gym-training-diary/app/workout-history/[id].tsx", "utf8");

describe("completed workout deletion from history", () => {
  it("confirms deletion and returns to the updated previous screen", () => {
    expect(screen).toContain("Удалить выполненную тренировку?");
    expect(screen).toContain("deleteCompletedWorkout(workout.id)");
    expect(screen).toContain("Статистика и личные рекорды будут пересчитаны");
    expect(screen).toContain("router.back()");
  });
});
