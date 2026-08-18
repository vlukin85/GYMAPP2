import { bestOneRepMax, type CompletedWorkout, type OneRepMaxFormula } from "./workout-data";

export type PersonalRecordHistoryPoint = { workoutId: string; date: string; weight: number; reps: number; estimatedOneRepMax: number };

export function getExercisePersonalRecordHistory(completed: CompletedWorkout[], exerciseId: string, formula: OneRepMaxFormula): PersonalRecordHistoryPoint[] {
  const ordered = [...completed].sort((first, second) => `${first.date}-${first.id}`.localeCompare(`${second.date}-${second.id}`));
  let best = 0;
  return ordered.flatMap((workout) => {
    const matchingSets = (workout.sets ?? []).filter((set) => set.exerciseId === exerciseId && set.weight >= 0 && set.reps > 0);
    if (!matchingSets.length) return [];
    const bestSet = matchingSets.reduce((currentBest, set) => bestOneRepMax([set], formula) > bestOneRepMax([currentBest], formula) ? set : currentBest, matchingSets[0]);
    const estimatedOneRepMax = bestOneRepMax(matchingSets, formula);
    if (estimatedOneRepMax <= best) return [];
    best = estimatedOneRepMax;
    return [{ workoutId: workout.id, date: workout.date, weight: bestSet.weight, reps: bestSet.reps, estimatedOneRepMax }];
  });
}
