import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BodyMetricId = "weightKg" | "bodyFatPct" | "chestCm" | "waistCm" | "hipsCm" | "upperArmCm" | "thighCm";
export type BodyMeasurement = { id: string; date: string } & Partial<Record<BodyMetricId, number>>;
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
type BodyStore = { measurements: BodyMeasurement[]; ready: boolean; addMeasurement: (input: Omit<BodyMeasurement, "id">) => void; removeMeasurement: (id: string) => void };
const Context = createContext<BodyStore | null>(null);

export function BodyProvider({ children }: { children: React.ReactNode }) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (!raw) return; const parsed = JSON.parse(raw) as BodyMeasurement[]; if (Array.isArray(parsed)) setMeasurements(parsed.filter((item) => typeof item?.id === "string" && typeof item?.date === "string")); }).catch(() => undefined).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(measurements)); }, [measurements, ready]);
  const value = useMemo(() => ({ measurements, ready, addMeasurement: (input: Omit<BodyMeasurement, "id">) => setMeasurements((current) => [{ ...input, id: `${input.date}-${Date.now()}` }, ...current].sort((a, b) => b.date.localeCompare(a.date))), removeMeasurement: (id: string) => setMeasurements((current) => current.filter((item) => item.id !== id)) }), [measurements, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useBodyStore() { const value = useContext(Context); if (!value) throw new Error("BodyProvider missing"); return value; }
