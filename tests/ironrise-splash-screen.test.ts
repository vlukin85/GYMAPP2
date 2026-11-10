import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const rootLayout = readFileSync(
  resolve(process.cwd(), "app/_layout.tsx"),
  "utf8",
);
// Русские подписи экрана настроек живут в словаре домена settings.
const settings =
  readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8") +
  readFileSync(resolve(process.cwd(), "lib/i18n/domains/settings.ts"), "utf8");

describe("native launch splash", () => {
  it("configures one square system splash icon per system theme", () => {
    // Android 12+ показывает image как иконку в круге: полнокадровый арт
    // там обрезается до квадрата, поэтому image — квадратный щит по теме.
    expect(appConfig).toContain('resizeMode: "contain"');
    expect(appConfig).not.toContain('resizeMode: "cover"');
    expect(appConfig).toContain(
      'image: "./assets/images/splash-icon-android12-light.png"',
    );
    expect(appConfig).toMatch(
      /dark:\s*\{\s*image:\s*"\.\/assets\/images\/splash-icon-android12\.png",\s*backgroundColor:\s*"#0B0F0D",?\s*\}/,
    );
    expect(appConfig).toContain('iconBackground: "#0D0F14"');
  });

  it("keeps the full-frame splash art out of the config and the bundle", () => {
    // Полнокадровый арт заставки больше не используется ни в конфиге,
    // ни в активах: остался только квадратный системный щит Android 12+.
    expect(appConfig).not.toContain("splash-full-");
    expect(
      existsSync(resolve(process.cwd(), "assets/images/splash-full-dark.png")),
    ).toBe(false);
    expect(
      existsSync(resolve(process.cwd(), "assets/images/splash-full-light.png")),
    ).toBe(false);
    expect(
      existsSync(
        resolve(process.cwd(), "assets/images/splash-icon-android12.png"),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(process.cwd(), "assets/images/splash-icon-android12-light.png"),
      ),
    ).toBe(true);
  });

  it("does not mount a second custom splash layer", () => {
    expect(rootLayout).not.toContain("IronRiseLaunchSplash");
    expect(rootLayout).not.toContain("showLaunchSplash");
    expect(rootLayout).not.toContain("launchSplashDuration");
    expect(rootLayout).not.toContain("loadLaunchSplashDuration");
    // Оверлей гидрации удалён вместе с компонентом: стартового экрана
    // поверх приложения больше нет.
    expect(rootLayout).not.toContain("HydrationGate");
    expect(
      existsSync(resolve(process.cwd(), "components/hydration-gate.tsx")),
    ).toBe(false);
  });

  it("mounts the language provider around the screen tree", () => {
    expect(rootLayout).toContain("LanguageProvider");
    expect(rootLayout).toMatch(
      /<LanguageProvider>[\s\S]*?<\/LanguageProvider>/,
    );
  });

  it("does not expose a stale second-splash duration setting", () => {
    expect(settings).not.toContain("Длительность заставки");
    expect(settings).not.toContain("LAUNCH_SPLASH_DURATION_OPTIONS");
    expect(settings).not.toContain("saveLaunchSplashDuration");
  });
});
