import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const rootLayout = readFileSync(
  resolve(process.cwd(), "app/_layout.tsx"),
  "utf8",
);
const launchSplash = readFileSync(
  resolve(process.cwd(), "components/ironrise-launch-splash.tsx"),
  "utf8",
);
const settings = readFileSync(
  resolve(process.cwd(), "app/settings.tsx"),
  "utf8",
);

describe("native launch splash", () => {
  it("configures Expo native splash with the bundled IronRise icon", () => {
    expect(appConfig).toContain('"expo-splash-screen"');
    expect(appConfig).toContain('image: "./assets/images/splash-icon.png"');
    expect(appConfig).toContain("backgroundColor");
  });

  it("lets Android auto-hide the native splash and keeps the branded screen as a web-only visual", () => {
    expect(rootLayout).not.toContain("preventAutoHideAsync");
    expect(rootLayout).toContain('Platform.OS === "web",');
    expect(rootLayout).toContain('if (Platform.OS !== "web") return;');
    expect(rootLayout).toContain("launchSplashTimer");
    expect(rootLayout).toContain("launchSplashDuration");
    expect(launchSplash).toContain(
      'require("@/assets/images/splash-icon.png")',
    );
    expect(launchSplash).not.toContain("files.manuscdn.com");
  });

  it("сохраняет выбранную длительность фирменной заставки в настройках", () => {
    expect(settings).toContain("Длительность заставки");
    expect(settings).toContain("LAUNCH_SPLASH_DURATION_OPTIONS");
    expect(settings).toContain("saveLaunchSplashDuration");
  });
});
