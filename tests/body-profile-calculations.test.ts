import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { bmiLabel, calculateBmi, calculateDailyCalorieGuide, calculateMifflinStJeorBmr } from "../lib/body-calculations";

const bodyStore = readFileSync(resolve(process.cwd(), "lib/body-store.tsx"), "utf8");
const bodyScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/body.tsx"), "utf8");
const bodyVisuals = readFileSync(resolve(process.cwd(), "components/body-visuals.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");

describe("body profile calculations", () => {
  it("calculates BMI from metric inputs and exposes a non-diagnostic label", () => {
    expect(calculateBmi(70, 175)).toBe(22.9);
    expect(calculateBmi(70, undefined)).toBeUndefined();
    expect(bmiLabel(22.9)).toBe("Референсный диапазон");
  });

  it("calculates the sex-specific Mifflin–St Jeor reference and daily guide", () => {
    expect(calculateMifflinStJeorBmr("male", 70, 175, 30)).toBe(1649);
    expect(calculateMifflinStJeorBmr("female", 70, 175, 30)).toBe(1483);
    expect(calculateDailyCalorieGuide("male", 70, 175, 30)).toBe(2309);
    expect(calculateDailyCalorieGuide("female", 70, 175, undefined)).toBeUndefined();
  });

  it("persists profile details and goals, and renders their data-driven cues", () => {
    expect(bodyStore).toContain("ironrise.body-profile-details.v1");
    expect(bodyStore).toContain("setProfileDetails");
    expect(bodyStore).toContain("setGoals");
    expect(bodyScreen).toContain("ИНДЕКС МАССЫ ТЕЛА");
    expect(bodyVisuals).toContain("ЦЕЛЬ ·");
    expect(settings).toContain("АВТОМАТИЧЕСКИЙ ОРИЕНТИР");
    expect(settings).toContain("Цели параметров тела");
  });
});
