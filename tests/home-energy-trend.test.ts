import { describe, expect, it } from "vitest";
import { buildHomeEnergyTrend } from "../lib/home-energy-trend";

describe("недельный расход калорий на главном экране", () => {
  it("строит семь хронологических дней и добавляет калории только завершённых тренировок", () => {
    const points = buildHomeEnergyTrend(
      new Date("2026-08-20T12:00:00Z"),
      [
        { id: "w-1", programId: "p", date: "2026-08-18", durationMinutes: 50, totalVolume: 4000, sets: [], caloriesBurned: 120 },
        { id: "w-2", programId: "p", date: "2026-08-20", durationMinutes: 45, totalVolume: 3200, sets: [], caloriesBurned: 80 },
      ],
      { profile: "male", weightKg: 80, heightCm: 180, ageYears: 30, activityLevel: "light" },
    );

    expect(points).toHaveLength(7);
    expect(points.map((point) => point.date)).toEqual(["2026-08-14", "2026-08-15", "2026-08-16", "2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20"]);
    expect(points[4].workoutCalories).toBe(120);
    expect(points[6].workoutCalories).toBe(80);
    expect(points[4].totalCalories - points[3].totalCalories).toBe(120);
  });
});
