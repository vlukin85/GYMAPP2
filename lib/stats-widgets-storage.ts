import AsyncStorage from "@react-native-async-storage/async-storage";

export const STATS_WIDGETS_STORAGE_KEY = "gym-diary-stats-widgets-v1";

export const STATS_WIDGETS = [
  { id: "summary" as const, title: "Сводка периода", description: "Тренировки, объём и время за выбранный период" },
  { id: "comparison" as const, title: "Сравнение периодов", description: "Текущий период против предыдущего" },
  { id: "oneRm" as const, title: "Динамика 1RM", description: "График расчётного максимума по выбранному упражнению" },
  { id: "cardio" as const, title: "Кардио · 7 дней", description: "Минуты кардио по дням недели" },
  { id: "activity" as const, title: "Активность · сегодня", description: "Шаги, калории, дистанция и пульс за день из Health Connect" },
  { id: "progress" as const, title: "Общий прогресс", description: "Сводный прогресс завершённых тренировок" },
  { id: "records" as const, title: "Личные рекорды", description: "Последние обновлённые рекорды за период" },
];

export type StatsWidgetId = typeof STATS_WIDGETS[number]["id"];
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
