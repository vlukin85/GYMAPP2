import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const HOME_WIDGETS = [
  { id: "week" as const, title: "Неделя", description: "План и статус тренировок на текущей неделе" },
  { id: "nutrition" as const, title: "Питание", description: "Дневной прогресс калорий и БЖУ" },
  { id: "trainingTrend" as const, title: "График тренировок", description: "Объём завершённых тренировок" },
  { id: "metrics" as const, title: "Сводные показатели", description: "Количество тренировок, объём и время" },
  { id: "shortcuts" as const, title: "Быстрый доступ", description: "Кнопки календаря и каталога упражнений" },
];

export type HomeWidgetId = typeof HOME_WIDGETS[number]["id"];
export type HomeWidgetVisibility = Record<HomeWidgetId, boolean>;

const DEFAULT_VISIBILITY: HomeWidgetVisibility = { week: true, nutrition: true, trainingTrend: true, metrics: true, shortcuts: true };
const STORAGE_KEY = "ironrise.home-widgets.v1";
type HomeWidgetsContextValue = { visibility: HomeWidgetVisibility; ready: boolean; setWidgetVisible: (id: HomeWidgetId, visible: boolean) => void };
const Context = createContext<HomeWidgetsContextValue | null>(null);

export function HomeWidgetsProvider({ children }: { children: React.ReactNode }) {
  const [visibility, setVisibility] = useState<HomeWidgetVisibility>(DEFAULT_VISIBILITY);
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (!raw) return; const saved = JSON.parse(raw) as Partial<HomeWidgetVisibility>; setVisibility((current) => ({ ...current, ...HOME_WIDGETS.reduce<Partial<HomeWidgetVisibility>>((valid, item) => typeof saved[item.id] === "boolean" ? { ...valid, [item.id]: saved[item.id] } : valid, {}) })); }).catch(() => undefined).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visibility)); }, [visibility, ready]);
  const value = useMemo(() => ({ visibility, ready, setWidgetVisible: (id: HomeWidgetId, visible: boolean) => setVisibility((current) => ({ ...current, [id]: visible })) }), [visibility, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useHomeWidgets() { const value = useContext(Context); if (!value) throw new Error("HomeWidgetsProvider missing"); return value; }
