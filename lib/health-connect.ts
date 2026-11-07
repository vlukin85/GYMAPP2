import { Platform } from "react-native";
import { getGrantedPermissions, getSdkStatus, initialize, readRecords, requestPermission, SdkAvailabilityStatus } from "react-native-health-connect";

import { normalizeHeartRateSamples, summarizeHeartRate, type HeartRateSampleInput, type HeartRateSummary } from "./health-connect-heart-rate";
import {
  ALL_HEALTH_CONNECT_PERMISSIONS,
  buildActivityWeek,
  HEART_RATE_PERMISSION,
  localDateKey,
  localDayStartISO,
  summarizeActivityDay,
  type ActivityRecordInput,
  type ActivityWeekDay,
} from "./health-connect-activity";

export type HealthConnectState = "unsupported" | "unavailable" | "update-required" | "ready" | "permission-required" | "error";
export type HealthConnectStatus = { state: HealthConnectState; heartRateGranted: boolean; activityGranted: boolean; message: string };
export type HealthConnectHeartRateReading = HeartRateSummary & { samples: HeartRateSampleInput[] };
export type DailyActivityReading = {
  steps?: number;
  activeKcal?: number;
  distanceKm?: number;
  heartRate: HeartRateSummary | null;
};

const EMPTY_DAILY_ACTIVITY: DailyActivityReading = { heartRate: null };

function nativeUnavailable(): HealthConnectStatus {
  return { state: "unsupported", heartRateGranted: false, activityGranted: false, message: "Health Connect доступен только в Android-сборке IronRise." };
}

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  if (Platform.OS !== "android") return nativeUnavailable();
  try {
    const sdkStatus = await getSdkStatus();
    if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return { state: "update-required", heartRateGranted: false, activityGranted: false, message: "Обновите или установите Health Connect, затем повторите подключение." };
    if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) return { state: "unavailable", heartRateGranted: false, activityGranted: false, message: "Health Connect недоступен на этом устройстве." };
    const initialized = await initialize();
    if (!initialized) return { state: "unavailable", heartRateGranted: false, activityGranted: false, message: "Не удалось запустить Health Connect на этом устройстве." };
    const permissions = await getGrantedPermissions();
    const heartRateGranted = permissions.some((permission) => permission.accessType === "read" && permission.recordType === "HeartRate");
    const activityGranted = (["Steps", "TotalCaloriesBurned", "Distance"] as const).every((recordType) => permissions.some((permission) => permission.accessType === "read" && permission.recordType === recordType));
    if (heartRateGranted) {
      return activityGranted
        ? { state: "ready", heartRateGranted: true, activityGranted: true, message: "Активность и пульс доступны через Health Connect." }
        : { state: "ready", heartRateGranted: true, activityGranted: false, message: "Пульс доступен. Разрешите IronRise читать активность в Health Connect для виджета «Активность»." };
    }
    return activityGranted
      ? { state: "permission-required", heartRateGranted: false, activityGranted: true, message: "Разрешите IronRise читать данные пульса в Health Connect." }
      : { state: "permission-required", heartRateGranted: false, activityGranted: false, message: "Разрешите IronRise читать активность и пульс в Health Connect." };
  } catch {
    return { state: "error", heartRateGranted: false, activityGranted: false, message: "Не удалось проверить Health Connect. Попробуйте ещё раз после открытия приложения Health Connect." };
  }
}

export async function connectHealthConnectHeartRate(): Promise<HealthConnectStatus> {
  const status = await getHealthConnectStatus();
  if (status.state !== "permission-required") return status;
  try {
    await requestPermission([HEART_RATE_PERMISSION]);
    const refreshed = await getHealthConnectStatus();
    if (!refreshed.heartRateGranted) return { ...refreshed, state: "permission-required", message: "Доступ к пульсу не предоставлен. Его можно включить в Health Connect." };
    return {
      ...refreshed,
      message: refreshed.activityGranted
        ? "Доступ к пульсу предоставлен."
        : "Доступ к пульсу предоставлен. Разрешите чтение активности в Health Connect.",
    };
  } catch {
    return { state: "error", heartRateGranted: false, activityGranted: false, message: "Не удалось запросить доступ к данным пульса." };
  }
}

/** Запрашивает все четыре типа данных: шаги, калории, дистанцию и пульс. */
export async function connectHealthConnectActivity(): Promise<HealthConnectStatus> {
  try {
    await requestPermission([...ALL_HEALTH_CONNECT_PERMISSIONS]);
    const status = await getHealthConnectStatus();
    return status.heartRateGranted && status.activityGranted
      ? { ...status, message: "Активность и пульс подключены." }
      : status;
  } catch {
    return { state: "error", heartRateGranted: false, activityGranted: false, message: "Не удалось запросить доступ к данным Health Connect." };
  }
}

export async function readHealthConnectHeartRate(startTime: string, endTime: string): Promise<HealthConnectHeartRateReading> {
  const status = await getHealthConnectStatus();
  if (!status.heartRateGranted) return { sampleCount: 0, samples: [] };
  try {
    const result = await readRecords("HeartRate", { timeRangeFilter: { operator: "between", startTime, endTime } });
    const samples = normalizeHeartRateSamples(result.records);
    return { ...summarizeHeartRate(result.records), samples };
  } catch {
    return { sampleCount: 0, samples: [] };
  }
}

async function readActivityRecords(startISO: string, endISO: string): Promise<ActivityRecordInput[]> {
  const timeRangeFilter = { operator: "between" as const, startTime: startISO, endTime: endISO };
  const [steps, calories, distance] = await Promise.all([
    readRecords("Steps", { timeRangeFilter }).catch(() => null),
    readRecords("TotalCaloriesBurned", { timeRangeFilter }).catch(() => null),
    readRecords("Distance", { timeRangeFilter }).catch(() => null),
  ]);
  return [
    ...(steps?.records ?? []).map((record) => ({ recordType: "Steps" as const, startTime: record.startTime, endTime: record.endTime, count: record.count })),
    ...(calories?.records ?? []).map((record) => ({ recordType: "TotalCaloriesBurned" as const, startTime: record.startTime, endTime: record.endTime, energy: { value: record.energy.inKilocalories, unit: "kilocalories" as const } })),
    ...(distance?.records ?? []).map((record) => ({ recordType: "Distance" as const, startTime: record.startTime, endTime: record.endTime, distance: { value: record.distance.inKilometers, unit: "kilometers" as const } })),
  ];
}

/** Активность и пульс за сегодня (с 00:00 по локальному времени устройства). */
export async function readDailyActivity(): Promise<DailyActivityReading> {
  if (Platform.OS !== "android") return EMPTY_DAILY_ACTIVITY;
  try {
    const status = await getHealthConnectStatus();
    if (status.state === "unsupported" || status.state === "unavailable" || status.state === "update-required") return EMPTY_DAILY_ACTIVITY;
    const now = new Date();
    const startISO = localDayStartISO(now);
    const endISO = now.toISOString();
    const [records, heartRateResult] = await Promise.all([
      readActivityRecords(startISO, endISO),
      readRecords("HeartRate", { timeRangeFilter: { operator: "between", startTime: startISO, endTime: endISO } }).catch(() => null),
    ]);
    const summary = summarizeActivityDay(records);
    const heartRate = heartRateResult ? summarizeHeartRate(heartRateResult.records) : null;
    return { ...summary, heartRate: heartRate && heartRate.sampleCount > 0 ? heartRate : null };
  } catch {
    return EMPTY_DAILY_ACTIVITY;
  }
}

/** Активность за последние 7 дней по дням — для мини-графика на экране статистики. */
export async function readActivityWeek(): Promise<ActivityWeekDay[]> {
  if (Platform.OS !== "android") return [];
  try {
    const status = await getHealthConnectStatus();
    if (status.state === "unsupported" || status.state === "unavailable" || status.state === "update-required") return [];
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const records = await readActivityRecords(weekStart.toISOString(), now.toISOString());
    return buildActivityWeek(records, localDateKey(now));
  } catch {
    return [];
  }
}
