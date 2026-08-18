import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync("/home/ubuntu/gym-training-diary/app/(tabs)/stats.tsx", "utf8");

describe("advanced statistics UI", () => {
  it("shows an interactive 1RM history chart after an exercise is selected", () => {
    expect(screen).toContain("getExercisePersonalRecordHistory");
    expect(screen).toContain("Динамика 1RM");
    expect(screen).toContain('pathname: "/workout-history/[id]"');
  });

  it("persists the selected exercise together with period filters and renders comparisons", () => {
    expect(screen).toContain("loadStatsPreferences");
    expect(screen).toContain("saveStatsPreferences");
    expect(screen).toContain("PeriodComparison");
    expect(screen).toContain("Сравнение с");
  });
});
