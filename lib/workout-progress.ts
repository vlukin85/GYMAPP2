export function getWorkoutProgress(completedExercises: number, totalExercises: number) {
  const total = Math.max(0, Math.floor(totalExercises));
  const completed = Math.max(0, Math.min(total, Math.floor(completedExercises)));
  return {
    completed,
    total,
    ratio: total ? completed / total : 0,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

export type WorkoutProgressSet = {
  type?: string;
  dropSubsets?: unknown[];
};

/** Counts a drop-set as its visible sub-sets and every other row as one set. */
export function countWorkoutSetUnits(sets: WorkoutProgressSet[]) {
  return sets.reduce((total, set) => total + (set.type === "drop" && set.dropSubsets?.length ? set.dropSubsets.length : 1), 0);
}
