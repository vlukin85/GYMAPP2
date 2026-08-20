import { Platform } from "react-native";
import { getGrantedPermissions, getSdkStatus, initialize, readRecords, requestPermission, SdkAvailabilityStatus } from "react-native-health-connect";

import { normalizeHeartRateSamples, summarizeHeartRate, type HeartRateSampleInput, type HeartRateSummary } from "./health-connect-heart-rate";

export type HealthConnectState = "unsupported" | "unavailable" | "update-required" | "ready" | "permission-required" | "error";
export type HealthConnectStatus = { state: HealthConnectState; heartRateGranted: boolean; message: string };
export type HealthConnectHeartRateReading = HeartRateSummary & { samples: HeartRateSampleInput[] };

const HEART_RATE_PERMISSION = { accessType: "read", recordType: "HeartRate" } as const;

function nativeUnavailable(): HealthConnectStatus {
  return { state: "unsupported", heartRateGranted: false, message: "Health Connect доступен только в Android-сборке IronRise." };
}

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  if (Platform.OS !== "android") return nativeUnavailable();
  try {
    const sdkStatus = await getSdkStatus();
    if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return { state: "update-required", heartRateGranted: false, message: "Обновите или установите Health Connect, затем повторите подключение." };
    if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) return { state: "unavailable", heartRateGranted: false, message: "Health Connect недоступен на этом устройстве." };
    const initialized = await initialize();
    if (!initialized) return { state: "unavailable", heartRateGranted: false, message: "Не удалось запустить Health Connect на этом устройстве." };
    const permissions = await getGrantedPermissions();
    const heartRateGranted = permissions.some((permission) => permission.accessType === "read" && permission.recordType === "HeartRate");
    return heartRateGranted
      ? { state: "ready", heartRateGranted: true, message: "Пульс доступен через Health Connect." }
      : { state: "permission-required", heartRateGranted: false, message: "Разрешите IronRise читать данные пульса в Health Connect." };
  } catch {
    return { state: "error", heartRateGranted: false, message: "Не удалось проверить Health Connect. Попробуйте ещё раз после открытия приложения Health Connect." };
  }
}

export async function connectHealthConnectHeartRate(): Promise<HealthConnectStatus> {
  const status = await getHealthConnectStatus();
  if (status.state !== "permission-required") return status;
  try {
    const permissions = await requestPermission([HEART_RATE_PERMISSION]);
    const heartRateGranted = permissions.some((permission) => permission.accessType === "read" && permission.recordType === "HeartRate");
    return heartRateGranted
      ? { state: "ready", heartRateGranted: true, message: "Доступ к пульсу предоставлен." }
      : { state: "permission-required", heartRateGranted: false, message: "Доступ к пульсу не предоставлен. Его можно включить в Health Connect." };
  } catch {
    return { state: "error", heartRateGranted: false, message: "Не удалось запросить доступ к данным пульса." };
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
