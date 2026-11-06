/**
 * Дизайн-токены IronRise — эталон «Тёмный атлет / Dark Energy».
 * Единый источник визуального языка: радиусы, тени, типографика, отступы.
 * Цвета остаются в lib/app-color-themes.ts (темы), здесь — только форма и метрики.
 */
import { Platform } from "react-native";

export const radius = {
  card: 20,
  tile: 16,
  button: 16,
  input: 14,
  chip: 999,
  sheet: 28,
} as const;

/** Мягкая карта и «парящая» поверхность. На Android — элевация, на остальных — тени. */
export const shadows = {
  card: Platform.select({
    android: { elevation: 2 },
    default: { shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  }) as object,
  raised: Platform.select({
    android: { elevation: 6 },
    default: { shadowColor: "#000000", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  }) as object,
} as const;

export const type = {
  display: { fontSize: 30, fontWeight: "900" as const, letterSpacing: -1.2 },
  title: { fontSize: 22, fontWeight: "900" as const, letterSpacing: -0.4 },
  heading: { fontSize: 17, fontWeight: "800" as const, letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  meta: { fontSize: 12, fontWeight: "600" as const },
  metric: { fontSize: 26, fontWeight: "900" as const, fontVariant: ["tabular-nums"] as const },
  eyebrow: { fontSize: 11, fontWeight: "900" as const, letterSpacing: 1.2, textTransform: "uppercase" as const },
} as const;

export const spacing = (scale = 1) => ({
  xs: 4 * scale,
  sm: 8 * scale,
  md: 12 * scale,
  lg: 16 * scale,
  xl: 24 * scale,
  xxl: 32 * scale,
});

/** Стандартная тактильная реакция нажатия для Pressable. */
export const pressedOpacity = 0.82;

/** Минимальная высота интерактивного элемента по доступности. */
export const minTouchTarget = 44;
