export type WorkoutFinishForecast = {
  remainingSets: number;
  secondsPerSet: number | null;
  restSecondsRemaining: number | null;
  secondsRemaining: number | null;
  estimatedFinishAt: number | null;
};

/** Estimates remaining workout time from the elapsed session time and completed set count. */
export function getWorkoutFinishForecast(elapsedSeconds: number, completedSets: number, totalSets: number, now = Date.now(), averageRestSeconds = 0, currentRestSeconds = 0): WorkoutFinishForecast {
  const completed = Math.max(0, Math.min(Math.floor(completedSets), Math.floor(totalSets)));
  const remainingSets = Math.max(0, Math.floor(totalSets) - completed);
  if (!completed) return { remainingSets, secondsPerSet: null, restSecondsRemaining: null, secondsRemaining: null, estimatedFinishAt: null };
  const secondsPerSet = Math.max(15, Math.round(Math.max(0, elapsedSeconds) / completed));
  const restSecondsRemaining = Math.max(0, Math.round(currentRestSeconds)) + Math.max(0, remainingSets - 1) * Math.max(0, Math.round(averageRestSeconds));
  const secondsRemaining = remainingSets * secondsPerSet + restSecondsRemaining;
  return { remainingSets, secondsPerSet, restSecondsRemaining, secondsRemaining, estimatedFinishAt: now + secondsRemaining * 1000 };
}

export function formatForecastDuration(seconds: number | null) {
  if (seconds === null) return null;
  if (seconds < 60) return "меньше минуты";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `≈ ${minutes} мин`;
}
