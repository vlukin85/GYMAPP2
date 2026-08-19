import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const summary = readFileSync(resolve(process.cwd(), "app/workout-summary.tsx"), "utf8");
const stats = readFileSync(resolve(process.cwd(), "app/(tabs)/stats.tsx"), "utf8");

describe("cardio presentation", () => {
  it("provides distance in the active result editor and persists it", () => {
    expect(workout).toContain("ДИСТАНЦИЯ, КМ");
    expect(workout).toContain("distanceKm: primary.distanceKm");
  });

  it("shows pace in the workout summary and weekly cardio time in stats", () => {
    expect(summary).toContain("formatCardioPace(cardio.paceSecondsPerKm)");
    expect(stats).toContain("КАРДИО · 7 ДНЕЙ");
    expect(stats).toContain("getWeeklyCardioMinutes(completed)");
  });
});
