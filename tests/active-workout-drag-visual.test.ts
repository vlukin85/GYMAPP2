import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Русские подписи живут в словаре домена workout, поэтому экран проверяется
// вместе со своим словарём локализации (как экран настроек с доменом settings).
const workoutDict = readFileSync(
  resolve(process.cwd(), "lib/i18n/domains/workout.ts"),
  "utf8",
);

const workoutScreen = readFileSync(
  resolve(process.cwd(), "app/workout.tsx"),
  "utf8",
) + workoutDict;

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
