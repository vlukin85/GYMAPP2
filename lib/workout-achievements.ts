import type { CompletedWorkout, PersonalRecord } from "./workout-data";
import { DEFAULT_LANG, translate } from "./i18n";
import type { Lang } from "./i18n";

export type WorkoutRecordAchievement = PersonalRecord;
export type ShareableWorkoutRecord = WorkoutRecordAchievement & { name: string };
export type SocialShareTemplate = "telegram" | "instagram" | "vk";

export function getWorkoutRecordAchievements(workout: CompletedWorkout, records: Record<string, PersonalRecord>): WorkoutRecordAchievement[] {
  const workoutExerciseIds = new Set((workout.sets ?? []).map((set) => set.exerciseId));
  const workoutDate = workout.date.slice(0, 10);
  return Object.values(records)
    .filter((record) => workoutExerciseIds.has(record.exerciseId))
    .filter((record) => record.achievedWorkoutId ? record.achievedWorkoutId === workout.id : record.achievedAt.slice(0, 10) === workoutDate)
    .sort((first, second) => second.estimatedOneRepMax - first.estimatedOneRepMax);
}

/**
 * Текст поста с итогом тренировки.
 * Язык — необязательное поле lang с дефолтом "ru": вызовы без него дают
 * прежний русский текст, поэтому существующие экраны не ломаются.
 */
export function formatWorkoutAchievementShare({
  workout,
  programName,
  records,
  lang = DEFAULT_LANG,
}: {
  workout: CompletedWorkout;
  programName: string;
  records: ShareableWorkoutRecord[];
  lang?: Lang;
}) {
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const date = new Date(`${workout.date.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const volume = Math.round(workout.totalVolume).toLocaleString(locale).replace(/\u00a0/g, " ");
  const lines = [
    `IronRise · ${programName}`,
    date,
    translate(lang, "workoutServices.social.summary", { minutes: workout.durationMinutes, volume, sets: workout.sets?.length ?? 0 }),
  ];
  if (records.length) {
    lines.push(
      "",
      translate(lang, "workoutServices.social.recordsTitle"),
      ...records.map((record) => translate(lang, "workoutServices.social.recordLine", {
        name: record.name,
        weight: record.weight,
        reps: record.reps,
        oneRm: record.estimatedOneRepMax.toFixed(1),
      })),
    );
  }
  lines.push("", translate(lang, "workoutServices.social.hashtags"));
  return lines.join("\n");
}

export function formatWorkoutSocialTemplate(template: SocialShareTemplate, input: Parameters<typeof formatWorkoutAchievementShare>[0]) {
  const lang = input.lang ?? DEFAULT_LANG;
  const base = formatWorkoutAchievementShare(input);
  if (template === "telegram") return `🏋️ ${base.replace("IronRise · ", "")}`;
  if (template === "vk") return `${base}\n\n${translate(lang, "workoutServices.social.hashtagsExtended")}`;
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const records = input.records.length
    ? `\n\n${translate(lang, "workoutServices.social.recordsShort", {
        list: input.records.map((record) => translate(lang, "workoutServices.social.recordShort", { name: record.name, oneRm: record.estimatedOneRepMax.toFixed(1) })).join(" · "),
      })}`
    : "";
  return `IronRise · ${input.programName}\n${translate(lang, "workoutServices.social.instagramSummary", { minutes: input.workout.durationMinutes, volume: Math.round(input.workout.totalVolume).toLocaleString(locale).replace(/\u00a0/g, " ") })}${records}\n\n${translate(lang, "workoutServices.social.hashtagsExtended")}`;
}
