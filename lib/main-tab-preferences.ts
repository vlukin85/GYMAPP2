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
    titleKey: "common.tab.today.title",
    settingsTitle: "Главное",
    settingsTitleKey: "common.tab.today.settingsTitle",
    description: "Экран на сегодня и виджеты",
    descriptionKey: "common.tab.today.description",
    required: true,
  },
  {
    id: "calendar",
    route: "/(tabs)/calendar",
    title: "ПЛАН",
    titleKey: "common.tab.calendar.title",
    settingsTitle: "План",
    settingsTitleKey: "common.tab.calendar.settingsTitle",
    description: "Календарь и расписание тренировок",
    descriptionKey: "common.tab.calendar.description",
    required: true,
  },
  {
    id: "exercises",
    route: "/(tabs)/exercises",
    title: "УПРАЖНЕНИЯ",
    titleKey: "common.tab.exercises.title",
    settingsTitle: "Упражнения",
    settingsTitleKey: "common.tab.exercises.settingsTitle",
    description: "Каталог и техника выполнения",
    descriptionKey: "common.tab.exercises.description",
    required: false,
  },
  {
    id: "programs",
    route: "/(tabs)/programs",
    title: "ПРОГРАММЫ",
    titleKey: "common.tab.programs.title",
    settingsTitle: "Программы",
    settingsTitleKey: "common.tab.programs.settingsTitle",
    description: "Сохранённые планы тренировок",
    descriptionKey: "common.tab.programs.description",
    required: false,
  },
  {
    id: "nutrition",
    route: "/(tabs)/nutrition",
    title: "ПИТАНИЕ",
    titleKey: "common.tab.nutrition.title",
    settingsTitle: "Питание",
    settingsTitleKey: "common.tab.nutrition.settingsTitle",
    description: "Дневник калорий и БЖУ",
    descriptionKey: "common.tab.nutrition.description",
    required: false,
  },
  {
    id: "stats",
    route: "/(tabs)/stats",
    title: "ПРОГРЕСС",
    titleKey: "common.tab.stats.title",
    settingsTitle: "Прогресс",
    settingsTitleKey: "common.tab.stats.settingsTitle",
    description: "Статистика и личные рекорды",
    descriptionKey: "common.tab.stats.description",
    required: false,
  },
  {
    id: "body",
    route: "/(tabs)/body",
    title: "ТЕЛО",
    titleKey: "common.tab.body.title",
    settingsTitle: "Тело",
    settingsTitleKey: "common.tab.body.settingsTitle",
    description: "Замеры, цели и динамика",
    descriptionKey: "common.tab.body.description",
    required: false,
  },
  {
    id: "settings",
    route: "/(tabs)/settings",
    title: "НАСТРОЙКИ",
    titleKey: "common.tab.settings.title",
    settingsTitle: "Настройки",
    settingsTitleKey: "common.tab.settings.settingsTitle",
    description: "Параметры IronRise",
    descriptionKey: "common.tab.settings.description",
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
