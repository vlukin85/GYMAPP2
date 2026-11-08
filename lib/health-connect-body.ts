import { isValidMetricValue, localDateKey, roundTo } from "./health-connect-activity";

/**
 * Чистая логика импорта взвешиваний из Health Connect: сопоставление записей
 * Weight с составом тела (BodyFat, LeanBodyMass, BoneMass, BodyWaterMass),
 * конвертация единиц и дедупликация против локального журнала замеров.
 * Никаких обращений к нативному модулю или хранилищу — только преобразование
 * записей в кандидатов, чтобы логику можно было покрывать unit-тестами.
 * Мгновенные записи Health Connect (Weight, BodyFat и т. д.) несут метку `time`.
 */

export type BodyMassUnit = "grams" | "kilograms" | "milligrams" | "micrograms" | "ounces" | "pounds";
export type BodyMassValue = { value: number; unit: BodyMassUnit };

export type BodyScalePermission = { accessType: "read"; recordType: "Weight" | "BodyFat" | "LeanBodyMass" | "BoneMass" | "BodyWaterMass" };

/** Разрешения на чтение веса и состава тела из Health Connect. */
export const BODY_SCALE_PERMISSIONS: BodyScalePermission[] = [
  { accessType: "read", recordType: "Weight" },
  { accessType: "read", recordType: "BodyFat" },
  { accessType: "read", recordType: "LeanBodyMass" },
  { accessType: "read", recordType: "BoneMass" },
  { accessType: "read", recordType: "BodyWaterMass" },
];

/** Килограммы в единице измерения Health Connect. */
const KILOGRAMS_PER_UNIT: Record<BodyMassUnit, number> = {
  kilograms: 1,
  grams: 0.001,
  milligrams: 0.000001,
  micrograms: 0.000000001,
  ounces: 0.028349523125,
  pounds: 0.45359237,
};

export type WeightRecordInput = { time: string; weight: BodyMassValue };
export type BodyFatRecordInput = { time: string; percentage: number };
export type LeanBodyMassRecordInput = { time: string; mass: BodyMassValue };
export type BoneMassRecordInput = { time: string; mass: BodyMassValue };
export type BodyWaterMassRecordInput = { time: string; mass: BodyMassValue };
export type BodyMassRecordInput = LeanBodyMassRecordInput | BoneMassRecordInput | BodyWaterMassRecordInput;

/** Кандидат взвешивания: вес с составом, сопоставленным по ближайшей метке времени. */
export type WeighInCandidate = {
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  boneMassKg?: number;
  waterMassKg?: number;
  sourceAtISO: string;
};

export type ExistingMeasurementLike = { date: string; weightKg?: number };

/** Допуск сопоставления состава с весом: ±2 минуты между метками записей. */
export const COMPOSITION_MATCH_TOLERANCE_MS = 2 * 60 * 1000;

/** Значение массы валидно и переводится в килограммы. */
export function massToKilograms(mass: BodyMassValue | undefined): number | null {
  if (!mass || !isValidMetricValue(mass.value)) return null;
  const factor = KILOGRAMS_PER_UNIT[mass.unit];
  return factor === undefined ? null : mass.value * factor;
}

/** Процент жира валиден, если это конечное число в диапазоне 0–100. */
export function bodyFatToPercent(percentage: number | undefined): number | null {
  if (typeof percentage !== "number" || !Number.isFinite(percentage)) return null;
  if (percentage < 0 || percentage > 100) return null;
  return percentage;
}

function parseTime(time: string | undefined): number | null {
  if (typeof time !== "string") return null;
  const timeMs = Date.parse(time);
  return Number.isNaN(timeMs) ? null : timeMs;
}

/** Ближайшая запись состава к метке веса в пределах допуска ±COMPOSITION_MATCH_TOLERANCE_MS. */
function closestWithinTolerance<T extends { time: string }>(records: T[], targetMs: number): T | null {
  let best: T | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const record of records ?? []) {
    const timeMs = parseTime(record?.time);
    if (timeMs === null) continue;
    const delta = Math.abs(timeMs - targetMs);
    if (delta > COMPOSITION_MATCH_TOLERANCE_MS) continue;
    if (delta < bestDelta) {
      best = record;
      bestDelta = delta;
    }
  }
  return best;
}

function compositionKg(mass: BodyMassValue | undefined): number | undefined {
  const kg = massToKilograms(mass);
  return kg === null ? undefined : roundTo(kg, 1);
}

/**
 * Сопоставляет записи веса с составом тела по ближайшей метке времени (±2 минуты)
 * и отфильтровывает веса, уже обработанные прошлыми синками
 * (processedTimestampsISO — метки записей веса из прошлых синхронизаций).
 * Битые значения (NaN, отрицательные, нулевой вес, проценты вне 0–100) отбрасываются.
 */
export function collectWeighIns(
  weightRecords: WeightRecordInput[],
  bodyFatRecords: BodyFatRecordInput[],
  leanRecords: LeanBodyMassRecordInput[],
  boneRecords: BoneMassRecordInput[],
  waterRecords: BodyWaterMassRecordInput[],
  processedTimestampsISO: string[],
): WeighInCandidate[] {
  const processedTimes = new Set(
    (processedTimestampsISO ?? []).map((iso) => parseTime(iso)).filter((timeMs): timeMs is number => timeMs !== null),
  );
  const validFat = (bodyFatRecords ?? []).filter((record) => bodyFatToPercent(record?.percentage) !== null);
  const validLean = (leanRecords ?? []).filter((record) => massToKilograms(record?.mass) !== null);
  const validBone = (boneRecords ?? []).filter((record) => massToKilograms(record?.mass) !== null);
  const validWater = (waterRecords ?? []).filter((record) => massToKilograms(record?.mass) !== null);
  const candidates: WeighInCandidate[] = [];
  for (const record of weightRecords ?? []) {
    const timeMs = parseTime(record?.time);
    if (timeMs === null) continue;
    const weightKg = massToKilograms(record?.weight);
    if (weightKg === null || weightKg <= 0) continue;
    if (processedTimes.has(timeMs)) continue;
    const fatRecord = closestWithinTolerance(validFat, timeMs);
    const leanRecord = closestWithinTolerance(validLean, timeMs);
    const boneRecord = closestWithinTolerance(validBone, timeMs);
    const waterRecord = closestWithinTolerance(validWater, timeMs);
    const candidate: WeighInCandidate = {
      date: localDateKey(new Date(timeMs)),
      weightKg: roundTo(weightKg, 1),
      sourceAtISO: record.time,
    };
    const bodyFatPct = bodyFatToPercent(fatRecord?.percentage);
    if (bodyFatPct !== null) candidate.bodyFatPct = roundTo(bodyFatPct, 1);
    const muscleMassKg = compositionKg(leanRecord?.mass);
    if (muscleMassKg !== undefined) candidate.muscleMassKg = muscleMassKg;
    const boneMassKg = compositionKg(boneRecord?.mass);
    if (boneMassKg !== undefined) candidate.boneMassKg = boneMassKg;
    const waterMassKg = compositionKg(waterRecord?.mass);
    if (waterMassKg !== undefined) candidate.waterMassKg = waterMassKg;
    candidates.push(candidate);
  }
  return candidates.sort((first, second) => Date.parse(first.sourceAtISO) - Date.parse(second.sourceAtISO));
}

/**
 * Отфильтровывает кандидатов, дублирующих локальный журнал: на ту же дату
 * уже есть замер с тем же весом (±0,1 кг). Другая дата или другой вес
 * создают отдельную запись.
 */
export function dedupeAgainst(existingMeasurements: ExistingMeasurementLike[], candidates: WeighInCandidate[]): WeighInCandidate[] {
  return (candidates ?? []).filter((candidate) => {
    const duplicate = (existingMeasurements ?? []).some(
      (measurement) =>
        measurement?.date === candidate.date &&
        typeof measurement?.weightKg === "number" &&
        Number.isFinite(measurement.weightKg) &&
        Math.abs(measurement.weightKg - candidate.weightKg) <= 0.1,
    );
    return !duplicate;
  });
}

/** Детерминированный идентификатор замера из Health Connect: `hc-<timestampISO>`. */
export function bodySyncMeasurementId(sourceAtISO: string): string {
  return `hc-${sourceAtISO}`;
}

/** Образец веса из Google Fit: метка времени записи и вес в килограммах. */
export type GoogleFitWeightSampleInput = { timestampISO: string; weightKg: number };

/**
 * Собирает кандидатов взвешиваний из образцов веса Google Fit.
 * Состав тела (жир, мышцы, кости, вода) библиотека react-native-google-fit
 * не отдаёт, поэтому из Google Fit сохраняется только вес — поля состава
 * остаются опциональными. Механизмы те же, что у Health Connect: пропуск
 * меток из журнала прошлых синхронизаций и сортировка по времени.
 */
export function collectGoogleFitWeighIns(
  samples: GoogleFitWeightSampleInput[],
  processedTimestampsISO: string[],
): WeighInCandidate[] {
  const processedTimes = new Set(
    (processedTimestampsISO ?? []).map((iso) => parseTime(iso)).filter((timeMs): timeMs is number => timeMs !== null),
  );
  const candidates: WeighInCandidate[] = [];
  for (const sample of samples ?? []) {
    const timeMs = parseTime(sample?.timestampISO);
    if (timeMs === null) continue;
    if (!isValidMetricValue(sample?.weightKg) || sample.weightKg <= 0) continue;
    if (processedTimes.has(timeMs)) continue;
    candidates.push({
      date: localDateKey(new Date(timeMs)),
      weightKg: roundTo(sample.weightKg, 1),
      sourceAtISO: sample.timestampISO,
    });
  }
  return candidates.sort((first, second) => Date.parse(first.sourceAtISO) - Date.parse(second.sourceAtISO));
}

/** Детерминированный идентификатор замера из Google Fit: `gf-<timestampISO>`. */
export function googleFitMeasurementId(sourceAtISO: string): string {
  return `gf-${sourceAtISO}`;
}
