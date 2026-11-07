import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const summary = readFileSync(resolve(process.cwd(), "app/workout-summary.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");

describe("интеграция Health Connect", () => {
  it("включает config plugin и поддерживаемую минимальную версию Android", () => {
    expect(config).toContain('"react-native-health-connect"');
    expect(config).toContain("minSdkVersion: 26");
  });

  it("запрашивает пульс в тренировке, сохраняет его и показывает в итогах", () => {
    expect(workout).toContain("connectHealthConnectHeartRate");
    expect(workout).toContain("averageHeartRateBpm: heartRateSummary.averageBpm");
    expect(workout).toContain("ПУЛЬС · HEALTH CONNECT");
    expect(summary).toContain("Данные часов за время тренировки");
    expect(settings).toContain("Пульс со смарт-часов");
  });

  it("запрашивает активность и пульс всеми четырьмя типами в настройках", () => {
    expect(settings).toContain("connectHealthConnectActivity");
    expect(settings).toContain("Подключить активность и пульс");
    expect(settings).toContain("healthConnectStatus.activityGranted");
  });

  it("показывает карточку активности в редакторе виджетов статистики", () => {
    const stats = readFileSync(resolve(process.cwd(), "app/(tabs)/stats.tsx"), "utf8");
    const activity = readFileSync(resolve(process.cwd(), "lib/health-connect-activity.ts"), "utf8");
    const storage = readFileSync(resolve(process.cwd(), "lib/stats-widgets-storage.ts"), "utf8");
    expect(storage).toContain('"activity"');
    expect(stats).toContain("ActivityTodayCard");
    expect(stats).toContain("readDailyActivity");
    expect(stats).toContain("readActivityWeek");
    expect(stats).toContain("Активность · сегодня");
    expect(stats).toContain("Настроить Health Connect");
    expect(activity).toContain("ACTIVITY_PERMISSIONS");
    expect(activity).toContain("buildActivityWeek");
  });
});
