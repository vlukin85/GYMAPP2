import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getGrantedPermissions, getSdkStatus, initialize, readRecords, requestPermission, SdkAvailabilityStatus } from "react-native-health-connect";

import { BODY_MEASUREMENTS_STORAGE_KEY, type BodyMeasurement } from "./body-store";
import {
  BODY_SCALE_PERMISSIONS,
  bodySyncMeasurementId,
  collectWeighIns,
  dedupeAgainst,
  type BodyFatRecordInput,
  type BodyMassRecordInput,
  type BodyScalePermission,
  type ExistingMeasurementLike,
  type WeightRecordInput,
  type WeighInCandidate,
} from "./health-connect-body";

/**
 * IO-слой синхронизации умных весов (OKOK International → Health Connect).
 * Читает записи веса и состава тела, передаёт их чистым функциям
 * health-connect-body и создаёт замеры в журнале тела через body-store.
 */

export type BodyScaleState = "unsupported" | "unavailable" | "update-required" | "ready" | "permission-required" | "error";
export type BodyScaleStatus = { state: BodyScaleState; granted: boolean; message: string };

const BODY_SYNC_STORAGE_KEY = "ironrise.health-connect-body-sync.v1";
/** Окно чтения: взвешивания за последние 90 дней. */
const LOOKBACK_DAYS = 90;
/** Автосинхронизация не чаще раза в 10 минут. */
const AUTO_SYNC_MIN_INTERVAL_MS = 10 * 60 * 1000;
/** Ограничение журнала обработанных меток, чтобы хранилище не росло бесконечно. */
const MAX_PROCESSED_TIMESTAMPS = 500;

export type BodySyncState = {
  processedAtISO: string[];
  lastSyncAtISO?: string;
  autoSyncEnabled: boolean;
};

export type BodyScaleSyncResult = { created: number; skipped: number; lastWeight?: number; granted?: boolean };

export type SyncBodyWeighInsOptions = {
  addMeasurement: (input: Omit<BodyMeasurement, "id"> & { id?: string }) => void;
  /** Ручная синхронизация из настроек: игнорирует троттлинг и выключенную автосинхронизацию. */
  force?: boolean;
};

export async function loadBodySyncState(): Promise<BodySyncState> {
  try {
    const raw = await AsyncStorage.getItem(BODY_SYNC_STORAGE_KEY);
    if (!raw) return { processedAtISO: [], autoSyncEnabled: true };
    const parsed = JSON.parse(raw) as Partial<BodySyncState>;
    return {
      processedAtISO: Array.isArray(parsed.processedAtISO) ? parsed.processedAtISO.filter((item) => typeof item === "string") : [],
      lastSyncAtISO: typeof parsed.lastSyncAtISO === "string" ? parsed.lastSyncAtISO : undefined,
      autoSyncEnabled: parsed.autoSyncEnabled !== false,
    };
  } catch {
    return { processedAtISO: [], autoSyncEnabled: true };
  }
}

export async function saveBodySyncState(state: BodySyncState): Promise<void> {
  await AsyncStorage.setItem(BODY_SYNC_STORAGE_KEY, JSON.stringify(state));
}

export async function saveBodyScaleAutoSync(enabled: boolean): Promise<void> {
  const state = await loadBodySyncState();
  await saveBodySyncState({ ...state, autoSyncEnabled: enabled });
}

/** Статус умных весов: доступность Health Connect и наличие всех пяти разрешений на состав тела. */
export async function getBodyScaleStatus(): Promise<BodyScaleStatus> {
  if (Platform.OS !== "android") return { state: "unsupported", granted: false, message: "Умные весы доступны только в Android-сборке IronRise." };
  try {
    const sdkStatus = await getSdkStatus();
    if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return { state: "update-required", granted: false, message: "Обновите или установите Health Connect, затем повторите подключение." };
    if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) return { state: "unavailable", granted: false, message: "Health Connect недоступен на этом устройстве." };
    const initialized = await initialize();
    if (!initialized) return { state: "unavailable", granted: false, message: "Не удалось запустить Health Connect на этом устройстве." };
    const permissions = await getGrantedPermissions();
    const granted = BODY_SCALE_PERMISSIONS.every((permission) =>
      permissions.some((item) => item.accessType === "read" && item.recordType === permission.recordType),
    );
    return granted
      ? { state: "ready", granted: true, message: "Весы подключены: IronRise читает вес и состав тела." }
      : { state: "permission-required", granted: false, message: "Разрешите IronRise читать вес и состав тела в Health Connect." };
  } catch {
    return { state: "error", granted: false, message: "Не удалось проверить Health Connect. Откройте приложение Health Connect и повторите." };
  }
}

/** Запрашивает все пять типов данных: вес, жир, мышечная, костная и водная масса. */
export async function connectBodyScale(): Promise<BodyScaleStatus> {
  try {
    await requestPermission([...BODY_SCALE_PERMISSIONS] as BodyScalePermission[]);
    const status = await getBodyScaleStatus();
    return status.granted ? { ...status, message: "Весы подключены." } : status;
  } catch {
    return { state: "error", granted: false, message: "Не удалось запросить доступ к данным весов." };
  }
}

async function readStoredMeasurements(): Promise<ExistingMeasurementLike[]> {
  try {
    const raw = await AsyncStorage.getItem(BODY_MEASUREMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ExistingMeasurementLike => Boolean(item) && typeof (item as ExistingMeasurementLike).date === "string");
  } catch {
    return [];
  }
}

function toWeightInputs(records: { time: string; weight: { inKilograms: number } }[] | undefined): WeightRecordInput[] {
  return (records ?? []).map((record) => ({ time: record.time, weight: { value: record.weight.inKilograms, unit: "kilograms" as const } }));
}

function toMassInputs(records: { time: string; mass: { inKilograms: number } }[] | undefined): BodyMassRecordInput[] {
  return (records ?? []).map((record) => ({ time: record.time, mass: { value: record.mass.inKilograms, unit: "kilograms" as const } }));
}

let inFlightSync: Promise<BodyScaleSyncResult> | null = null;

/**
 * Синхронизация взвешиваний из Health Connect в журнал тела.
 * Читает записи за последние 90 дней, сопоставляет состав, дедуплицирует
 * против локального журнала и создаёт замеры с детерминированным id.
 * Автозапуск (force: false) уважает переключатель автосинхронизации
 * и не выполняется чаще раза в 10 минут.
 */
export async function syncBodyWeighIns(options: SyncBodyWeighInsOptions): Promise<BodyScaleSyncResult> {
  const empty: BodyScaleSyncResult = { created: 0, skipped: 0 };
  if (Platform.OS !== "android") return empty;
  if (inFlightSync) {
    if (!options.force) return inFlightSync;
    await inFlightSync.catch(() => undefined);
  }
  const run = (async (): Promise<BodyScaleSyncResult> => {
    const state = await loadBodySyncState();
    const nowISO = new Date().toISOString();
    if (!options.force) {
      if (!state.autoSyncEnabled) return empty;
      if (state.lastSyncAtISO) {
        const lastMs = Date.parse(state.lastSyncAtISO);
        if (!Number.isNaN(lastMs) && Date.now() - lastMs < AUTO_SYNC_MIN_INTERVAL_MS) return empty;
      }
    }
    const status = await getBodyScaleStatus();
    if (!status.granted) return { ...empty, granted: false };
    const endISO = nowISO;
    const startISO = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const timeRangeFilter = { operator: "between" as const, startTime: startISO, endTime: endISO };
    const [weightResult, fatResult, leanResult, boneResult, waterResult] = await Promise.all([
      readRecords("Weight", { timeRangeFilter }).catch(() => null),
      readRecords("BodyFat", { timeRangeFilter }).catch(() => null),
      readRecords("LeanBodyMass", { timeRangeFilter }).catch(() => null),
      readRecords("BoneMass", { timeRangeFilter }).catch(() => null),
      readRecords("BodyWaterMass", { timeRangeFilter }).catch(() => null),
    ]);
    const candidates = collectWeighIns(
      toWeightInputs(weightResult?.records as { time: string; weight: { inKilograms: number } }[] | undefined),
      (fatResult?.records as BodyFatRecordInput[] | undefined) ?? [],
      toMassInputs(leanResult?.records as { time: string; mass: { inKilograms: number } }[] | undefined),
      toMassInputs(boneResult?.records as { time: string; mass: { inKilograms: number } }[] | undefined),
      toMassInputs(waterResult?.records as { time: string; mass: { inKilograms: number } }[] | undefined),
      state.processedAtISO,
    );    const pending = dedupeAgainst(await readStoredMeasurements(), candidates);
    for (const candidate of pending) {
      const measurement: Omit<BodyMeasurement, "id"> & { id?: string } = {
        id: bodySyncMeasurementId(candidate.sourceAtISO),
        date: candidate.date,
        weightKg: candidate.weightKg,
        sourceAtISO: candidate.sourceAtISO,
      };
      if (candidate.bodyFatPct !== undefined) measurement.bodyFatPct = candidate.bodyFatPct;
      if (candidate.muscleMassKg !== undefined) measurement.muscleMassKg = candidate.muscleMassKg;
      if (candidate.boneMassKg !== undefined) measurement.boneMassKg = candidate.boneMassKg;
      if (candidate.waterMassKg !== undefined) measurement.waterMassKg = candidate.waterMassKg;
      options.addMeasurement(measurement);
    }
    const processedAtISO = [...state.processedAtISO, ...candidates.map((candidate: WeighInCandidate) => candidate.sourceAtISO)]
      .filter((item, index, all) => all.indexOf(item) === index)
      .slice(-MAX_PROCESSED_TIMESTAMPS);
    const lastCandidate = candidates[candidates.length - 1];
    await saveBodySyncState({
      processedAtISO,
      lastSyncAtISO: nowISO,
      autoSyncEnabled: state.autoSyncEnabled,
    });
    return {
      created: pending.length,
      skipped: candidates.length - pending.length,
      lastWeight: lastCandidate?.weightKg,
      granted: true,
    };
  })();
  inFlightSync = run;
  try {
    return await run;
  } finally {
    if (inFlightSync === run) inFlightSync = null;
  }
}
