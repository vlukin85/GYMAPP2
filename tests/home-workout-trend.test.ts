import { describe, expect, it } from "vitest";
import { buildHomeWorkoutTrend } from "../lib/home-workout-trend";

describe("график завершённых тренировок главного экрана", () => {
  it("группирует реальные тренировки по датам и сохраняет хронологию", () => {
    const points = buildHomeWorkoutTrend([
      { id: "w-2", programId: "p", date: "2026-08-11", durationMinutes: 50, totalVolume: 4200, sets: [] },
      { id: "w-1", programId: "p", date: "2026-08-10", durationMinutes: 45, totalVolume: 3000, sets: [] },
      { id: "w-3", programId: "p", date: "2026-08-11", durationMinutes: 40, totalVolume: 800, sets: [] },
    ]);
    expect(points.map((point) => [point.date, point.volume, point.workouts])).toEqual([
      ["2026-08-10", 3000, 1],
      ["2026-08-11", 5000, 2],
    ]);
  });
});
