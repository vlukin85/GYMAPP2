import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/**
 * Выбор основного источника данных о здоровье: Google Fit — основной,
 * Health Connect — резерв. Выбор хранится локально и по умолчанию
 * указывает на Google Fit (требование пользователя).
 */

export type HealthSourceId = "google-fit" | "health-connect";

export const HEALTH_SOURCE_STORAGE_KEY = "ironrise.health-source.v1";
export const DEFAULT_HEALTH_SOURCE: HealthSourceId = "google-fit";

export const HEALTH_SOURCE_OPTIONS: { id: HealthSourceId; title: string; description: string }[] = [
  {
    id: "google-fit",
    title: "Google Fit (основной)",
    description: "Шаги, калории, дистанция, пульс и взвешивания читаются напрямую из Google Fit.",
  },
  {
    id: "health-connect",
    title: "Health Connect (резерв)",
    description: "Данные идут через Health Connect — прежний путь через приложение «Здоровье».",
  },
];

/** Приводит любое сохранённое значение к валидному источнику. */
export function normalizeHealthSource(value: unknown): HealthSourceId {
  return value === "health-connect" ? "health-connect" : DEFAULT_HEALTH_SOURCE;
}

export async function loadHealthSource(): Promise<HealthSourceId> {
  try {
    const raw = await AsyncStorage.getItem(HEALTH_SOURCE_STORAGE_KEY);
    return normalizeHealthSource(raw);
  } catch {
    return DEFAULT_HEALTH_SOURCE;
  }
}

export async function saveHealthSource(source: HealthSourceId): Promise<void> {
  await AsyncStorage.setItem(HEALTH_SOURCE_STORAGE_KEY, normalizeHealthSource(source));
}

export type HealthSourceState = { source: HealthSourceId; setSource: (source: HealthSourceId) => void; ready: boolean };

/** Хук выбора источника: дефолт — Google Fit, значение подхватывается из хранилища. */
export function useHealthSource(): HealthSourceState {
  const [source, setSourceState] = useState<HealthSourceId>(DEFAULT_HEALTH_SOURCE);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    void loadHealthSource().then((loaded) => {
      if (!mounted) return;
      setSourceState(loaded);
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);
  const setSource = (next: HealthSourceId) => {
    const normalized = normalizeHealthSource(next);
    setSourceState(normalized);
    void saveHealthSource(normalized).catch(() => undefined);
  };
  return { source, setSource, ready };
}
