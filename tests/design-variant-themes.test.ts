import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_COLOR_THEMES, getAppTheme, isAppThemeId } from "../lib/app-color-themes";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const PALETTE_KEYS = [
  "primary",
  "background",
  "surface",
  "foreground",
  "muted",
  "border",
  "success",
  "warning",
  "error",
] as const;

// Русские подписи экрана настроек живут в словаре домена settings,
// поэтому экран проверяется вместе со своим словарём локализации.
const settings =
  readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8") +
  readFileSync(
    resolve(process.cwd(), "lib/i18n/domains/settings.ts"),
    "utf8",
  );

const DESIGN_VARIANTS = [
  {
    id: "dark-energy",
    title: "Тёмный атлет",
    dark: true,
    swatch: "#C8F169",
  },
  {
    id: "light-minimal",
    title: "Светлый минимализм",
    dark: false,
    swatch: "#0F7B5A",
  },
  {
    id: "bold-neon",
    title: "Bold Neon",
    dark: true,
    swatch: "#7C3AED",
  },
] as const;

describe("design variant themes", () => {
  it("adds the three prototype design variants to the selectable themes", () => {
    for (const variant of DESIGN_VARIANTS) {
      expect(isAppThemeId(variant.id)).toBe(true);
      const theme = getAppTheme(variant.id);
      expect(theme.title).toBe(variant.title);
      expect(theme.dark).toBe(variant.dark);
      expect(theme.swatch).toBe(variant.swatch);
      expect(theme.palette.primary).toBe(variant.swatch);
    }
  });

  it("provides a complete valid nine-color palette for each design variant", () => {
    for (const variant of DESIGN_VARIANTS) {
      const theme = getAppTheme(variant.id);
      for (const key of PALETTE_KEYS) {
        expect(HEX_COLOR.test(theme.palette[key]), `${variant.id}.${key}`).toBe(
          true,
        );
      }
    }
  });

  it("keeps the design variants appended after the base product themes", () => {
    const ids = APP_COLOR_THEMES.map((theme) => theme.id);
    expect(ids.slice(-3)).toEqual(["dark-energy", "light-minimal", "bold-neon"]);
    for (const base of ["editorial", "midnight"]) {
      expect(ids).toContain(base);
    }
  });

  it("exposes the design variants in the appearance settings screen", () => {
    expect(settings).toContain("Варианты дизайна");
    expect(settings).toContain("designVariantChoices");
    expect(settings).toContain("dark-energy");
    expect(settings).toContain("light-minimal");
    expect(settings).toContain("bold-neon");
    expect(settings).toContain("setAppThemeId");
  });
});
