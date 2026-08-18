export type WorkoutSetEntry = { reps: string; weight: string; type: string };
export type HistoricalWeightSet = { weight: number; reps: number; drop?: { weight: string; reps: string }[] };

function isCompleteWorkingSet(set: WorkoutSetEntry | undefined) {
  if (!set || set.type !== "working" || !set.reps.trim() || !set.weight.trim()) return false;
  const reps = Number(set.reps);
  const weight = Number(set.weight);
  return Number.isInteger(reps) && reps > 0 && Number.isFinite(weight) && weight >= 0;
}

/** Finds the latest completed working set before the target position. */
export function getPreviousWorkingResult<T extends WorkoutSetEntry>(sets: T[], targetIndex: number) {
  for (let index = targetIndex - 1; index >= 0; index -= 1) {
    if (isCompleteWorkingSet(sets[index])) return { reps: sets[index].reps, weight: sets[index].weight };
  }
  return null;
}

/** Pre-fills an entirely empty working set from the latest completed working set. */
export function prefillWorkingSet<T extends WorkoutSetEntry>(sets: T[], targetIndex: number, plannedResult?: { reps: string; weight: string }): T[] {
  const target = sets[targetIndex];
  if (!target || target.type !== "working" || target.reps.trim() || target.weight.trim()) return sets;
  const previous = getPreviousWorkingResult(sets, targetIndex) ?? plannedResult;
  if (!previous || !previous.reps.trim() || !previous.weight.trim()) return sets;
  return sets.map((set, index) => index === targetIndex ? { ...set, reps: previous.reps, weight: previous.weight } : set);
}

/** Returns three sensible values around the current, previous, or planned weight. */
export function getQuickWeightOptions(currentWeight: string, fallbackWeight: string, incrementKg: number) {
  const current = Number(currentWeight);
  const fallback = Number(fallbackWeight);
  const base = Number.isFinite(current) && currentWeight.trim() !== "" ? current : fallback;
  const step = Number.isFinite(incrementKg) && incrementKg > 0 ? incrementKg : 2.5;
  if (!Number.isFinite(base) || base < 0) return [];
  return [...new Set([Math.max(0, base - step), base, base + step].map((weight) => Number(weight.toFixed(2))))].map(String);
}

/** Uses the most recent recorded weights for this movement; falls back to the planned-weight range when history is empty. */
export function getHistoricalQuickWeightOptions(historySets: HistoricalWeightSet[], fallbackWeight: string, incrementKg: number, maximum = 3) {
  const historicalWeights = historySets
    .flatMap((set) => set.drop?.length ? set.drop.map((part) => Number(part.weight)) : [set.weight])
    .filter((weight) => Number.isFinite(weight) && weight > 0);
  const uniqueHistory = [...new Set(historicalWeights.map((weight) => Number(weight.toFixed(2))))].slice(0, maximum).map(String);
  return uniqueHistory.length ? uniqueHistory : getQuickWeightOptions("", fallbackWeight, incrementKg);
}
