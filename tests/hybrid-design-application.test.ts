import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const theme = readFileSync(resolve(process.cwd(), "lib/app-color-themes.ts"), "utf8");
const themeProvider = readFileSync(resolve(process.cwd(), "lib/theme-provider.tsx"), "utf8");
const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const tabLayout = readFileSync(resolve(process.cwd(), "app/(tabs)/_layout.tsx"), "utf8");

describe("IronRise editorial reference design", () => {
  it("makes the poster-style editorial palette the default selectable theme", () => {
    expect(theme).toContain('id: "editorial"');
    expect(theme).toContain('DEFAULT_APP_THEME_ID: AppThemeId = "editorial"');
    expect(themeProvider).toContain('APP_THEME_STORAGE_KEY = "gym-diary-app-theme-v4"');
  });

  it("uses an editorial day, plan, weekly strip and volume layout on the home screen", () => {
    expect(home).toContain('const REFERENCE_BLUE = "#1746D2"');
    expect(home).toContain("heroGrid");
    expect(home).toContain("planPanel");
    expect(home).toContain("weekStrip");
    expect(home).toContain("analytics");
  });

  it("uses compact text-led section names in the redesigned bottom navigation", () => {
    expect(tabLayout).toContain('title: "СЕГОДНЯ"');
    expect(tabLayout).toContain('title: "ПЛАН"');
    expect(tabLayout).toContain('title: "ПРОГРЕСС"');
  });
});
