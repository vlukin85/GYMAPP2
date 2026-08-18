export type WorkoutSetEntry = { reps: string; weight: string; type: string };

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
export function prefillWorkingSet<T extends WorkoutSetEntry>(sets: T[], targetIndex: number): T[] {
  const target = sets[targetIndex];
  if (!target || target.type !== "working" || target.reps.trim() || target.weight.trim()) return sets;
  const previous = getPreviousWorkingResult(sets, targetIndex);
  if (!previous) return sets;
  return sets.map((set, index) => index === targetIndex ? { ...set, ...previous } : set);
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
