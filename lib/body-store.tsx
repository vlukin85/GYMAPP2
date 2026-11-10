import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BodyMetricId = "weightKg" | "bodyFatPct" | "chestCm" | "waistCm" | "hipsCm" | "upperArmCm" | "thighCm";
export type BodyProfile = "male" | "female";
export type DailyActivityLevel = "sedentary" | "light" | "moderate" | "high";
/**
 * Уровни повседневной активности. Русские title/description — исторические
 * значения по умолчанию (их читают расчёты и старые экраны), английские
 * дубли лежат в titleEn/descriptionEn и выбираются через activityLevelTitle()/
 * activityLevelDescription() по текущему языку приложения.
 */
export const DAILY_ACTIVITY_LEVELS: Array<{ id: DailyActivityLevel; title: string; titleEn: string; description: string; descriptionEn: string; movementShare: number }> = [
  { id: "sedentary", title: "Сидячий", titleEn: "Sedentary", description: "Минимум ходьбы и повседневного движения", descriptionEn: "Minimal walking and everyday movement", movementShare: 0.1 },
  { id: "light", title: "Лёгкий", titleEn: "Light", description: "Обычная ходьба и домашние дела", descriptionEn: "Regular walking and household chores", movementShare: 0.2 },
  { id: "moderate", title: "Умеренный", titleEn: "Moderate", description: "Много ходьбы или работа на ногах", descriptionEn: "Lots of walking or an on-your-feet job", movementShare: 0.35 },
  { id: "high", title: "Высокий", titleEn: "High", description: "Подвижная физическая работа почти весь день", descriptionEn: "Active physical work almost all day", movementShare: 0.5 },
];

/** Язык, под который выбираются подписи метрик и уровней активности. */
type BodyLang = "ru" | "en";
/** Состав тела от умных весов: поля опциональные и не входят в BODY_METRICS, чтобы не ломать UI метрик и расчёты. */
export type BodyCompositionFields = { muscleMassKg?: number; boneMassKg?: number; waterMassKg?: number; bmiKgM2?: number; sourceAtISO?: string };
export type BodyMeasurement = { id: string; date: string } & Partial<Record<BodyMetricId, number>> & BodyCompositionFields;
export type BodyProgressPhoto = { id: string; date: string; uri: string; createdAt: string };
export type BodyGoals = Partial<Record<BodyMetricId, number>>;
/**
 * Метрики тела. Русские label/unit/short — значения по умолчанию для расчётов
 * и старых вызовов; английские пары лежат в labelEn/unitEn/shortEn и
 * выбираются через bodyMetricLabel()/bodyMetricUnit()/bodyMetricShort().
 */
export const BODY_METRICS: Array<{ id: BodyMetricId; label: string; labelEn: string; unit: string; unitEn: string; short: string; shortEn: string }> = [
  { id: "weightKg", label: "Вес", labelEn: "Weight", unit: "кг", unitEn: "kg", short: "ВЕС", shortEn: "WEIGHT" },
  { id: "bodyFatPct", label: "Жир", labelEn: "Body fat", unit: "%", unitEn: "%", short: "ЖИР", shortEn: "FAT" },
  { id: "chestCm", label: "Грудь", labelEn: "Chest", unit: "см", unitEn: "cm", short: "ГРУДЬ", shortEn: "CHEST" },
  { id: "waistCm", label: "Талия", labelEn: "Waist", unit: "см", unitEn: "cm", short: "ТАЛИЯ", shortEn: "WAIST" },
  { id: "hipsCm", label: "Бёдра", labelEn: "Hips", unit: "см", unitEn: "cm", short: "БЁДРА", shortEn: "HIPS" },
  { id: "upperArmCm", label: "Бицепс", labelEn: "Biceps", unit: "см", unitEn: "cm", short: "БИЦЕПС", shortEn: "BICEPS" },
  { id: "thighCm", label: "Бедро", labelEn: "Thigh", unit: "см", unitEn: "cm", short: "БЕДРО", shortEn: "THIGH" },
];

/** Подпись метрики под выбранный язык: английский с откатом на русский. */
export function bodyMetricLabel(metric: (typeof BODY_METRICS)[number], lang: BodyLang): string {
  return lang === "en" ? metric.labelEn : metric.label;
}
/** Единица измерения метрики под выбранный язык. */
export function bodyMetricUnit(metric: (typeof BODY_METRICS)[number], lang: BodyLang): string {
  return lang === "en" ? metric.unitEn : metric.unit;
}
/** Короткая подпись метрики (для чипов и колонок) под выбранный язык. */
export function bodyMetricShort(metric: (typeof BODY_METRICS)[number], lang: BodyLang): string {
  return lang === "en" ? metric.shortEn : metric.short;
}
/** Название уровня повседневной активности под выбранный язык. */
export function activityLevelTitle(level: (typeof DAILY_ACTIVITY_LEVELS)[number], lang: BodyLang): string {
  return lang === "en" ? level.titleEn : level.title;
}
/** Описание уровня повседневной активности под выбранный язык. */
export function activityLevelDescription(level: (typeof DAILY_ACTIVITY_LEVELS)[number], lang: BodyLang): string {
  return lang === "en" ? level.descriptionEn : level.description;
}
/** Уровень активности по id с учётом языка — удобно для экранов настроек. */
export function activityLevelById(id: DailyActivityLevel, lang: BodyLang): { title: string; description: string; movementShare: number } {
  const level = DAILY_ACTIVITY_LEVELS.find((item) => item.id === id) ?? DAILY_ACTIVITY_LEVELS[1];
  return { title: activityLevelTitle(level, lang), description: activityLevelDescription(level, lang), movementShare: level.movementShare };
}

export const BODY_MEASUREMENTS_STORAGE_KEY = "ironrise.body-measurements.v1";
const STORAGE_KEY = BODY_MEASUREMENTS_STORAGE_KEY;
const PHOTO_STORAGE_KEY = "ironrise.body-progress-photos.v1";
const PROFILE_STORAGE_KEY = "ironrise.body-profile.v1";
const DETAILS_STORAGE_KEY = "ironrise.body-profile-details.v1";
type BodyStore = { measurements: BodyMeasurement[]; photos: BodyProgressPhoto[]; profile: BodyProfile; heightCm?: number; ageYears?: number; goals: BodyGoals; activityLevel: DailyActivityLevel; ready: boolean; addMeasurement: (input: Omit<BodyMeasurement, "id"> & { id?: string }) => void; removeMeasurement: (id: string) => void; addPhoto: (input: Omit<BodyProgressPhoto, "id" | "createdAt">) => void; removePhoto: (id: string) => void; setProfile: (profile: BodyProfile) => void; setProfileDetails: (details: { heightCm?: number; ageYears?: number }) => void; setGoals: (goals: BodyGoals) => void; setActivityLevel: (level: DailyActivityLevel) => void };
const Context = createContext<BodyStore | null>(null);

export function BodyProvider({ children }: { children: React.ReactNode }) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [photos, setPhotos] = useState<BodyProgressPhoto[]>([]);
  const [profile, setProfile] = useState<BodyProfile>("male");
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [ageYears, setAgeYears] = useState<number | undefined>();
  const [goals, setGoals] = useState<BodyGoals>({});
  const [activityLevel, setActivityLevel] = useState<DailyActivityLevel>("light");
  const [ready, setReady] = useState(false);
  useEffect(() => { Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(PHOTO_STORAGE_KEY), AsyncStorage.getItem(PROFILE_STORAGE_KEY), AsyncStorage.getItem(DETAILS_STORAGE_KEY)]).then(([measurementRaw, photoRaw, profileRaw, detailsRaw]) => { if (measurementRaw) { const parsed = JSON.parse(measurementRaw) as BodyMeasurement[]; if (Array.isArray(parsed)) setMeasurements(parsed.filter((item) => typeof item?.id === "string" && typeof item?.date === "string")); } if (photoRaw) { const parsed = JSON.parse(photoRaw) as BodyProgressPhoto[]; if (Array.isArray(parsed)) setPhotos(parsed.filter((item) => typeof item?.id === "string" && typeof item?.date === "string" && typeof item?.uri === "string")); } if (profileRaw === "male" || profileRaw === "female") setProfile(profileRaw); if (detailsRaw) { const details = JSON.parse(detailsRaw) as { heightCm?: number; ageYears?: number; goals?: BodyGoals; activityLevel?: DailyActivityLevel }; if (Number.isFinite(details.heightCm) && (details.heightCm ?? 0) > 0) setHeightCm(details.heightCm); if (Number.isFinite(details.ageYears) && (details.ageYears ?? 0) > 0) setAgeYears(details.ageYears); if (details.goals && typeof details.goals === "object") setGoals(Object.fromEntries(Object.entries(details.goals).filter(([key, value]) => BODY_METRICS.some((metric) => metric.id === key) && Number.isFinite(value) && Number(value) > 0)) as BodyGoals); if (DAILY_ACTIVITY_LEVELS.some((level) => level.id === details.activityLevel)) setActivityLevel(details.activityLevel!); } }).catch(() => undefined).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(measurements)); }, [measurements, ready]);
  useEffect(() => { if (ready) void AsyncStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos)); }, [photos, ready]);
  useEffect(() => { if (ready) void AsyncStorage.setItem(PROFILE_STORAGE_KEY, profile); }, [profile, ready]);
  useEffect(() => { if (ready) void AsyncStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify({ heightCm, ageYears, goals, activityLevel })); }, [heightCm, ageYears, goals, activityLevel, ready]);
  const value = useMemo(() => ({ measurements, photos, profile, heightCm, ageYears, goals, activityLevel, ready, addMeasurement: (input: Omit<BodyMeasurement, "id"> & { id?: string }) => setMeasurements((current) => [createMeasurementRecord(input), ...current].sort((a, b) => b.date.localeCompare(a.date))), removeMeasurement: (id: string) => setMeasurements((current) => current.filter((item) => item.id !== id)), addPhoto: (input: Omit<BodyProgressPhoto, "id" | "createdAt">) => setPhotos((current) => [{ ...input, id: `${input.date}-${Date.now()}`, createdAt: new Date().toISOString() }, ...current].sort((a, b) => b.date.localeCompare(a.date))), removePhoto: (id: string) => setPhotos((current) => current.filter((item) => item.id !== id)), setProfile, setProfileDetails: (details: { heightCm?: number; ageYears?: number }) => { setHeightCm(Number.isFinite(details.heightCm) && (details.heightCm ?? 0) > 0 ? Math.round(details.heightCm!) : undefined); setAgeYears(Number.isFinite(details.ageYears) && (details.ageYears ?? 0) > 0 ? Math.round(details.ageYears!) : undefined); }, setGoals: (nextGoals: BodyGoals) => setGoals(Object.fromEntries(Object.entries(nextGoals).filter(([key, value]) => BODY_METRICS.some((metric) => metric.id === key) && Number.isFinite(value) && Number(value) > 0)) as BodyGoals), setActivityLevel }), [measurements, photos, profile, heightCm, ageYears, goals, activityLevel, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Создаёт запись замера: id можно задать извне (синхронизация весов использует детерминированный `hc-<timestampISO>`). */
export function createMeasurementRecord(input: Omit<BodyMeasurement, "id"> & { id?: string }): BodyMeasurement {
  return { ...input, id: input.id ?? `${input.date}-${Date.now()}` };
}
export function useBodyStore() { const value = useContext(Context); if (!value) throw new Error("BodyProvider missing"); return value; }
