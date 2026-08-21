import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const home = readFileSync(
  resolve(process.cwd(), "app/(tabs)/index.tsx"),
  "utf8",
);

describe("плавные интеракции тренировки и главного экрана", () => {
  it("показывает подтверждение изменения завершённого подхода с мягким подъёмом", () => {
    expect(workout).toContain("editingConfirmationSetIndex");
    expect(workout).toContain("editingConfirmationAnimatedStyle");
    expect(workout).toMatch(/duration:\s*220/);
    expect(workout).toMatch(/duration:\s*260/);
    expect(workout).toContain("Easing.out(Easing.cubic)");
    expect(workout).toContain("editConfirmBackdrop");
  });

  it("плавно смещает карточки упражнений и виджеты во время перестановки", () => {
    expect(workout).toMatch(/const animateDragLayout[\s\S]*?duration:\s*300/);
    expect(home).toContain("const animateWidgetLayout");
    expect(home).toMatch(/animateWidgetLayout[\s\S]*?duration:\s*300/);
    expect(home).toContain("dragging ? 210 : 260");
    expect(home).toContain("Easing.out(Easing.cubic)");
  });
});
