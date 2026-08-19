export type AppThemeId = "editorial" | "orchid" | "violet" | "rose" | "ocean" | "forest" | "sunset" | "midnight";

export type AppThemePalette = {
  primary: string; background: string; surface: string; foreground: string; muted: string; border: string; success: string; warning: string; error: string;
  text: string; tint: string; icon: string; tabIconDefault: string; tabIconSelected: string;
};

type AppThemeDefinition = { id: AppThemeId; title: string; hint: string; swatch: string; dark: boolean; palette: AppThemePalette };

const palette = (tokens: Omit<AppThemePalette, "text" | "tint" | "icon" | "tabIconDefault" | "tabIconSelected">): AppThemePalette => ({
  ...tokens, text: tokens.foreground, tint: tokens.primary, icon: tokens.muted, tabIconDefault: tokens.muted, tabIconSelected: tokens.primary,
});

export const APP_COLOR_THEMES: AppThemeDefinition[] = [
  { id: "editorial", title: "IronRise Editorial", hint: "Плакатный кремовый, красный и синий", swatch: "#E72B25", dark: false, palette: palette({ primary: "#E72B25", background: "#F4F0E8", surface: "#FFFDF8", foreground: "#151515", muted: "#706D66", border: "#272624", success: "#5A9A43", warning: "#E0A12A", error: "#C52320" }) },
  { id: "orchid", title: "Orchid Voltage", hint: "Электрический фиолетовый", swatch: "#7C3AED", dark: false, palette: palette({ primary: "#7C3AED", background: "#FBF8FF", surface: "#FFFFFF", foreground: "#211335", muted: "#766B82", border: "#E8DFF3", success: "#16A34A", warning: "#F973D5", error: "#E11D72" }) },
  { id: "violet", title: "Фиолетовый", hint: "Фирменный IronRise", swatch: "#7C3AED", dark: false, palette: palette({ primary: "#7C3AED", background: "#FBF8FF", surface: "#FFFFFF", foreground: "#1E1230", muted: "#766B82", border: "#E8DFF3", success: "#16A34A", warning: "#F97316", error: "#E11D72" }) },
  { id: "rose", title: "Розовый импульс", hint: "Яркий и энергичный", swatch: "#E11D72", dark: false, palette: palette({ primary: "#E11D72", background: "#FFF7FA", surface: "#FFFFFF", foreground: "#35121F", muted: "#8B6874", border: "#F3DCE5", success: "#159B61", warning: "#EA7B20", error: "#C51D5B" }) },
  { id: "ocean", title: "Океан", hint: "Холодный фокус", swatch: "#0284C7", dark: false, palette: palette({ primary: "#0284C7", background: "#F3FAFF", surface: "#FFFFFF", foreground: "#102C3D", muted: "#627D8E", border: "#D8EAF5", success: "#09966A", warning: "#E89520", error: "#D6455D" }) },
  { id: "forest", title: "Лесной ритм", hint: "Спокойная сила", swatch: "#15803D", dark: false, palette: palette({ primary: "#15803D", background: "#F5FBF6", surface: "#FFFFFF", foreground: "#163225", muted: "#617467", border: "#DDEDE1", success: "#168B43", warning: "#D97918", error: "#C7404E" }) },
  { id: "sunset", title: "Закат", hint: "Тёплая энергия", swatch: "#EA580C", dark: false, palette: palette({ primary: "#EA580C", background: "#FFF9F2", surface: "#FFFFFF", foreground: "#3B2412", muted: "#866A52", border: "#F4E1CF", success: "#29935A", warning: "#D77A12", error: "#CD3B59" }) },
  { id: "midnight", title: "Полночь", hint: "Контрастная тёмная", swatch: "#A78BFA", dark: true, palette: palette({ primary: "#A78BFA", background: "#15111F", surface: "#211A2E", foreground: "#F5F1FB", muted: "#B4AABD", border: "#3C314D", success: "#4ADE80", warning: "#FDBA45", error: "#FB7185" }) },
];

export const DEFAULT_APP_THEME_ID: AppThemeId = "editorial";
export const isAppThemeId = (value: unknown): value is AppThemeId => typeof value === "string" && APP_COLOR_THEMES.some((theme) => theme.id === value);
export const getAppTheme = (id: AppThemeId) => APP_COLOR_THEMES.find((theme) => theme.id === id) ?? APP_COLOR_THEMES[0];
