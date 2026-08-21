import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { getDailyAthleteQuote } from "../lib/daily-athlete-quote";
import { DEFAULT_LAUNCH_SPLASH_DURATION_MS } from "../lib/launch-splash-settings";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const notifications = readFileSync(
  resolve(process.cwd(), "lib/workout-notifications.ts"),
  "utf8",
);
const rootLayout = readFileSync(
  resolve(process.cwd(), "app/_layout.tsx"),
  "utf8",
);
const home = readFileSync(
  resolve(process.cwd(), "app/(tabs)/index.tsx"),
  "utf8",
);

describe("rest feedback, launch screen and daily quote", () => {
  it("keeps the same verified quote for a given local calendar day and rotates later", () => {
    const first = getDailyAthleteQuote(new Date(2026, 7, 20));
    expect(getDailyAthleteQuote(new Date(2026, 7, 20))).toEqual(first);
    expect(getDailyAthleteQuote(new Date(2026, 7, 21))).not.toEqual(first);
    expect(first.athlete.length).toBeGreaterThan(0);
  });

  it("uses Android-specific haptics and a rest notification lifecycle", () => {
    expect(workout).toContain(
      "performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)",
    );
    expect(workout).toContain("showRestLockScreenNotification");
    expect(workout).toContain("clearRestLockScreenNotification");
    expect(notifications).toContain("scheduleRestTimerLockScreenNotification");
    expect(notifications).toContain("Отдых завершён");
  });

  it("uses the configurable startup visual duration and renders the quote card", () => {
    expect(DEFAULT_LAUNCH_SPLASH_DURATION_MS).toBe(1500);
    expect(rootLayout).toContain("loadLaunchSplashDuration");
    expect(rootLayout).toContain('Platform.OS === "web"');
    expect(rootLayout).toContain("}, launchSplashDuration)");
    expect(rootLayout).toContain("IronRiseLaunchSplash");
    expect(rootLayout).not.toContain("preventAutoHideAsync");
    expect(home).toContain("ЦИТАТА ДНЯ");
    expect(home).toContain("getDailyAthleteQuote");
  });
});
