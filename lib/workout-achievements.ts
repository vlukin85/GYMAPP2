import type { CompletedWorkout, PersonalRecord } from "./workout-data";

export type WorkoutRecordAchievement = PersonalRecord;
export type ShareableWorkoutRecord = WorkoutRecordAchievement & { name: string };

export function getWorkoutRecordAchievements(workout: CompletedWorkout, records: Record<string, PersonalRecord>): WorkoutRecordAchievement[] {
  const workoutExerciseIds = new Set((workout.sets ?? []).map((set) => set.exerciseId));
  const workoutDate = workout.date.slice(0, 10);
  return Object.values(records)
    .filter((record) => workoutExerciseIds.has(record.exerciseId))
    .filter((record) => record.achievedWorkoutId ? record.achievedWorkoutId === workout.id : record.achievedAt.slice(0, 10) === workoutDate)
    .sort((first, second) => second.estimatedOneRepMax - first.estimatedOneRepMax);
}

export function formatWorkoutAchievementShare({
  workout,
  programName,
  records,
}: {
  workout: CompletedWorkout;
  programName: string;
  records: ShareableWorkoutRecord[];
}) {
  const date = new Date(`${workout.date.slice(0, 10)}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const volume = Math.round(workout.totalVolume).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  const lines = [
    `IronRise · ${programName}`,
    date,
    `Тренировка: ${workout.durationMinutes} мин · ${volume} кг · ${workout.sets?.length ?? 0} подходов`,
  ];
  if (records.length) {
    lines.push("", "Новые личные рекорды:", ...records.map((record) => `• ${record.name}: ${record.weight} кг × ${record.reps} · 1RM ${record.estimatedOneRepMax.toFixed(1)} кг`));
  }
  lines.push("", "#IronRise #Тренировка");
  return lines.join("\n");
}
