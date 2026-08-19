import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync("/home/ubuntu/gym-training-diary/app/exercise/[id].tsx", "utf8");

describe("exercise personal-record history UI", () => {
  it("renders record improvements from the local completed-workout history", () => {
    expect(screen).toContain("getExercisePersonalRecordHistory");
    expect(screen).toContain("ИСТОРИЯ РЕКОРДОВ");
    expect(screen).toContain("Только тренировки, в которых результат стал лучше");
  });
});
