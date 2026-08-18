import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StatsDateFilter, StatsFilterMode } from "./stats-period";

const STATS_FILTER_KEY = "ironrise.stats-filter.v1";
const validModes: StatsFilterMode[] = ["week", "month", "year", "date", "custom", "last30", "last90"];

export type StoredStatsPreferences = {
  filter: StatsDateFilter;
  exerciseId: string | null;
};

export function normalizeStoredStatsFilter(value: unknown, fallback: StatsDateFilter): StatsDateFilter {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<StatsDateFilter>;
  if (!candidate.mode || !validModes.includes(candidate.mode)) return fallback;
  return { mode: candidate.mode, date: candidate.date, start: candidate.start, end: candidate.end };
}

export function normalizeStoredStatsPreferences(value: unknown, fallback: StoredStatsPreferences): StoredStatsPreferences {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<StoredStatsPreferences>;
  return {
    filter: normalizeStoredStatsFilter(candidate.filter ?? candidate, fallback.filter),
    exerciseId: typeof candidate.exerciseId === "string" && candidate.exerciseId.trim() ? candidate.exerciseId : null,
  };
}

export async function loadStatsFilter(fallback: StatsDateFilter) {
  try {
    const raw = await AsyncStorage.getItem(STATS_FILTER_KEY);
    return raw ? normalizeStoredStatsFilter(JSON.parse(raw), fallback) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveStatsFilter(filter: StatsDateFilter) {
  await AsyncStorage.setItem(STATS_FILTER_KEY, JSON.stringify(filter));
}

export async function loadStatsPreferences(fallback: StoredStatsPreferences) {
  try {
    const raw = await AsyncStorage.getItem(STATS_FILTER_KEY);
    return raw ? normalizeStoredStatsPreferences(JSON.parse(raw), fallback) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveStatsPreferences(preferences: StoredStatsPreferences) {
  await AsyncStorage.setItem(STATS_FILTER_KEY, JSON.stringify(preferences));
}
