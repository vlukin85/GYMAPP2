import { describe, expect, it } from "vitest";
import { formatForecastDuration, getWorkoutFinishForecast } from "../lib/workout-finish-forecast";

describe("прогноз окончания тренировки", () => {
  it("оценивает оставшееся время по текущему темпу завершённых подходов", () => {
    expect(getWorkoutFinishForecast(600, 4, 10, 1_700_000_000_000)).toEqual({
      remainingSets: 6,
      secondsPerSet: 150,
      secondsRemaining: 900,
      estimatedFinishAt: 1_700_000_900_000,
    });
  });

  it("ждёт первый завершённый подход, прежде чем строить прогноз", () => {
    expect(getWorkoutFinishForecast(120, 0, 8).estimatedFinishAt).toBeNull();
    expect(formatForecastDuration(90)).toBe("≈ 2 мин");
  });
});
