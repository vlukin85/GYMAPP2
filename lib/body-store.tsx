import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BodyMetricId = "weightKg" | "bodyFatPct" | "chestCm" | "waistCm" | "hipsCm" | "upperArmCm" | "thighCm";
export type BodyProfile = "male" | "female";
export type DailyActivityLevel = "sedentary" | "light" | "moderate" | "high";
export const DAILY_ACTIVITY_LEVELS: Array<{ id: DailyActivityLevel; title: string; description: string; movementShare: number }> = [
  { id: "sedentary", title: "Сидячий", description: "Минимум ходьбы и повседневного движения", movementShare: 0.1 },
  { id: "light", title: "Лёгкий", description: "Обычная ходьба и домашние дела", movementShare: 0.2 },
  { id: "moderate", title: "Умеренный", description: "Много ходьбы или работа на ногах", movementShare: 0.35 },
  { id: "high", title: "Высокий", description: "Подвижная физическая работа почти весь день", movementShare: 0.5 },
];
export type BodyMeasurement = { id: string; date: string } & Partial<Record<BodyMetricId, number>>;
export type BodyProgressPhoto = { id: string; date: string; uri: string; createdAt: string };
export type BodyGoals = Partial<Record<BodyMetricId, number>>;
export const BODY_METRICS: Array<{ id: BodyMetricId; label: string; unit: string; short: string }> = [
  { id: "weightKg", label: "Вес", unit: "кг", short: "ВЕС" },
  { id: "bodyFatPct", label: "Жир", unit: "%", short: "ЖИР" },
  { id: "chestCm", label: "Грудь", unit: "см", short: "ГРУДЬ" },
  { id: "waistCm", label: "Талия", unit: "см", short: "ТАЛИЯ" },
  { id: "hipsCm", label: "Бёдра", unit: "см", short: "БЁДРА" },
  { id: "upperArmCm", label: "Бицепс", unit: "см", short: "БИЦЕПС" },
  { id: "thighCm", label: "Бедро", unit: "см", short: "БЕДРО" },
];

const STORAGE_KEY = "ironrise.body-measurements.v1";
const PHOTO_STORAGE_KEY = "ironrise.body-progress-photos.v1";
const PROFILE_STORAGE_KEY = "ironrise.body-profile.v1";
const DETAILS_STORAGE_KEY = "ironrise.body-profile-details.v1";
type BodyStore = { measurements: BodyMeasurement[]; photos: BodyProgressPhoto[]; profile: BodyProfile; heightCm?: number; ageYears?: number; goals: BodyGoals; activityLevel: DailyActivityLevel; ready: boolean; addMeasurement: (input: Omit<BodyMeasurement, "id">) => void; removeMeasurement: (id: string) => void; addPhoto: (input: Omit<BodyProgressPhoto, "id" | "createdAt">) => void; removePhoto: (id: string) => void; setProfile: (profile: BodyProfile) => void; setProfileDetails: (details: { heightCm?: number; ageYears?: number }) => void; setGoals: (goals: BodyGoals) => void; setActivityLevel: (level: DailyActivityLevel) => void };
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
  const value = useMemo(() => ({ measurements, photos, profile, heightCm, ageYears, goals, activityLevel, ready, addMeasurement: (input: Omit<BodyMeasurement, "id">) => setMeasurements((current) => [{ ...input, id: `${input.date}-${Date.now()}` }, ...current].sort((a, b) => b.date.localeCompare(a.date))), removeMeasurement: (id: string) => setMeasurements((current) => current.filter((item) => item.id !== id)), addPhoto: (input: Omit<BodyProgressPhoto, "id" | "createdAt">) => setPhotos((current) => [{ ...input, id: `${input.date}-${Date.now()}`, createdAt: new Date().toISOString() }, ...current].sort((a, b) => b.date.localeCompare(a.date))), removePhoto: (id: string) => setPhotos((current) => current.filter((item) => item.id !== id)), setProfile, setProfileDetails: (details: { heightCm?: number; ageYears?: number }) => { setHeightCm(Number.isFinite(details.heightCm) && (details.heightCm ?? 0) > 0 ? Math.round(details.heightCm!) : undefined); setAgeYears(Number.isFinite(details.ageYears) && (details.ageYears ?? 0) > 0 ? Math.round(details.ageYears!) : undefined); }, setGoals: (nextGoals: BodyGoals) => setGoals(Object.fromEntries(Object.entries(nextGoals).filter(([key, value]) => BODY_METRICS.some((metric) => metric.id === key) && Number.isFinite(value) && Number(value) > 0)) as BodyGoals), setActivityLevel }), [measurements, photos, profile, heightCm, ageYears, goals, activityLevel, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useBodyStore() { const value = useContext(Context); if (!value) throw new Error("BodyProvider missing"); return value; }
