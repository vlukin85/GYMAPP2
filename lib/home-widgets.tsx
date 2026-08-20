import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const HOME_WIDGETS = [
  { id: "quote" as const, title: "Цитата дня", description: "Ежедневная мотивационная цитата спортсмена" },
  { id: "week" as const, title: "Неделя", description: "План и статус тренировок на текущей неделе" },
  { id: "nutrition" as const, title: "Питание", description: "Дневной прогресс калорий и БЖУ" },
  { id: "trainingTrend" as const, title: "График тренировок", description: "Объём завершённых тренировок" },
  { id: "metrics" as const, title: "Сводные показатели", description: "Количество тренировок, объём и время" },
  { id: "shortcuts" as const, title: "Быстрый доступ", description: "Кнопки календаря и каталога упражнений" },
];

export type HomeWidgetId = typeof HOME_WIDGETS[number]["id"];
export type HomeWidgetVisibility = Record<HomeWidgetId, boolean>;
export type HomeWidgetCompact = Record<HomeWidgetId, boolean>;
export type HomeWidgetPreferences = { visibility: HomeWidgetVisibility; order: HomeWidgetId[]; compact: HomeWidgetCompact; dragHintSeen: boolean; dragHapticsEnabled: boolean };

export const DEFAULT_HOME_WIDGETS: HomeWidgetPreferences = {
  visibility: { quote: true, week: true, nutrition: true, trainingTrend: true, metrics: true, shortcuts: true },
  order: HOME_WIDGETS.map((item) => item.id),
  compact: { quote: false, week: false, nutrition: false, trainingTrend: false, metrics: false, shortcuts: false },
  dragHintSeen: false,
  dragHapticsEnabled: true,
};

const STORAGE_KEY = "ironrise.home-widgets.v1";
type HomeWidgetsContextValue = HomeWidgetPreferences & {
  ready: boolean;
  setWidgetVisible: (id: HomeWidgetId, visible: boolean) => void;
  setWidgetCompact: (id: HomeWidgetId, compact: boolean) => void;
  moveWidget: (id: HomeWidgetId, destination: number) => void;
  dismissWidgetDragHint: () => void;
  setWidgetDragHapticsEnabled: (enabled: boolean) => void;
  resetWidgets: () => void;
};
const Context = createContext<HomeWidgetsContextValue | null>(null);

function validFlags(source: Record<string, unknown>, fallback: Record<HomeWidgetId, boolean>) {
  return HOME_WIDGETS.reduce<Record<HomeWidgetId, boolean>>((result, item) => ({ ...result, [item.id]: typeof source[item.id] === "boolean" ? source[item.id] as boolean : fallback[item.id] }), { ...fallback });
}

function normalize(raw: unknown): HomeWidgetPreferences {
  const saved = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const legacyVisibility = saved.visibility && typeof saved.visibility === "object" ? saved.visibility as Record<string, unknown> : saved;
  const compact = saved.compact && typeof saved.compact === "object" ? saved.compact as Record<string, unknown> : {};
  const candidateOrder = Array.isArray(saved.order) ? saved.order.filter((id): id is HomeWidgetId => HOME_WIDGETS.some((item) => item.id === id)) : [];
  return { visibility: validFlags(legacyVisibility, DEFAULT_HOME_WIDGETS.visibility), compact: validFlags(compact, DEFAULT_HOME_WIDGETS.compact), order: [...candidateOrder, ...DEFAULT_HOME_WIDGETS.order.filter((id) => !candidateOrder.includes(id))], dragHintSeen: saved.dragHintSeen === true, dragHapticsEnabled: saved.dragHapticsEnabled !== false };
}

export function HomeWidgetsProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<HomeWidgetPreferences>(DEFAULT_HOME_WIDGETS);
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (raw) setPreferences(normalize(JSON.parse(raw))); }).catch(() => undefined).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }, [preferences, ready]);
  const value = useMemo(() => ({
    ...preferences,
    ready,
    setWidgetVisible: (id: HomeWidgetId, visible: boolean) => setPreferences((current) => ({ ...current, visibility: { ...current.visibility, [id]: visible } })),
    setWidgetCompact: (id: HomeWidgetId, compact: boolean) => setPreferences((current) => ({ ...current, compact: { ...current.compact, [id]: compact } })),
    moveWidget: (id: HomeWidgetId, destination: number) => setPreferences((current) => { const from = current.order.indexOf(id); if (from === -1) return current; const order = current.order.filter((item) => item !== id); order.splice(Math.max(0, Math.min(order.length, destination)), 0, id); return { ...current, order }; }),
    dismissWidgetDragHint: () => setPreferences((current) => current.dragHintSeen ? current : { ...current, dragHintSeen: true }),
    setWidgetDragHapticsEnabled: (enabled: boolean) => setPreferences((current) => current.dragHapticsEnabled === enabled ? current : { ...current, dragHapticsEnabled: enabled }),
    resetWidgets: () => setPreferences(DEFAULT_HOME_WIDGETS),
  }), [preferences, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useHomeWidgets() { const value = useContext(Context); if (!value) throw new Error("HomeWidgetsProvider missing"); return value; }
