import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getAdjacentMainTab, getMainTabIdFromPathname } from "../lib/main-tab-navigation";

const tabs = readFileSync("/home/ubuntu/gym-training-diary/app/(tabs)/_layout.tsx", "utf8");
const home = readFileSync("/home/ubuntu/gym-training-diary/app/(tabs)/index.tsx", "utf8");
const swipe = readFileSync("/home/ubuntu/gym-training-diary/components/main-tab-swipe.tsx", "utf8");

describe("main navigation", () => {
  it("places the calendar between today and exercises", () => {
    expect(tabs.indexOf('name="index"')).toBeLessThan(tabs.indexOf('name="calendar"'));
    expect(tabs.indexOf('name="calendar"')).toBeLessThan(tabs.indexOf('name="exercises"'));
  });

  it("removes the repeat-last-workout quick action", () => {
    expect(home).not.toContain("Повторить последнюю тренировку");
    expect(home).not.toContain("repeatLastWorkout");
  });

  it("moves through tabs in the requested order with horizontal swipes", () => {
    expect(getAdjacentMainTab("today", -80)).toBe("/(tabs)/calendar");
    expect(getAdjacentMainTab("calendar", -80)).toBe("/(tabs)/exercises");
    expect(getAdjacentMainTab("stats", 80)).toBe("/(tabs)/nutrition");
    expect(getAdjacentMainTab("nutrition", 80)).toBe("/(tabs)/programs");
    expect(getAdjacentMainTab("stats", -80)).toBe("/(tabs)/settings");
    expect(getAdjacentMainTab("today", 80)).toBeNull();
    expect(getMainTabIdFromPathname("/calendar")).toBe("calendar");
    expect(getMainTabIdFromPathname("/settings")).toBe("settings");
    expect(tabs).toContain('name="settings"');
  });

  it("uses a short animated exit before replacing the adjacent tab route", () => {
    expect(swipe).toContain("withTiming");
    expect(swipe).toContain("Animated.View");
    expect(swipe).toContain("transitionTo");
  });
});
