import type { BodyProfile } from "./body-store";
import { calculateMifflinStJeorBmr } from "./body-calculations";

const ACTIVE_STRENGTH_MET = 6;
const REST_MET = 1.5;
const DAILY_MOVEMENT_SHARE = 0.2;

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
 * Daily expenditure = resting needs + a modest everyday-movement estimate + completed training.
 * If height or age are missing, 1 kcal/kg/hour is used as an explicitly less-personalized fallback.
 */
export function calculateDailyEnergy(input: DailyEnergyInput): DailyEnergyEstimate {
  const personalizedResting = calculateMifflinStJeorBmr(input.profile, input.weightKg, input.heightCm, input.ageYears);
  const restingCalories = personalizedResting ?? Math.round(Math.max(1, input.weightKg) * 24);
  const movementCalories = Math.round(restingCalories * DAILY_MOVEMENT_SHARE);
  const workoutCalories = Math.max(0, Math.round(input.workoutCalories ?? 0));
  return {
    restingCalories,
    movementCalories,
    workoutCalories,
    totalCalories: restingCalories + movementCalories + workoutCalories,
    isPersonalizedRestingEstimate: personalizedResting !== undefined,
  };
}
