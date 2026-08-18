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

  it("keeps a single edge auto-scroll loop and previews neighbouring-card movement", () => {
    expect(workoutScreen).toContain("DRAG_AUTOSCROLL_EDGE_PX");
    expect(workoutScreen).toContain("autoScrollTimerRef");
    expect(workoutScreen).toContain("renderedSessionExercises");
    expect(workoutScreen).toContain("LayoutAnimation.configureNext");
  });
});
