import { getExercise, type CompletedWorkout } from "./workout-data";

export type CardioSet = Pick<NonNullable<CompletedWorkout["sets"]>[number], "exerciseId" | "reps" | "distanceKm">;

export type CardioWorkoutSummary = {
  minutes: number;
  distanceKm: number;
  paceSecondsPerKm: number | null;
};

function isCardioSet(set: Pick<CardioSet, "exerciseId">) {
  return getExercise(set.exerciseId)?.group === "Кардио";
}

export function getCardioWorkoutSummary(sets: CardioSet[] | undefined): CardioWorkoutSummary {
  const cardioSets = (sets ?? []).filter(isCardioSet);
  const minutes = cardioSets.reduce((sum, set) => sum + Math.max(0, Number(set.reps) || 0), 0);
  const distanceKm = cardioSets.reduce((sum, set) => sum + Math.max(0, Number(set.distanceKm) || 0), 0);
  return { minutes, distanceKm, paceSecondsPerKm: distanceKm > 0 ? (minutes * 60) / distanceKm : null };
}

export function formatCardioPace(paceSecondsPerKm: number | null) {
  if (!paceSecondsPerKm || !Number.isFinite(paceSecondsPerKm)) return "—";
  const rounded = Math.max(0, Math.round(paceSecondsPerKm));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")} мин/км`;
}

export type WeeklyCardioPoint = { date: string; label: string; minutes: number };

export function getWeeklyCardioMinutes(workouts: CompletedWorkout[], end = new Date()): WeeklyCardioPoint[] {
  const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(lastDay);
    day.setDate(lastDay.getDate() - (6 - index));
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const minutes = workouts
      .filter((workout) => workout.date.slice(0, 10) === date)
      .reduce((sum, workout) => sum + getCardioWorkoutSummary(workout.sets).minutes, 0);
    return { date, label: day.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", ""), minutes };
  });
}
