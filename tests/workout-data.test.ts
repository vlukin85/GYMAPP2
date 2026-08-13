import { describe, expect, it } from "vitest";
import { bestOneRepMax, calculateVolume, estimateOneRepMax, formatDuration } from "../lib/workout-data";

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
});
