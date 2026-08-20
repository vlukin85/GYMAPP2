import { DAILY_ACTIVITY_LEVELS, type BodyProfile, type DailyActivityLevel } from "./body-store";
import { calculateMifflinStJeorBmr } from "./body-calculations";

const ACTIVE_STRENGTH_MET = 6;
const REST_MET = 1.5;

export type WorkoutEnergyInput = {
  weightKg: number;
  activeSeconds: number;
  restSeconds: number;
};

export type WorkoutEnergyEstimate = {
  activeCalories: number;
  restCalories: number;
  totalCalories: number;
};

export type HeartRateEnergyInput = {
  profile: BodyProfile;
  ageYears?: number;
  weightKg: number;
  averageHeartRateBpm?: number;
  sampleCount?: number;
  durationSeconds: number;
};

/**
 * Keytel et al. (2005) estimate. It is used only when a real average HR, age, body mass,
 * and at least three observed samples are available; otherwise the caller retains the MET result.
 */
export function calculateHeartRateWorkoutEnergy(input: HeartRateEnergyInput) {
  const ageYears = input.ageYears;
  const averageHeartRateBpm = input.averageHeartRateBpm;
  const durationMinutes = Math.max(0, input.durationSeconds) / 60;
  if (!Number.isFinite(ageYears) || !Number.isFinite(averageHeartRateBpm) || !Number.isFinite(input.weightKg) || ageYears! < 18 || ageYears! > 80 || averageHeartRateBpm! < 45 || averageHeartRateBpm! > 220 || input.weightKg <= 0 || durationMinutes < 1 || (input.sampleCount ?? 0) < 3) return undefined;
  const kilojoulesPerMinute = input.profile === "male"
    ? -55.0969 + 0.6309 * averageHeartRateBpm! + 0.1988 * input.weightKg + 0.2017 * ageYears!
    : -20.4022 + 0.4472 * averageHeartRateBpm! - 0.1263 * input.weightKg + 0.074 * ageYears!;
  return Math.max(0, Math.round((kilojoulesPerMinute / 4.184) * durationMinutes));
}

function caloriesFromMet(met: number, weightKg: number, seconds: number) {
  return met * 3.5 * Math.max(1, weightKg) / 200 * (Math.max(0, seconds) / 60);
}

/**
 * A transparent MET-based estimate for strength training. It separates actively performed
 * sets from breaks rather than assigning one intensity to the full elapsed session.
 */
export function calculateWorkoutEnergy(input: WorkoutEnergyInput): WorkoutEnergyEstimate {
  const activeCalories = Math.round(caloriesFromMet(ACTIVE_STRENGTH_MET, input.weightKg, input.activeSeconds));
  const restCalories = Math.round(caloriesFromMet(REST_MET, input.weightKg, input.restSeconds));
  return { activeCalories, restCalories, totalCalories: activeCalories + restCalories };
}

export type DailyEnergyInput = {
  profile: BodyProfile;
  weightKg: number;
  heightCm?: number;
  ageYears?: number;
  activityLevel?: DailyActivityLevel;
  workoutCalories?: number;
};

export type DailyEnergyEstimate = {
  restingCalories: number;
  movementCalories: number;
  workoutCalories: number;
  totalCalories: number;
  isPersonalizedRestingEstimate: boolean;
};

/**
 * Daily expenditure = resting needs + a selected everyday-movement estimate + completed training.
 * If height or age are missing, 1 kcal/kg/hour is used as an explicitly less-personalized fallback.
 */
export function calculateDailyEnergy(input: DailyEnergyInput): DailyEnergyEstimate {
  const personalizedResting = calculateMifflinStJeorBmr(input.profile, input.weightKg, input.heightCm, input.ageYears);
  const restingCalories = personalizedResting ?? Math.round(Math.max(1, input.weightKg) * 24);
  const movementShare = DAILY_ACTIVITY_LEVELS.find((level) => level.id === (input.activityLevel ?? "light"))?.movementShare ?? 0.2;
  const movementCalories = Math.round(restingCalories * movementShare);
  const workoutCalories = Math.max(0, Math.round(input.workoutCalories ?? 0));
  return {
    restingCalories,
    movementCalories,
    workoutCalories,
    totalCalories: restingCalories + movementCalories + workoutCalories,
    isPersonalizedRestingEstimate: personalizedResting !== undefined,
  };
}
