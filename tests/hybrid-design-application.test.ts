import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const theme = readFileSync(
  resolve(process.cwd(), "lib/app-color-themes.ts"),
  "utf8",
);
const themeProvider = readFileSync(
  resolve(process.cwd(), "lib/theme-provider.tsx"),
  "utf8",
);
const home = readFileSync(
  resolve(process.cwd(), "app/(tabs)/index.tsx"),
  "utf8",
);
const tabLayout = readFileSync(
  resolve(process.cwd(), "app/(tabs)/_layout.tsx"),
  "utf8",
);
const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const programs = readFileSync(
  resolve(process.cwd(), "app/(tabs)/programs.tsx"),
  "utf8",
);
const stats = readFileSync(
  resolve(process.cwd(), "app/(tabs)/stats.tsx"),
  "utf8",
);
const settings = readFileSync(
  resolve(process.cwd(), "app/settings.tsx"),
  "utf8",
);

describe("IronRise editorial reference design", () => {
  it("keeps the legacy poster palette selectable and defaults to Dark Energy", () => {
    expect(theme).toContain('id: "editorial"');
    expect(theme).toContain('DEFAULT_APP_THEME_ID: AppThemeId = "dark-energy"');
    expect(themeProvider).toContain(
      'APP_THEME_STORAGE_KEY = "gym-diary-app-theme-v4"',
    );
  });

  it("uses the Dark Energy hero, week card and quote on the home screen", () => {
    expect(home).toContain("heroEyebrow: { ...typeTokens.eyebrow }");
    expect(home).toContain("weekCard");
    expect(home).toContain("quoteCard");
    expect(home).toContain("Начать тренировку");
  });

  it("uses compact text-led section names in the redesigned bottom navigation", () => {
    expect(tabLayout).toContain('title: "ГЛАВНОЕ"');
    expect(tabLayout).toContain('title: "ПЛАН"');
    expect(tabLayout).toContain('title: "ПРОГРЕСС"');
  });

  it("extends the Dark Energy tokens to workout, programs and statistics", () => {
    expect(workout).toContain("design-tokens");
    expect(workout).toContain("radius.card");
    expect(workout).toContain("radius.tile");
    expect(workout).not.toContain('const EDITORIAL_BLUE = "#1746D2"');
    expect(programs).toContain("design-tokens");
    expect(stats).toContain("design-tokens");
  });

  it("provides an explicit light and dark mode selector in settings", () => {
    expect(settings).toContain(
      "const themeModeChoices = APP_COLOR_THEMES.filter",
    );
    expect(settings).toContain(
      'theme.id === "editorial" || theme.id === "midnight"',
    );
    expect(settings).toContain("Светлая или тёмная тема");
    expect(settings).toContain("СВЕТЛАЯ");
    expect(settings).toContain("ТЁМНАЯ");
    expect(themeProvider).toContain("APP_THEME_STORAGE_KEY");
  });
});
