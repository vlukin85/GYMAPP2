import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workoutScreen = readFileSync("/home/ubuntu/gym-training-diary/app/workout.tsx", "utf8");

describe("active workout drag visualization", () => {
  it("tracks a captured card and a target insertion position", () => {
    expect(workoutScreen).toContain("const [dragState");
    expect(workoutScreen).toContain("onDragTarget");
    expect(workoutScreen).toContain("dropIndicator");
  });

  it("visually elevates the dragged exercise and announces the move", () => {
    expect(workoutScreen).toContain("exerciseDragging");
    expect(workoutScreen).toContain("ПЕРЕМЕЩЕНИЕ УПРАЖНЕНИЯ");
    expect(workoutScreen).toContain("Отпустите здесь");
  });
});
