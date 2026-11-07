import { summarizeHeartRate, type HeartRateRecordInput, type HeartRateSummary } from "./health-connect-heart-rate";

/**
 * Чистые агрегаторы активности Health Connect: шаги, активные калории, дистанция.
 * Никаких обращений к нативному модулю — только преобразование записей в сводки,
 * чтобы логику можно было покрывать unit-тестами без устройства.
 */

export type ActivityPermission = { accessType: "read"; recordType: "Steps" | "TotalCaloriesBurned" | "Distance" };
export type HeartRatePermission = { accessType: "read"; recordType: "HeartRate" };

/** Разрешения на чтение активности за день (шаги, калории, дистанция). */
export const ACTIVITY_PERMISSIONS: ActivityPermission[] = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "TotalCaloriesBurned" },
  { accessType: "read", recordType: "Distance" },
];

/** Разрешение на пульс — используется и в тренировке, и в сводке дня. */
export const HEART_RATE_PERMISSION: HeartRatePermission = { accessType: "read", recordType: "HeartRate" };

/** Все четыре типа, которые IronRise читает из Health Connect. */
export const ALL_HEALTH_CONNECT_PERMISSIONS: (ActivityPermission | HeartRatePermission)[] = [
  ...ACTIVITY_PERMISSIONS,
  HEART_RATE_PERMISSION,
];

export type ActivityEnergyUnit = "calories" | "joules" | "kilocalories" | "kilojoules";
export type ActivityLengthUnit = "meters" | "kilometers" | "miles" | "inches" | "feet";
export type ActivityEnergyValue = { value: number; unit: ActivityEnergyUnit };
export type ActivityLengthValue = { value: number; unit: ActivityLengthUnit };

export type StepsActivityRecord = { recordType: "Steps"; startTime: string; endTime?: string; count: number };
export type TotalCaloriesActivityRecord = { recordType: "TotalCaloriesBurned"; startTime: string; endTime?: string; energy: ActivityEnergyValue };
export type DistanceActivityRecord = { recordType: "Distance"; startTime: string; endTime?: string; distance: ActivityLengthValue };
export type ActivityRecordInput = StepsActivityRecord | TotalCaloriesActivityRecord | DistanceActivityRecord;

/** Сводка за один день: поле появляется, только если есть валидные записи такого типа. */
export type ActivityDaySummary = { steps?: number; activeKcal?: number; distanceKm?: number };
/** День недели для графика: отсутствующие данные заполняются нулями. */
export type ActivityWeekDay = { dateISO: string; steps: number; activeKcal: number; distanceKm: number };

/** Килокалории в единице измерения Health Connect. */
const KILOCALORIES_PER_UNIT: Record<ActivityEnergyUnit, number> = {
  calories: 0.001,
  joules: 1 / 4184,
  kilocalories: 1,
  kilojoules: 1000 / 4184,
};

/** Километры в единице измерения Health Connect. */
const KILOMETERS_PER_UNIT: Record<ActivityLengthUnit, number> = {
  meters: 0.001,
  kilometers: 1,
  miles: 1.609344,
  inches: 0.0000254,
  feet: 0.0003048,
};

/** Значение метрики валидно, если это конечное неотрицательное число. */
export function isValidMetricValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function energyToKilocalories(energy: ActivityEnergyValue): number | null {
  if (!isValidMetricValue(energy?.value)) return null;
  const factor = KILOCALORIES_PER_UNIT[energy.unit];
  return factor === undefined ? null : energy.value * factor;
}

export function lengthToKilometers(length: ActivityLengthValue): number | null {
  if (!isValidMetricValue(length?.value)) return null;
  const factor = KILOMETERS_PER_UNIT[length.unit];
  return factor === undefined ? null : length.value * factor;
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Локальная дата в формате YYYY-MM-DD (без сдвига на UTC). */
export function localDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Сдвиг даты формата YYYY-MM-DD на заданное число дней. */
export function shiftDateISO(dateISO: string, days: number): string {
  const base = new Date(`${dateISO}T12:00:00`);
  if (Number.isNaN(base.getTime())) return dateISO;
  base.setDate(base.getDate() + days);
  return localDateKey(base);
}

/** Начало локального дня (00:00 по времени устройства) как ISO-строка UTC. */
export function localDayStartISO(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

/**
 * Суммирует записи активности за один день. Записи просто складываются —
 * дедупликация перекрывающихся интервалов не требуется, Health Connect
 * отдаёт непересекающиеся сегменты. Отрицательные и NaN-значения отбрасываются.
 */
export function summarizeActivityDay(records: ActivityRecordInput[]): ActivityDaySummary {
  let steps: number | undefined;
  let activeKcal: number | undefined;
  let distanceKm: number | undefined;
  for (const record of records ?? []) {
    if (!record) continue;
    if (record.recordType === "Steps") {
      if (!isValidMetricValue(record.count)) continue;
      steps = (steps ?? 0) + record.count;
      continue;
    }
    if (record.recordType === "TotalCaloriesBurned") {
      const kcal = energyToKilocalories(record.energy);
      if (kcal === null) continue;
      activeKcal = (activeKcal ?? 0) + kcal;
      continue;
    }
    const km = lengthToKilometers(record.distance);
    if (km === null) continue;
    distanceKm = (distanceKm ?? 0) + km;
  }
  const summary: ActivityDaySummary = {};
  if (steps !== undefined) summary.steps = Math.round(steps);
  if (activeKcal !== undefined) summary.activeKcal = roundTo(activeKcal, 1);
  if (distanceKm !== undefined) summary.distanceKm = roundTo(distanceKm, 2);
  return summary;
}

/**
 * Собирает последние 7 дней (включая якорный) из записей активности.
 * Дни без данных заполняются нулями, результат отсортирован по дате по возрастанию.
 * Якорь по умолчанию — самый поздний день среди записей; без записей и якоря
 * вернётся пустой массив.
 */
export function buildActivityWeek(records: ActivityRecordInput[], anchorISO?: string): ActivityWeekDay[] {
  const byDay = new Map<string, ActivityRecordInput[]>();
  let latest: string | undefined;
  for (const record of records ?? []) {
    if (!record || typeof record.startTime !== "string") continue;
    const time = Date.parse(record.startTime);
    if (Number.isNaN(time)) continue;
    const key = localDateKey(new Date(time));
    const bucket = byDay.get(key);
    if (bucket) bucket.push(record);
    else byDay.set(key, [record]);
    if (!latest || key > latest) latest = key;
  }
  const anchor = anchorISO ?? latest;
  if (!anchor || Number.isNaN(Date.parse(`${anchor}T12:00:00`))) return [];
  const days: ActivityWeekDay[] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const dateISO = shiftDateISO(anchor, offset);
    const summary = summarizeActivityDay(byDay.get(dateISO) ?? []);
    days.push({
      dateISO,
      steps: summary.steps ?? 0,
      activeKcal: summary.activeKcal ?? 0,
      distanceKm: summary.distanceKm ?? 0,
    });
  }
  return days;
}

/** Сводка пульса за день — переиспользует общий агрегатор тренировок. */
export function summarizeDailyHeartRate(records: HeartRateRecordInput[]): HeartRateSummary {
  return summarizeHeartRate(records);
}
