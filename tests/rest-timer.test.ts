import { describe, expect, it } from "vitest";
import { getRemainingRestSeconds, getRestProgress } from "../lib/rest-timer";

describe("таймер отдыха", () => {
  it("считает остаток по времени окончания, а не по числу тиков", () => {
    expect(getRemainingRestSeconds(12_500, 10_000)).toBe(3);
    expect(getRemainingRestSeconds(10_000, 10_000)).toBe(0);
    expect(getRemainingRestSeconds(9_000, 10_000)).toBe(0);
  });

  it("возвращает ограниченный круговой прогресс", () => {
    expect(getRestProgress(45, 90)).toBe(0.5);
    expect(getRestProgress(100, 90)).toBe(1);
    expect(getRestProgress(-4, 90)).toBe(0);
    expect(getRestProgress(10, 0)).toBe(0);
  });
});
