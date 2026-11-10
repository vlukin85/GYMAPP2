import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Русские подписи живут в словаре домена workout, поэтому экран проверяется
// вместе со своим словарём локализации (как экран настроек с доменом settings).
const workoutDict = readFileSync(
  resolve(process.cwd(), "lib/i18n/domains/workout.ts"),
  "utf8",
);

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const summary = readFileSync(resolve(process.cwd(), "app/workout-summary.tsx"), "utf8") + workoutDict;
const store = readFileSync(resolve(process.cwd(), "lib/workout-store.tsx"), "utf8");

describe("пульс в итогах тренировки", () => {
  it("сохраняет временной ряд и уточняет калории реальными данными часов", () => {
    expect(workout).toContain("calculateHeartRateWorkoutEnergy");
    expect(workout).toContain("heartRateSamples: heartRateAnalysis.samples");
    expect(workout).toContain('caloriesMethod: heartRateCalories === undefined ? "met" : "heart-rate"');
    expect(store).toContain("heartRateZones");
  });

  it("отображает график и зоны только из сохранённых данных завершённой тренировки", () => {
    expect(summary).toContain("ПУЛЬС · ИНТЕНСИВНОСТЬ");
    expect(summary).toContain("HeartRateInsights");
    expect(summary).toContain("Расход уточнён по пульсу часов");
  });
});
