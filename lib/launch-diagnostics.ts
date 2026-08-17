import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { addDiagnosticBreadcrumb, reportException } from "./error-reporting";
import { nextLaunchMarker, shouldWarnAboutRepeatedFailures, type LaunchMarker } from "./launch-recovery";

const STORAGE_KEY = "gym-diary-launch-diagnostics-v1";
const LAUNCH_MARKER_KEY = "gym-diary-launch-marker-v1";
const MAX_ENTRIES = 30;

export type DiagnosticLevel = "info" | "warning" | "error";
export type LaunchDiagnostic = { id: string; at: string; stage: string; level: DiagnosticLevel; detail?: string };

function normalizeDetail(detail?: string) {
  return detail?.replace(/https?:\/\/[^\s]+/g, "[url]").slice(0, 180);
}

export async function recordLaunchDiagnostic(stage: string, level: DiagnosticLevel = "info", detail?: string) {
  const entry: LaunchDiagnostic = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), stage, level, detail: normalizeDetail(detail) };
  addDiagnosticBreadcrumb(`${stage}${entry.detail ? `: ${entry.detail}` : ""}`, level);
  try {
    const current = await getLaunchDiagnostics();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current].slice(0, MAX_ENTRIES)));
  } catch {
    // Local logging must never block application startup.
  }
  return entry;
}

export async function getLaunchDiagnostics(): Promise<LaunchDiagnostic[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((entry): entry is LaunchDiagnostic => Boolean(entry?.id && entry?.stage && entry?.at)) : [];
  } catch {
    return [];
  }
}

export async function clearLaunchDiagnostics() {
  try { await AsyncStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
}

async function showRepeatedFailureNotification() {
  if (Platform.OS === "web") return;
  try {
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("diagnostics", { name: "Диагностика приложения", importance: Notifications.AndroidImportance.DEFAULT });
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") return;
    await Notifications.scheduleNotificationAsync({ content: { title: "Приложение запускалось с ошибкой", body: "Откройте «Диагностика запуска» в настройках, чтобы проверить журнал." }, trigger: null });
  } catch {
    // Notifications must never prevent the app from starting.
  }
}

export async function beginLaunchDiagnostics() {
  let previous: LaunchMarker | null = null;
  try { previous = JSON.parse((await AsyncStorage.getItem(LAUNCH_MARKER_KEY)) ?? "null") as LaunchMarker | null; } catch { previous = null; }
  const marker = nextLaunchMarker(previous);
  try { await AsyncStorage.setItem(LAUNCH_MARKER_KEY, JSON.stringify(marker)); } catch { /* no-op */ }
  if (marker.consecutiveFailures > 0) await recordLaunchDiagnostic("Обнаружен незавершённый предыдущий запуск", "warning", `Повторные сбои: ${marker.consecutiveFailures}`);
  if (shouldWarnAboutRepeatedFailures(marker)) await showRepeatedFailureNotification();
  return marker.id;
}

export async function completeLaunchDiagnostics(id: string) {
  try {
    const current = JSON.parse((await AsyncStorage.getItem(LAUNCH_MARKER_KEY)) ?? "null") as LaunchMarker | null;
    if (current?.id === id) await AsyncStorage.setItem(LAUNCH_MARKER_KEY, JSON.stringify({ ...current, completed: true, consecutiveFailures: 0 }));
  } catch {
    // Local health tracking remains best-effort.
  }
}

export async function buildLaunchDiagnosticExport() {
  const entries = await getLaunchDiagnostics();
  return JSON.stringify({ format: "gym-training-diary.diagnostics", version: 1, exportedAt: new Date().toISOString(), appVersion: Constants.expoConfig?.version ?? "unknown", platform: Platform.OS, entries }, null, 2);
}

export async function recordStartupChecks() {
  const version = Constants.expoConfig?.version ?? "неизвестно";
  await recordLaunchDiagnostic("Инициализация приложения", "info", `${Platform.OS} · версия ${version}`);
  await recordLaunchDiagnostic("Проверка локального хранилища", "info", "AsyncStorage доступен");
}

export function reportStartupError(error: unknown, stage: string) {
  reportException(error, { stage, platform: Platform.OS });
  void recordLaunchDiagnostic(stage, "error", error instanceof Error ? error.message : "Неизвестная ошибка");
}
