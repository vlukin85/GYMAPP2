import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const rootLayout = readFileSync(
  resolve(process.cwd(), "app/_layout.tsx"),
  "utf8",
);
const settings = readFileSync(
  resolve(process.cwd(), "app/settings.tsx"),
  "utf8",
);

describe("native launch splash", () => {
  it("configures one full-screen Expo splash with the bundled app mark", () => {
    expect(appConfig).toContain('image: "./assets/images/splash-icon.png"');
    expect(appConfig).toContain('resizeMode: "cover"');
    expect(appConfig).toContain('backgroundColor: "#0D0F14"');
    expect(appConfig).toContain('imageWidth: 1024');
  });

  it("does not mount a second custom splash layer", () => {
    expect(rootLayout).not.toContain("IronRiseLaunchSplash");
    expect(rootLayout).not.toContain("showLaunchSplash");
    expect(rootLayout).not.toContain("launchSplashDuration");
    expect(rootLayout).not.toContain("loadLaunchSplashDuration");
  });

  it("does not expose a stale second-splash duration setting", () => {
    expect(settings).not.toContain("Длительность заставки");
    expect(settings).not.toContain("LAUNCH_SPLASH_DURATION_OPTIONS");
    expect(settings).not.toContain("saveLaunchSplashDuration");
  });
});
