import { describe, expect, it } from "vitest";
import { bestOneRepMax, calculateBarbellPlateLayout, calculateVolume, estimateOneRepMax, formatDuration, formatPlateLayout, getLoadZones, roundToWeightIncrement } from "../lib/workout-data";
import { buildTrainingCsv } from "../lib/training-export";

describe("workout calculations", () => {
  it("calculates volume from weight, reps and sets", () => {
    expect(calculateVolume(40, 8, 3)).toBe(960);
  });
  it("formats duration in hours and minutes", () => {
    expect(formatDuration(67)).toBe("1 ч 7 мин");
  });
  it("estimates one-rep max with the Epley formula", () => {
    expect(estimateOneRepMax(80, 5)).toBeCloseTo(93.333, 2);
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });
  it("returns the best estimated one-rep max and handles empty work", () => {
    expect(bestOneRepMax([{ weight: 80, reps: 5 }, { weight: 85, reps: 3 }])).toBeCloseTo(93.5, 1);
    expect(bestOneRepMax([{ weight: 0, reps: 10 }])).toBe(0);
  });
  it("supports the Brzycki formula and calculates load zones", () => {
    expect(estimateOneRepMax(80, 5, "brzycki")).toBeCloseTo(90, 1);
    expect(getLoadZones(100)).toEqual([{ percent: 70, weight: 70 }, { percent: 80, weight: 80 }, { percent: 90, weight: 90 }]);
    expect(roundToWeightIncrement(73.6, 2.5)).toBe(72.5);
    expect(roundToWeightIncrement(73.6, 1.25)).toBe(73.75);
  });
  it("calculates a symmetric barbell plate layout", () => {
    const layout = calculateBarbellPlateLayout(100, { barWeightKg: 20, availablePlatesKg: [25, 20, 10, 5, 2.5] });
    expect(layout.loadedWeightKg).toBe(100);
    expect(layout.perSide).toEqual([25, 10, 5]);
    expect(formatPlateLayout(layout.perSide)).toBe("25 + 10 + 5");
  });
  it("builds an Excel-friendly CSV history export", () => {
    const csv = buildTrainingCsv([{ date: "2026-08-13", programId: "upper-strength", exerciseId: "bench-press", setNumber: 1, reps: 6, weightCentiKg: 8000, volumeCentiKg: 48000, oneRepMaxCentiKg: 9600 }]);
    expect(csv).toContain('"Упражнение"');
    expect(csv).toContain('"bench-press"');
    expect(csv).toContain('"80.00"');
  });
});
