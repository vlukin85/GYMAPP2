import { Platform } from "react-native";

import type { DailyActivityReading } from "./health-connect";
import {
  buildActivityWeek,
  localDateKey,
  localDayStartISO,
  summarizeActivityDay,
  type ActivityRecordInput,
  type ActivityWeekDay,
} from "./health-connect-activity";
import { summarizeHeartRate, type HeartRateSummary } from "./health-connect-heart-rate";

/**
 * Обёртка над react-native-google-fit (Google Fit API).
 *
 * Библиотека требует нативный модуль RNGoogleFit и настроенный OAuth-клиент
 * (package name + SHA-1 в Google Cloud Console). Пока OAuth не настроен или
 * сборка не Android, все вызовы деградируют: статусы → unavailable, чтение →
 * пустые значения. Нативный модуль подгружается ленивым require, чтобы веб- и
 * тестовые сборки не тянули нативный код.
 */

export type GoogleFitState = "unavailable" | "unauthorized" | "ready" | "error";
export type GoogleFitStatus = { state: GoogleFitState; message: string };
export type GoogleFitWeightSample = { timestampISO: string; weightKg: number };

/** Скоупы: активность (шаги, калории, дистанция), вес и пульс за день. */
export const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
];

type GoogleFitStepsResponse = { steps?: { date?: string; value?: number }[] };
type GoogleFitCalorieResponse = { calorie?: number; startDate?: string; endDate?: string };
type GoogleFitDistanceResponse = { distance?: number; startDate?: string; endDate?: string };
type GoogleFitHeartRateResponse = { startDate?: string; value?: number };
type GoogleFitWeightResponse = { value?: number; startDate?: string; endDate?: string };

type GoogleFitModule = {
  default: {
    isAuthorized: boolean;
    authorize(options: { scopes: string[] }): Promise<{ success: boolean; message?: string }>;
    checkIsAuthorized(): Promise<void>;
    isAvailable(callback: (isError: boolean, result: boolean) => void): void;
    getDailyStepCountSamples(options: { startDate: string; endDate: string }): Promise<GoogleFitStepsResponse[]>;
    getDailyCalorieSamples(options: { startDate: string; endDate: string; basalCalculation?: boolean }): Promise<GoogleFitCalorieResponse[]>;
    getDailyDistanceSamples(options: { startDate: string; endDate: string }): Promise<GoogleFitDistanceResponse[]>;
    getHeartRateSamples(options: { startDate: string; endDate: string }): Promise<GoogleFitHeartRateResponse[]>;
    getWeightSamples(options: { startDate: string; endDate: string; unit?: string; ascending?: boolean }): Promise<GoogleFitWeightResponse[]>;
  };
};

let cachedModule: GoogleFitModule | null | undefined;

/** Ленивая загрузка нативного модуля; вне Android или при ошибке — null. */
function loadGoogleFitModule(): GoogleFitModule | null {
  if (Platform.OS !== "android") return null;
  if (cachedModule !== undefined) return cachedModule;
  try {
    const loaded = require("react-native-google-fit") as GoogleFitModule | undefined;
    cachedModule = loaded?.default ? loaded : null;
  } catch (error) {
    console.warn("[google-fit] нативный модуль недоступен:", error);
    cachedModule = null;
  }
  return cachedModule;
}

/** Доступен ли Google Fit: Android-сборка + нативный модуль + приложение Google Fit на устройстве. */
export async function isGoogleFitAvailable(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  const module = loadGoogleFitModule();
  if (!module) return false;
  try {
    return await new Promise<boolean>((resolve) => {
      try {
        module.default.isAvailable((isError, result) => resolve(!isError && result === true));
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

/** Статус Google Fit: доступность модуля, авторизация OAuth, готовность к чтению. */
export async function getGoogleFitStatus(): Promise<GoogleFitStatus> {
  if (Platform.OS !== "android") {
    return { state: "unavailable", message: "Google Fit доступен только в Android-сборке IronRise." };
  }
  if (!loadGoogleFitModule()) {
    return { state: "unavailable", message: "Google Fit не подключён: нужен настроенный OAuth-клиент (см. docs/setup-google-fit.md)." };
  }
  try {
    if (!(await isGoogleFitAvailable())) {
      return { state: "unavailable", message: "Приложение Google Fit не установлено либо OAuth-клиент ещё не настроен." };
    }
    await loadGoogleFitModule()!.default.checkIsAuthorized();
    return loadGoogleFitModule()!.default.isAuthorized
      ? { state: "ready", message: "Подключено к Google Fit: активность и вес доступны." }
      : { state: "unauthorized", message: "Разреши IronRise читать активность и вес в Google Fit." };
  } catch {
    return { state: "error", message: "Не удалось проверить Google Fit. Проверь настройку OAuth-клиента и попробуй ещё раз." };
  }
}

/** Запрашивает OAuth-разрешения и возвращает свежий статус. */
export async function authorizeGoogleFit(): Promise<GoogleFitStatus> {
  if (Platform.OS !== "android") {
    return { state: "unavailable", message: "Google Fit доступен только в Android-сборке IronRise." };
  }
  const module = loadGoogleFitModule();
  if (!module) {
    return { state: "unavailable", message: "Google Fit не подключён: нужен настроенный OAuth-клиент (см. docs/setup-google-fit.md)." };
  }
  try {
    const result = await module.default.authorize({ scopes: GOOGLE_FIT_SCOPES });
    if (!result?.success) {
      return {
        state: "unauthorized",
        message: result?.message ? `Авторизация не завершена: ${result.message}` : "Авторизация в Google Fit не завершена.",
      };
    }
    return await getGoogleFitStatus();
  } catch {
    return { state: "error", message: "Не удалось авторизоваться в Google Fit. Проверь настройку OAuth-клиента." };
  }
}

function isValidMetric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Записи шагов библиотеки — по дням локального времени источника. */
function stepsToRecords(responses: GoogleFitStepsResponse[] | null | undefined): ActivityRecordInput[] {
  return (responses ?? []).flatMap((response) =>
    (response?.steps ?? [])
      .filter((entry): entry is { date: string; value: number } => isValidMetric(entry?.value) && typeof entry?.date === "string" && !Number.isNaN(Date.parse(`${entry.date}T12:00:00`)))
      .map((entry) => ({ recordType: "Steps" as const, startTime: `${entry.date}T12:00:00`, count: entry.value })),
  );
}

function caloriesToRecords(responses: GoogleFitCalorieResponse[] | null | undefined): ActivityRecordInput[] {
  return (responses ?? [])
    .filter((response) => isValidMetric(response?.calorie) && !Number.isNaN(Date.parse(response?.startDate ?? "")))
    .map((response) => ({
      recordType: "TotalCaloriesBurned" as const,
      startTime: response.startDate as string,
      energy: { value: response.calorie as number, unit: "kilocalories" as const },
    }));
}

/** Дистанция из Google Fit приходит в метрах. */
function distanceToRecords(responses: GoogleFitDistanceResponse[] | null | undefined): ActivityRecordInput[] {
  return (responses ?? [])
    .filter((response) => isValidMetric(response?.distance) && !Number.isNaN(Date.parse(response?.startDate ?? "")))
    .map((response) => ({
      recordType: "Distance" as const,
      startTime: response.startDate as string,
      distance: { value: response.distance as number, unit: "meters" as const },
    }));
}

async function readHeartRateSummary(module: GoogleFitModule, startISO: string, endISO: string): Promise<HeartRateSummary | null> {
  try {
    const samples = await module.default.getHeartRateSamples({ startDate: startISO, endDate: endISO });
    const inputs = (samples ?? [])
      .filter((sample) => isValidMetric(sample?.value) && sample.value >= 1 && sample.value <= 300 && !Number.isNaN(Date.parse(sample?.startDate ?? "")))
      .map((sample) => ({ time: sample.startDate as string, beatsPerMinute: sample.value as number }));
    const summary = summarizeHeartRate([{ samples: inputs }]);
    return summary.sampleCount > 0 ? summary : null;
  } catch {
    return null;
  }
}

const EMPTY_DAILY_ACTIVITY: DailyActivityReading = { heartRate: null };

/** Активность за сегодня из Google Fit — тот же формат, что у readDailyActivity из Health Connect. */
export async function readGoogleFitDailyActivity(): Promise<DailyActivityReading> {
  if (Platform.OS !== "android") return EMPTY_DAILY_ACTIVITY;
  try {
    const module = loadGoogleFitModule();
    if (!module) return EMPTY_DAILY_ACTIVITY;
    const now = new Date();
    const startISO = localDayStartISO(now);
    const endISO = now.toISOString();
    const [steps, calories, distance, heartRate] = await Promise.all([
      module.default.getDailyStepCountSamples({ startDate: startISO, endDate: endISO }).catch(() => null),
      module.default.getDailyCalorieSamples({ startDate: startISO, endDate: endISO, basalCalculation: true }).catch(() => null),
      module.default.getDailyDistanceSamples({ startDate: startISO, endDate: endISO }).catch(() => null),
      readHeartRateSummary(module, startISO, endISO),
    ]);
    const summary = summarizeActivityDay([...stepsToRecords(steps), ...caloriesToRecords(calories), ...distanceToRecords(distance)]);
    return { ...summary, heartRate };
  } catch (error) {
    console.warn("[google-fit] не удалось прочитать активность за день:", error);
    return EMPTY_DAILY_ACTIVITY;
  }
}

/** Неделя активности из Google Fit — тот же формат массива, что у readActivityWeek из Health Connect. */
export async function readGoogleFitActivityWeek(): Promise<ActivityWeekDay[]> {
  if (Platform.OS !== "android") return [];
  try {
    const module = loadGoogleFitModule();
    if (!module) return [];
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();
    const endISO = now.toISOString();
    const [steps, calories, distance] = await Promise.all([
      module.default.getDailyStepCountSamples({ startDate: weekStart, endDate: endISO }).catch(() => null),
      module.default.getDailyCalorieSamples({ startDate: weekStart, endDate: endISO, basalCalculation: true }).catch(() => null),
      module.default.getDailyDistanceSamples({ startDate: weekStart, endDate: endISO }).catch(() => null),
    ]);
    return buildActivityWeek([...stepsToRecords(steps), ...caloriesToRecords(calories), ...distanceToRecords(distance)], localDateKey(now));
  } catch (error) {
    console.warn("[google-fit] не удалось прочитать неделю активности:", error);
    return [];
  }
}

/** Взвешивания из Google Fit за последние `days` дней. Состав тела библиотека не отдаёт — только вес. */
export async function readGoogleFitWeightSamples(days = 90): Promise<GoogleFitWeightSample[]> {
  if (Platform.OS !== "android") return [];
  try {
    const module = loadGoogleFitModule();
    if (!module) return [];
    const endISO = new Date().toISOString();
    const startISO = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000).toISOString();
    const samples = await module.default.getWeightSamples({ startDate: startISO, endDate: endISO, unit: "kg" });
    return (samples ?? [])
      .filter((sample) => isValidMetric(sample?.value) && sample.value > 0)
      .map((sample) => ({ timestampISO: sample.startDate ?? sample.endDate ?? "", weightKg: sample.value as number }))
      .filter((sample) => !Number.isNaN(Date.parse(sample.timestampISO)));
  } catch (error) {
    console.warn("[google-fit] не удалось прочитать взвешивания:", error);
    return [];
  }
}
