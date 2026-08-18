import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const calendarScreen = readFileSync("/home/ubuntu/gym-training-diary/app/(tabs)/calendar.tsx", "utf8");

describe("calendar result achievements", () => {
  it("shows records earned in the selected workout and provides a share action", () => {
    expect(calendarScreen).toContain("getWorkoutRecordAchievements");
    expect(calendarScreen).toContain("НОВЫЕ ЛИЧНЫЕ РЕКОРДЫ");
    expect(calendarScreen).toContain("Поделиться достижениями");
  });

  it("offers PNG-card capture and platform share actions", () => {
    expect(calendarScreen).toContain("WorkoutShareCard");
    expect(calendarScreen).toContain("formatWorkoutSocialTemplate");
    expect(calendarScreen).toContain("shareVisualCard");
    expect(calendarScreen).toContain("shareTheme");
    expect(calendarScreen).toContain("Тёмная");
    expect(calendarScreen).toContain("Светлая");
    expect(calendarScreen).toContain("Sharing.shareAsync");
    expect(calendarScreen).toContain('mimeType: "image/png"');
    expect(calendarScreen).toContain("Share.share");
    expect(calendarScreen).toContain('Platform.OS === "web"');
  });
});
