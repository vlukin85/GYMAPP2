import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Lang } from "./i18n/types";

export const STATS_WIDGETS_STORAGE_KEY = "gym-diary-stats-widgets-v1";

// Русские title/description — исторические значения по умолчанию (их читают
// старые экраны); английские пары лежат рядом и выбираются через
// statsWidgetTitle()/statsWidgetDescription() по текущему языку приложения.
export const STATS_WIDGETS = [
  { id: "summary" as const, title: "Сводка периода", titleEn: "Period summary", description: "Тренировки, объём и время за выбранный период", descriptionEn: "Workouts, volume and time for the chosen period" },
  { id: "comparison" as const, title: "Сравнение периодов", titleEn: "Period comparison", description: "Текущий период против предыдущего", descriptionEn: "Current period versus the previous one" },
  { id: "oneRm" as const, title: "Динамика 1RM", titleEn: "1RM trend", description: "График расчётного максимума по выбранному упражнению", descriptionEn: "Estimated max chart for the chosen exercise" },
  { id: "cardio" as const, title: "Кардио · 7 дней", titleEn: "Cardio · 7 days", description: "Минуты кардио по дням недели", descriptionEn: "Cardio minutes by day of the week" },
  { id: "activity" as const, title: "Активность · сегодня", titleEn: "Activity · today", description: "Шаги, калории, дистанция и пульс за день из Health Connect", descriptionEn: "Steps, calories, distance and heart rate for the day from Health Connect" },
  { id: "progress" as const, title: "Общий прогресс", titleEn: "Overall progress", description: "Сводный прогресс завершённых тренировок", descriptionEn: "Combined progress of completed workouts" },
  { id: "records" as const, title: "Личные рекорды", titleEn: "Personal records", description: "Последние обновлённые рекорды за период", descriptionEn: "Most recently updated records for the period" },
];

export type StatsWidgetId = typeof STATS_WIDGETS[number]["id"];

/** Заголовок виджета статистики под выбранный язык. */
export function statsWidgetTitle(widget: (typeof STATS_WIDGETS)[number] | undefined, lang: Lang): string {
  if (!widget) return "";
  return lang === "en" ? (widget.titleEn ?? widget.title) : widget.title;
}

/** Описание виджета статистики под выбранный язык. */
export function statsWidgetDescription(widget: (typeof STATS_WIDGETS)[number] | undefined, lang: Lang): string {
  if (!widget) return "";
  return lang === "en" ? (widget.descriptionEn ?? widget.description) : widget.description;
}
export type StatsWidgetPreferences = {
  order: StatsWidgetId[];
  hidden: StatsWidgetId[];
  dragHintSeen: boolean;
};

export const DEFAULT_STATS_WIDGETS: StatsWidgetPreferences = {
  order: STATS_WIDGETS.map((widget) => widget.id),
  hidden: [],
  dragHintSeen: false,
};

export function normalizeStoredStatsWidgets(value: unknown, fallback: StatsWidgetPreferences): StatsWidgetPreferences {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<StatsWidgetPreferences>;
  const knownIds = STATS_WIDGETS.map((widget) => widget.id as StatsWidgetId);
  const candidateOrder = Array.isArray(candidate.order)
    ? Array.from(new Set(candidate.order.filter((id): id is StatsWidgetId => knownIds.includes(id as StatsWidgetId))))
    : [];
  const order = [...candidateOrder, ...knownIds.filter((id) => !candidateOrder.includes(id))];
  const hidden = Array.isArray(candidate.hidden)
    ? knownIds.filter((id) => candidate.hidden?.includes(id))
    : [];
  return { order, hidden, dragHintSeen: candidate.dragHintSeen === true };
}

export async function loadStatsWidgets(fallback: StatsWidgetPreferences) {
  try {
    const raw = await AsyncStorage.getItem(STATS_WIDGETS_STORAGE_KEY);
    return raw ? normalizeStoredStatsWidgets(JSON.parse(raw), fallback) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveStatsWidgets(preferences: StatsWidgetPreferences) {
  await AsyncStorage.setItem(STATS_WIDGETS_STORAGE_KEY, JSON.stringify(preferences));
}
