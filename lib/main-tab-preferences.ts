import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const MAIN_TABS = [
  {
    id: "today",
    route: "/(tabs)",
    title: "ГЛАВНОЕ",
    settingsTitle: "Главное",
    description: "Экран на сегодня и виджеты",
    required: true,
  },
  {
    id: "calendar",
    route: "/(tabs)/calendar",
    title: "ПЛАН",
    settingsTitle: "План",
    description: "Календарь и расписание тренировок",
    required: true,
  },
  {
    id: "exercises",
    route: "/(tabs)/exercises",
    title: "УПРАЖНЕНИЯ",
    settingsTitle: "Упражнения",
    description: "Каталог и техника выполнения",
    required: false,
  },
  {
    id: "programs",
    route: "/(tabs)/programs",
    title: "ПРОГРАММЫ",
    settingsTitle: "Программы",
    description: "Сохранённые планы тренировок",
    required: false,
  },
  {
    id: "nutrition",
    route: "/(tabs)/nutrition",
    title: "ПИТАНИЕ",
    settingsTitle: "Питание",
    description: "Дневник калорий и БЖУ",
    required: false,
  },
  {
    id: "stats",
    route: "/(tabs)/stats",
    title: "ПРОГРЕСС",
    settingsTitle: "Прогресс",
    description: "Статистика и личные рекорды",
    required: false,
  },
  {
    id: "body",
    route: "/(tabs)/body",
    title: "ТЕЛО",
    settingsTitle: "Тело",
    description: "Замеры, цели и динамика",
    required: false,
  },
  {
    id: "settings",
    route: "/(tabs)/settings",
    title: "НАСТРОЙКИ",
    settingsTitle: "Настройки",
    description: "Параметры IronRise",
    required: true,
  },
] as const;

export type MainTabId = (typeof MAIN_TABS)[number]["id"];
export type MainTabVisibility = Record<MainTabId, boolean>;
export type MainTabPreferences = {
  visibility: MainTabVisibility;
  order: MainTabId[];
  compact: boolean;
};

export const DEFAULT_MAIN_TAB_VISIBILITY: MainTabVisibility = {
  today: true,
  calendar: true,
  exercises: true,
  programs: true,
  nutrition: true,
  stats: true,
  body: true,
  settings: true,
};

export const DEFAULT_MAIN_TAB_PREFERENCES: MainTabPreferences = {
  visibility: DEFAULT_MAIN_TAB_VISIBILITY,
  order: MAIN_TABS.map((tab) => tab.id),
  compact: false,
};

const STORAGE_KEY = "ironrise.main-tab-preferences.v2";

export function normalizeMainTabPreferences(raw: unknown): MainTabPreferences {
  const saved =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const visibilitySource =
    saved.visibility && typeof saved.visibility === "object"
      ? (saved.visibility as Record<string, unknown>)
      : saved;
  const visibility = MAIN_TABS.reduce<MainTabVisibility>(
    (visibility, tab) => {
      visibility[tab.id] = tab.required
        ? true
        : typeof visibilitySource[tab.id] === "boolean"
          ? (visibilitySource[tab.id] as boolean)
          : DEFAULT_MAIN_TAB_VISIBILITY[tab.id];
      return visibility;
    },
    { ...DEFAULT_MAIN_TAB_VISIBILITY },
  );
  const candidateOrder = Array.isArray(saved.order)
    ? saved.order.filter(
        (id): id is MainTabId =>
          typeof id === "string" && MAIN_TABS.some((tab) => tab.id === id),
      )
    : [];
  const order = [
    ...new Set([...candidateOrder, ...DEFAULT_MAIN_TAB_PREFERENCES.order]),
  ];
  return { visibility, order, compact: saved.compact === true };
}

export function normalizeMainTabVisibility(raw: unknown): MainTabVisibility {
  return normalizeMainTabPreferences(raw).visibility;
}

type MainTabPreferencesContextValue = {
  ready: boolean;
  visibility: MainTabVisibility;
  order: MainTabId[];
  compact: boolean;
  setTabVisible: (id: MainTabId, visible: boolean) => void;
  moveTab: (id: MainTabId, destination: number) => void;
  setTabCompact: (compact: boolean) => void;
  resetTabs: () => void;
};

const Context = createContext<MainTabPreferencesContextValue | null>(null);

export function MainTabPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<MainTabPreferences>(
    DEFAULT_MAIN_TAB_PREFERENCES,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) =>
        setPreferences(
          normalizeMainTabPreferences(raw ? JSON.parse(raw) : undefined),
        ),
      )
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready)
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, ready]);

  const value = useMemo(
    () => ({
      ready,
      ...preferences,
      setTabVisible: (id: MainTabId, visible: boolean) => {
        if (MAIN_TABS.find((tab) => tab.id === id)?.required) return;
        setPreferences((current) => ({
          ...current,
          visibility: { ...current.visibility, [id]: visible },
        }));
      },
      moveTab: (id: MainTabId, destination: number) =>
        setPreferences((current) => {
          const from = current.order.indexOf(id);
          if (from === -1) return current;
          const order = current.order.filter((tabId) => tabId !== id);
          order.splice(Math.max(0, Math.min(order.length, destination)), 0, id);
          return { ...current, order };
        }),
      setTabCompact: (compact: boolean) =>
        setPreferences((current) => ({ ...current, compact })),
      resetTabs: () => setPreferences(DEFAULT_MAIN_TAB_PREFERENCES),
    }),
    [preferences, ready],
  );

  return createElement(Context.Provider, { value }, children);
}

export function useMainTabPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("MainTabPreferencesProvider missing");
  return value;
}
