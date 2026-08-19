import type { BodyProfile } from "./body-store";

export function calculateBmi(weightKg?: number, heightCm?: number) {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return undefined;
  return Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1));
}

export function bmiLabel(bmi?: number) {
  if (bmi === undefined) return "Нужны вес и рост";
  if (bmi < 18.5) return "Ниже диапазона";
  if (bmi < 25) return "Референсный диапазон";
  if (bmi < 30) return "Выше диапазона";
  return "Высокий показатель";
}

export function calculateMifflinStJeorBmr(profile: BodyProfile, weightKg?: number, heightCm?: number, ageYears?: number) {
  if (!weightKg || !heightCm || !ageYears || weightKg <= 0 || heightCm <= 0 || ageYears <= 0) return undefined;
  const sexAdjustment = profile === "male" ? 5 : -161;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageYears + sexAdjustment);
}

/** A transparent moderate-activity estimate (BMR × 1.4), not a medical prescription. */
export function calculateDailyCalorieGuide(profile: BodyProfile, weightKg?: number, heightCm?: number, ageYears?: number) {
  const bmr = calculateMifflinStJeorBmr(profile, weightKg, heightCm, ageYears);
  return bmr === undefined ? undefined : Math.round(bmr * 1.4);
}
