import { describe, expect, it } from "vitest";
import { calculateVolume, formatDuration } from "../lib/workout-data";

describe("workout calculations", () => {
  it("calculates volume from weight, reps and sets", () => {
    expect(calculateVolume(40, 8, 3)).toBe(960);
  });
  it("formats duration in hours and minutes", () => {
    expect(formatDuration(67)).toBe("1 ч 7 мин");
  });
});
