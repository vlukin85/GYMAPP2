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
    expect(stats).toContain("getActivityToday");
    expect(stats).toContain("getActivityWeek");
    expect(stats).toContain("Активность · сегодня");
    expect(stats).toContain("Настроить Health Connect");
    expect(activity).toContain("ACTIVITY_PERMISSIONS");
    expect(activity).toContain("buildActivityWeek");
  });

  it("подключает Google Fit как основной источник данных", () => {
    expect(config).toContain('"react-native-google-fit"');
    expect(settings).toContain("Google Fit");
    expect(settings).toContain("Подключить Google Fit");
    expect(settings).toContain("Основной источник данных");
    expect(settings).toContain("useHealthSource");
    const provider = readFileSync(resolve(process.cwd(), "lib/activity-provider.ts"), "utf8");
    const stats = readFileSync(resolve(process.cwd(), "app/(tabs)/stats.tsx"), "utf8");
    expect(provider).toContain("Подключите Google Fit в настройках");
    expect(stats).toContain("Подключите Google Fit в настройках");
  });
});
