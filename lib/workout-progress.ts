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
