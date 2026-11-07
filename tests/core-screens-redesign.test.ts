import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Редизайн ключевых экранов под эталон «Тёмный атлет / Dark Energy».
 * Grep-проверки: экраны берут форму и метрики из design-tokens,
 * используют скругления карточек, табличные цифры и мягкое нажатие.
 */

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const coreScreens = {
  home: read("app/(tabs)/index.tsx"),
  exercises: read("app/(tabs)/exercises.tsx"),
  programs: read("app/(tabs)/programs.tsx"),
  stats: read("app/(tabs)/stats.tsx"),
  workout: read("app/workout.tsx"),
  workoutSummary: read("app/workout-summary.tsx"),
  progress: read("app/progress.tsx"),
};

describe("core screens redesign", () => {
  it("imports the shared design tokens on every key screen", () => {
    for (const [name, source] of Object.entries(coreScreens)) {
      expect(source, name).toContain('from "@/lib/design-tokens"');
    }
  });

  it("uses card and tile radii from tokens instead of sharp corners", () => {
    for (const [name, source] of Object.entries(coreScreens)) {
      expect(source, name).toContain("radius.card");
      expect(source, name).not.toContain("borderRadius: 0");
    }
    expect(coreScreens.exercises).toContain("radius.tile");
    expect(coreScreens.programs).toContain("radius.tile");
    expect(coreScreens.workout).toContain("radius.tile");
  });

  it("keeps numeric readouts on tabular figures", () => {
    for (const [name, source] of Object.entries(coreScreens)) {
      expect(source, name).toMatch(/tabular-nums/);
    }
  });

  it("applies the shared pressed feedback token", () => {
    for (const [name, source] of Object.entries(coreScreens)) {
      expect(source, name).toContain("pressedOpacity");
      expect(source, name).not.toMatch(/pressed \? 0\.\d+ : 1/);
    }
  });

  it("drops the legacy editorial accent colors from the key screens", () => {
    for (const [name, source] of Object.entries(coreScreens)) {
      expect(source, name).not.toContain("#1746D2");
      expect(source, name).not.toContain("#E72B25");
      expect(source, name).not.toContain("#272624");
    }
  });

  it("builds the «Сегодня» screen around greeting, workout of the day and week bars", () => {
    const { home } = coreScreens;
    expect(home).toContain("Тренировка дня");
    expect(home).toContain("Начать тренировку");
    expect(home).toContain("weekBars");
    expect(home).toContain("weekStatValue");
    expect(home).toContain("ЦИТАТА ДНЯ");
    expect(home).toContain("heroGreeting");
  });

  it("keeps the workout header timer and rest ring on token typography", () => {
    const { workout } = coreScreens;
    expect(workout).toContain("navExit");
    expect(workout).toMatch(/timer:\s*\{[\s\S]*?fontSize:\s*26/);
    expect(workout).toMatch(
      /restOverlayCard:\s*\{[\s\S]*?borderRadius:\s*radius\.card/,
    );
    expect(workout).toContain("completedSetField");
  });
});
