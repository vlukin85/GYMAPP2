import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ironrise-launch-splash-duration-ms-v1";
export const DEFAULT_LAUNCH_SPLASH_DURATION_MS = 1500;
export const LAUNCH_SPLASH_DURATION_OPTIONS = [
  { value: 0, title: "Не показывать", description: "Оставить только короткую нативную заставку" },
  { value: 800, title: "0,8 сек", description: "Быстрый переход к приложению" },
  { value: 1500, title: "1,5 сек", description: "Рекомендуемая длительность" },
  { value: 2500, title: "2,5 сек", description: "Более заметный фирменный старт" },
] as const;

export type LaunchSplashDuration = (typeof LAUNCH_SPLASH_DURATION_OPTIONS)[number]["value"];

export function normalizeLaunchSplashDuration(value: unknown): LaunchSplashDuration {
  return LAUNCH_SPLASH_DURATION_OPTIONS.some((option) => option.value === value)
    ? value as LaunchSplashDuration
    : DEFAULT_LAUNCH_SPLASH_DURATION_MS;
}

export async function loadLaunchSplashDuration() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return normalizeLaunchSplashDuration(stored === null ? undefined : Number(stored));
}

export async function saveLaunchSplashDuration(value: LaunchSplashDuration) {
  await AsyncStorage.setItem(STORAGE_KEY, String(normalizeLaunchSplashDuration(value)));
}
