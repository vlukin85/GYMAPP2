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
    expect(settings).toContain("connectHealthConnectHeartRate");
  });
});
