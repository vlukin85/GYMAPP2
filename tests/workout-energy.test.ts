import { describe, expect, it } from "vitest";
import { calculateDailyEnergy, calculateHeartRateWorkoutEnergy, calculateWorkoutEnergy } from "../lib/workout-energy";

describe("расход энергии тренировок", () => {
  it("разделяет калории активных подходов и фактического отдыха", () => {
    const energy = calculateWorkoutEnergy({ weightKg: 80, activeSeconds: 600, restSeconds: 300 });

    expect(energy).toEqual({ activeCalories: 84, restCalories: 11, totalCalories: 95 });
  });

  it("добавляет тренировку к базовому и повседневному расходу дня", () => {
    const daily = calculateDailyEnergy({
      profile: "male",
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      workoutCalories: 95,
    });

    expect(daily.restingCalories).toBe(1780);
    expect(daily.movementCalories).toBe(356);
    expect(daily.workoutCalories).toBe(95);
    expect(daily.totalCalories).toBe(2231);
    expect(daily.isPersonalizedRestingEstimate).toBe(true);
  });

  it("использует реальный средний пульс только при достаточных данных профиля и часов", () => {
    expect(calculateHeartRateWorkoutEnergy({ profile: "male", ageYears: 30, weightKg: 80, averageHeartRateBpm: 140, sampleCount: 8, durationSeconds: 1800 })).toBe(396);
    expect(calculateHeartRateWorkoutEnergy({ profile: "male", ageYears: 30, weightKg: 80, averageHeartRateBpm: 140, sampleCount: 1, durationSeconds: 1800 })).toBeUndefined();
  });
});
