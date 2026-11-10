import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Русские подписи живут в словаре домена workout, поэтому экран проверяется
// вместе со своим словарём локализации (как экран настроек с доменом settings).
const workoutDict = readFileSync(
  resolve(process.cwd(), "lib/i18n/domains/workout.ts"),
  "utf8",
);

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8") + workoutDict;
const summary = readFileSync(resolve(process.cwd(), "app/workout-summary.tsx"), "utf8") + workoutDict;
const stats = readFileSync(resolve(process.cwd(), "app/(tabs)/stats.tsx"), "utf8") + readFileSync(resolve(process.cwd(), "lib/i18n/domains/stats.ts"), "utf8");

describe("cardio presentation", () => {
  it("provides distance in the active result editor and persists it", () => {
    expect(workout).toContain("ДИСТАНЦИЯ, КМ");
    expect(workout).toContain("distanceKm: primary.distanceKm");
  });

  it("shows pace in the workout summary and weekly cardio time in stats", () => {
    // Темп приходит из lib/cardio-metrics с языком экрана: «мин/км» / «min/km».
    expect(summary).toContain("formatCardioPace(cardio.paceSecondsPerKm, lang)");
    expect(stats).toContain("КАРДИО · 7 ДНЕЙ");
    // Подписи дней недели на графике кардио берутся с языком экрана.
    expect(stats).toContain("getWeeklyCardioMinutes(completed, undefined, lang)");
  });
});
