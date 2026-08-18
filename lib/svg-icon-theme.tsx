import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "ironrise.svg-icon-theme.v1";

export const SVG_ICON_THEMES = [
  { id: "violet", title: "Фиолетовый", color: "#7C3AED", description: "Фирменный IronRise" },
  { id: "rose", title: "Розовый", color: "#E11D72", description: "Энергичный акцент" },
  { id: "ocean", title: "Океан", color: "#0284C7", description: "Чистый контраст" },
  { id: "lime", title: "Лайм", color: "#16A34A", description: "Спортивный импульс" },
] as const;

export type SvgIconThemeId = (typeof SVG_ICON_THEMES)[number]["id"];
export type SvgIconTheme = (typeof SVG_ICON_THEMES)[number];

export const DEFAULT_SVG_ICON_THEME_ID: SvgIconThemeId = "violet";

export function normalizeSvgIconTheme(value: unknown): SvgIconThemeId {
  return SVG_ICON_THEMES.some((theme) => theme.id === value) ? value as SvgIconThemeId : DEFAULT_SVG_ICON_THEME_ID;
}

export function getSvgIconTheme(id: SvgIconThemeId): SvgIconTheme {
  return SVG_ICON_THEMES.find((theme) => theme.id === id) ?? SVG_ICON_THEMES[0];
}

type SvgIconThemeContextValue = {
  theme: SvgIconTheme;
  setThemeId: (id: SvgIconThemeId) => void;
};

const SvgIconThemeContext = createContext<SvgIconThemeContextValue | null>(null);

export function SvgIconThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<SvgIconThemeId>(DEFAULT_SVG_ICON_THEME_ID);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setThemeIdState(normalizeSvgIconTheme(value)))
      .catch(() => undefined);
  }, []);

  const value = useMemo<SvgIconThemeContextValue>(() => ({
    theme: getSvgIconTheme(themeId),
    setThemeId: (nextThemeId) => {
      const normalized = normalizeSvgIconTheme(nextThemeId);
      setThemeIdState(normalized);
      void AsyncStorage.setItem(STORAGE_KEY, normalized).catch(() => undefined);
    },
  }), [themeId]);

  return <SvgIconThemeContext.Provider value={value}>{children}</SvgIconThemeContext.Provider>;
}

export function useSvgIconTheme() {
  const context = useContext(SvgIconThemeContext);
  if (!context) {
    return {
      theme: getSvgIconTheme(DEFAULT_SVG_ICON_THEME_ID),
      setThemeId: () => undefined,
    } satisfies SvgIconThemeContextValue;
  }
  return context;
}
