import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const theme = readFileSync(resolve(process.cwd(), "lib/app-color-themes.ts"), "utf8");
const themeProvider = readFileSync(resolve(process.cwd(), "lib/theme-provider.tsx"), "utf8");
const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const programs = readFileSync(resolve(process.cwd(), "app/(tabs)/programs.tsx"), "utf8");
const stats = readFileSync(resolve(process.cwd(), "app/(tabs)/stats.tsx"), "utf8");
const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const progressOverview = readFileSync(resolve(process.cwd(), "components/progress-overview.tsx"), "utf8");

describe("hybrid Training Ledger design", () => {
  it("makes Training Ledger the default selectable app palette", () => {
    expect(theme).toContain('id: "orchid"');
    expect(theme).toContain('DEFAULT_APP_THEME_ID: AppThemeId = "orchid"');
    expect(themeProvider).toContain('APP_THEME_STORAGE_KEY = "gym-diary-app-theme-v3"');
  });

  it("applies ledger structure and Swiss accents to home, programs and statistics", () => {
    expect(home).toContain('shadowColor: "#7C3AED"');
    expect(home).toContain('borderRadius: 26');
    expect(programs).toContain("borderRadius: 22");
    expect(stats).toContain("borderLeftColor: iconColor");
    expect(progressOverview).toContain("borderRadius: 16");
  });

  it("uses Orchid Voltage pink and violet accents in workout progress and rest", () => {
    expect(workout).toContain('"#F5A1FF"');
    expect(workout).toContain('"#9A5CFF"');
    expect(workout).toContain('backgroundColor: "#351C55"');
  });
});
