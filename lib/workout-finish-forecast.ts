export type WorkoutFinishForecast = {
  remainingSets: number;
  secondsPerSet: number | null;
  secondsRemaining: number | null;
  estimatedFinishAt: number | null;
};

/** Estimates remaining workout time from the elapsed session time and completed set count. */
export function getWorkoutFinishForecast(elapsedSeconds: number, completedSets: number, totalSets: number, now = Date.now()): WorkoutFinishForecast {
  const completed = Math.max(0, Math.min(Math.floor(completedSets), Math.floor(totalSets)));
  const remainingSets = Math.max(0, Math.floor(totalSets) - completed);
  if (!completed) return { remainingSets, secondsPerSet: null, secondsRemaining: null, estimatedFinishAt: null };
  const secondsPerSet = Math.max(15, Math.round(Math.max(0, elapsedSeconds) / completed));
  const secondsRemaining = remainingSets * secondsPerSet;
  return { remainingSets, secondsPerSet, secondsRemaining, estimatedFinishAt: now + secondsRemaining * 1000 };
}

export function formatForecastDuration(seconds: number | null) {
  if (seconds === null) return null;
  if (seconds < 60) return "меньше минуты";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `≈ ${minutes} мин`;
}
