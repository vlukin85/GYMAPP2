import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { addDiagnosticBreadcrumb, reportException } from "./error-reporting";

const STORAGE_KEY = "gym-diary-launch-diagnostics-v1";
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

export async function recordStartupChecks() {
  const version = Constants.expoConfig?.version ?? "неизвестно";
  await recordLaunchDiagnostic("Инициализация приложения", "info", `${Platform.OS} · версия ${version}`);
  await recordLaunchDiagnostic("Проверка локального хранилища", "info", "AsyncStorage доступен");
}

export function reportStartupError(error: unknown, stage: string) {
  reportException(error, { stage, platform: Platform.OS });
  void recordLaunchDiagnostic(stage, "error", error instanceof Error ? error.message : "Неизвестная ошибка");
}
