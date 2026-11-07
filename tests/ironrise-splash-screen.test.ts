import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const rootLayout = readFileSync(
  resolve(process.cwd(), "app/_layout.tsx"),
  "utf8",
);
const hydrationGate = readFileSync(
  resolve(process.cwd(), "components/hydration-gate.tsx"),
  "utf8",
);
const settings = readFileSync(
  resolve(process.cwd(), "app/settings.tsx"),
  "utf8",
);

describe("native launch splash", () => {
  it("configures one full-screen Expo splash with the bundled app mark", () => {
    // contain: логотип виден целиком, без обрезки портретного арта.
    expect(appConfig).toContain('resizeMode: "contain"');
    expect(appConfig).not.toContain('resizeMode: "cover"');
    expect(appConfig).toContain("imageWidth: 1024");
    // Android 12+ обрезает иконку в круг: используем квадратную версию с полями.
    expect(appConfig).toContain(
      'icon: "./assets/images/splash-icon-android12.png"',
    );
    expect(appConfig).toContain('iconBackground: "#0D0F14"');
  });

  it("uses the light splash art on the light background by default", () => {
    // Светлая тема (базовые пропсы плагина): светлый фон и светлый вариант арта.
    expect(appConfig).toContain(
      'image: "./assets/images/splash-icon-light.png"',
    );
    expect(appConfig).toContain('backgroundColor: "#F7F7F5"');
  });

  it("keeps the original dark art and background for the dark system theme", () => {
    // Тёмная тема: блок dark плагина expo-splash-screen (SDK 54).
    expect(appConfig).toMatch(
      /dark:\s*\{\s*image:\s*"\.\/assets\/images\/splash-icon\.png",\s*backgroundColor:\s*"#0D0F14",?\s*\}/,
    );
  });

  it("does not mount a second custom splash layer", () => {
    expect(rootLayout).not.toContain("IronRiseLaunchSplash");
    expect(rootLayout).not.toContain("showLaunchSplash");
    expect(rootLayout).not.toContain("launchSplashDuration");
    expect(rootLayout).not.toContain("loadLaunchSplashDuration");
  });

  it("shows a hydration indicator over the root layout while stores hydrate", () => {
    expect(rootLayout).toContain("HydrationGate");
    expect(hydrationGate).toContain("ActivityIndicator");
    expect(hydrationGate).toContain("#C8F169");
    expect(hydrationGate).toContain("#0B0F0D");
    expect(hydrationGate).toContain("IRONRISE");
    // Гидрация не может удерживать оверлей дольше 2,5 с.
    expect(hydrationGate).toContain("HYDRATION_TIMEOUT_MS = 2500");
    // Оверлей читает факт гидрации основных хранилищ.
    expect(hydrationGate).toContain("useWorkoutStore");
    expect(hydrationGate).toContain("useNutritionStore");
    expect(hydrationGate).toContain("useBodyStore");
    expect(hydrationGate).toContain("recordLaunchDiagnostic");
  });

  it("does not expose a stale second-splash duration setting", () => {
    expect(settings).not.toContain("Длительность заставки");
    expect(settings).not.toContain("LAUNCH_SPLASH_DURATION_OPTIONS");
    expect(settings).not.toContain("saveLaunchSplashDuration");
  });
});
