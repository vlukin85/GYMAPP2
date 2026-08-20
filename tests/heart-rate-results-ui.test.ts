import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const summary = readFileSync(resolve(process.cwd(), "app/workout-summary.tsx"), "utf8");
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
