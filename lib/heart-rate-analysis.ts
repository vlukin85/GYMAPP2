import type { HeartRateSampleInput } from "./health-connect-heart-rate";
import { DEFAULT_LANG, translate } from "./i18n";
import type { DictKey, Lang } from "./i18n";

export type HeartRateZoneId = "recovery" | "easy" | "aerobic" | "threshold" | "maximum";
/**
 * Зона пульса. Поле `label` — русская подпись, оставленная для совместимости:
 * зоны сохраняются в завершённой тренировке (heartRateZones) и не должны
 * «замерзать» на языке, который был выбран в момент сохранения. Для показа
 * берите heartRateZoneLabel(id, lang) — он переводит подпись в момент вывода.
 */
export type HeartRateZone = { id: HeartRateZoneId; label: string; labelKey: DictKey; fromRatio: number; toRatio: number; color: string };
export type HeartRateZoneSummary = HeartRateZone & { seconds: number; fromBpm: number; toBpm: number };
export type HeartRateAnalysis = { estimatedMaxBpm?: number; samples: HeartRateSampleInput[]; zones: HeartRateZoneSummary[]; coveredSeconds: number };

export const HEART_RATE_ZONES: HeartRateZone[] = [
  { id: "recovery", label: "Восстановление", labelKey: "workout.summary.zoneRecovery", fromRatio: 0, toRatio: 0.6, color: "#8090A8" },
  { id: "easy", label: "Лёгкая", labelKey: "workout.summary.zoneEasy", fromRatio: 0.6, toRatio: 0.7, color: "#3E85D8" },
  { id: "aerobic", label: "Аэробная", labelKey: "workout.summary.zoneAerobic", fromRatio: 0.7, toRatio: 0.8, color: "#37A67A" },
  { id: "threshold", label: "Пороговая", labelKey: "workout.summary.zoneThreshold", fromRatio: 0.8, toRatio: 0.9, color: "#E4A11B" },
  { id: "maximum", label: "Максимальная", labelKey: "workout.summary.zoneMaximum", fromRatio: 0.9, toRatio: 1.01, color: "#D94343" },
];

/**
 * Название зоны пульса на выбранном языке.
 * Язык — необязательный параметр: без него возвращается русская подпись,
 * поэтому прежние вызовы работают как раньше.
 */
export function heartRateZoneLabel(id: HeartRateZoneId, lang: Lang = DEFAULT_LANG): string {
  const zone = HEART_RATE_ZONES.find((item) => item.id === id) ?? HEART_RATE_ZONES[HEART_RATE_ZONES.length - 1];
  return translate(lang, zone.labelKey);
}

/** Tanaka et al. age-predicted maximum HR: 208 − 0.7 × age. */
export function estimateMaximumHeartRate(ageYears?: number) {
  if (typeof ageYears !== "number" || !Number.isFinite(ageYears) || ageYears < 15 || ageYears > 100) return undefined;
  return Math.round(208 - 0.7 * ageYears);
}

/** Returns the established visual color of the user's actual, current intensity zone. */
export function getActualHeartRateZoneColor(currentBpm?: number, ageYears?: number) {
  const estimatedMaxBpm = estimateMaximumHeartRate(ageYears);
  if (typeof currentBpm !== "number" || !Number.isFinite(currentBpm) || currentBpm <= 0 || !estimatedMaxBpm) return undefined;
  const ratio = currentBpm / estimatedMaxBpm;
  return (HEART_RATE_ZONES.find((zone) => ratio >= zone.fromRatio && ratio < zone.toRatio) ?? HEART_RATE_ZONES[HEART_RATE_ZONES.length - 1]).color;
}

export function compressHeartRateSamples(samples: HeartRateSampleInput[], maxPoints = 180) {
  if (samples.length <= maxPoints) return samples;
  const bucketSize = samples.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, index) => {
    const start = Math.floor(index * bucketSize);
    const end = Math.max(start + 1, Math.floor((index + 1) * bucketSize));
    const bucket = samples.slice(start, end);
    const latest = bucket[bucket.length - 1];
    return { time: latest.time, beatsPerMinute: Math.round(bucket.reduce((sum, sample) => sum + sample.beatsPerMinute, 0) / bucket.length) };
  });
}

/** Splits observed sample intervals into five estimated HRmax zones; gaps longer than 90 seconds are not imputed. */
export function analyzeHeartRate(samples: HeartRateSampleInput[], ageYears?: number, workoutEndTime?: string): HeartRateAnalysis {
  const estimatedMaxBpm = estimateMaximumHeartRate(ageYears);
  const normalized = samples
    .filter((sample) => Number.isFinite(sample.beatsPerMinute) && sample.beatsPerMinute >= 1 && sample.beatsPerMinute <= 300 && !Number.isNaN(Date.parse(sample.time)))
    .sort((first, second) => Date.parse(first.time) - Date.parse(second.time));
  const zones = HEART_RATE_ZONES.map((zone) => ({ ...zone, seconds: 0, fromBpm: estimatedMaxBpm ? Math.round(zone.fromRatio * estimatedMaxBpm) : 0, toBpm: estimatedMaxBpm ? Math.round(Math.min(1, zone.toRatio) * estimatedMaxBpm) : 0 }));
  if (!estimatedMaxBpm || !normalized.length) return { estimatedMaxBpm, samples: compressHeartRateSamples(normalized), zones, coveredSeconds: 0 };
  const endTimestamp = workoutEndTime ? Date.parse(workoutEndTime) : NaN;
  normalized.forEach((sample, index) => {
    const currentTime = Date.parse(sample.time);
    const nextTime = index < normalized.length - 1 ? Date.parse(normalized[index + 1].time) : endTimestamp;
    const seconds = Math.max(0, Math.min(90, Math.round((nextTime - currentTime) / 1000)));
    const ratio = sample.beatsPerMinute / estimatedMaxBpm;
    const zone = zones.find((item) => ratio >= item.fromRatio && ratio < item.toRatio) ?? zones[zones.length - 1];
    zone.seconds += seconds;
  });
  return { estimatedMaxBpm, samples: compressHeartRateSamples(normalized), zones, coveredSeconds: zones.reduce((sum, zone) => sum + zone.seconds, 0) };
}
