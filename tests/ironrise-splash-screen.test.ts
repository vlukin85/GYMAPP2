import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const rootLayout = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");
const launchSplash = readFileSync(resolve(process.cwd(), "components/ironrise-launch-splash.tsx"), "utf8");

describe("native launch splash", () => {
  it("configures Expo native splash with the bundled IronRise icon", () => {
    expect(appConfig).toContain('"expo-splash-screen"');
    expect(appConfig).toContain('image: "./assets/images/splash-icon.png"');
    expect(appConfig).toContain("backgroundColor");
  });

  it("keeps the native splash until the local branded launch screen is ready", () => {
    expect(rootLayout).toContain("SplashScreen.preventAutoHideAsync()");
    expect(rootLayout).toContain("nativeSplashTimer");
    expect(rootLayout).toContain("SplashScreen.hideAsync()");
    expect(rootLayout).toContain("launchSplashTimer");
    expect(launchSplash).toContain('require("@/assets/images/splash-icon.png")');
    expect(launchSplash).not.toContain("files.manuscdn.com");
  });
});
