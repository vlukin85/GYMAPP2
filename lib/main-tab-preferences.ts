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

const STORAGE_KEY = "ironrise.main-tab-visibility.v1";

export function normalizeMainTabVisibility(raw: unknown): MainTabVisibility {
  const saved =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return MAIN_TABS.reduce<MainTabVisibility>(
    (visibility, tab) => {
      visibility[tab.id] = tab.required
        ? true
        : typeof saved[tab.id] === "boolean"
          ? (saved[tab.id] as boolean)
          : DEFAULT_MAIN_TAB_VISIBILITY[tab.id];
      return visibility;
    },
    { ...DEFAULT_MAIN_TAB_VISIBILITY },
  );
}

type MainTabPreferencesContextValue = {
  ready: boolean;
  visibility: MainTabVisibility;
  setTabVisible: (id: MainTabId, visible: boolean) => void;
  resetTabs: () => void;
};

const Context = createContext<MainTabPreferencesContextValue | null>(null);

export function MainTabPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visibility, setVisibility] = useState<MainTabVisibility>(
    DEFAULT_MAIN_TAB_VISIBILITY,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) =>
        setVisibility(
          normalizeMainTabVisibility(raw ? JSON.parse(raw) : undefined),
        ),
      )
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready)
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  }, [ready, visibility]);

  const value = useMemo(
    () => ({
      ready,
      visibility,
      setTabVisible: (id: MainTabId, visible: boolean) => {
        if (MAIN_TABS.find((tab) => tab.id === id)?.required) return;
        setVisibility((current) => ({ ...current, [id]: visible }));
      },
      resetTabs: () => setVisibility(DEFAULT_MAIN_TAB_VISIBILITY),
    }),
    [ready, visibility],
  );

  return createElement(Context.Provider, { value }, children);
}

export function useMainTabPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("MainTabPreferencesProvider missing");
  return value;
}
