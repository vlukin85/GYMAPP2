import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import type { ColorScheme } from "@/constants/theme";
import { DEFAULT_APP_THEME_ID, getAppTheme, isAppThemeId, type AppThemeId, type AppThemePalette } from "@/lib/app-color-themes";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  themeId: AppThemeId;
  setThemeId: (id: AppThemeId) => void;
  palette: AppThemePalette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const APP_THEME_STORAGE_KEY = "gym-diary-app-theme-v3";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<AppThemeId>(DEFAULT_APP_THEME_ID);
  const theme = getAppTheme(themeId);
  const colorScheme: ColorScheme = theme.dark ? "dark" : "light";

  const applyTheme = useCallback((id: AppThemeId) => {
    const nextTheme = getAppTheme(id);
    const scheme: ColorScheme = nextTheme.dark ? "dark" : "light";
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      Object.entries(nextTheme.palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setThemeIdState(scheme === "dark" ? "midnight" : DEFAULT_APP_THEME_ID);
  }, []);
  const setThemeId = useCallback((id: AppThemeId) => setThemeIdState(id), []);

  useEffect(() => {
    applyTheme(themeId);
    void AsyncStorage.setItem(APP_THEME_STORAGE_KEY, themeId);
  }, [applyTheme, themeId]);
  useEffect(() => { void AsyncStorage.getItem(APP_THEME_STORAGE_KEY).then((stored) => { if (isAppThemeId(stored)) setThemeIdState(stored); }); }, []);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": theme.palette.primary,
        "color-background": theme.palette.background,
        "color-surface": theme.palette.surface,
        "color-foreground": theme.palette.foreground,
        "color-muted": theme.palette.muted,
        "color-border": theme.palette.border,
        "color-success": theme.palette.success,
        "color-warning": theme.palette.warning,
        "color-error": theme.palette.error,
      }),
    [theme.palette],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      themeId,
      setThemeId,
      palette: theme.palette,
    }),
    [colorScheme, setColorScheme, setThemeId, theme.palette, themeId],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
