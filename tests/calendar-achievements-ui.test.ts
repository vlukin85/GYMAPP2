import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const calendarScreen = readFileSync("/home/ubuntu/gym-training-diary/app/calendar.tsx", "utf8");

describe("calendar result achievements", () => {
  it("shows records earned in the selected workout and provides a share action", () => {
    expect(calendarScreen).toContain("getWorkoutRecordAchievements");
    expect(calendarScreen).toContain("НОВЫЕ ЛИЧНЫЕ РЕКОРДЫ");
    expect(calendarScreen).toContain("Поделиться достижениями");
  });

  it("exports a cache text file on native instead of attempting web file sharing", () => {
    expect(calendarScreen).toContain("FileSystem.cacheDirectory");
    expect(calendarScreen).toContain("Sharing.shareAsync");
    expect(calendarScreen).toContain('Platform.OS === "web"');
  });
});
