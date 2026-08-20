import { describe, expect, it } from "vitest";
import { analyzeHeartRate, estimateMaximumHeartRate, getActualHeartRateZoneColor } from "../lib/heart-rate-analysis";

describe("анализ зон пульса", () => {
  it("использует оценку Tanaka и распределяет наблюдаемые интервалы по зонам", () => {
    expect(estimateMaximumHeartRate(40)).toBe(180);
    const analysis = analyzeHeartRate([
      { time: "2026-08-20T10:00:00.000Z", beatsPerMinute: 100 },
      { time: "2026-08-20T10:00:30.000Z", beatsPerMinute: 135 },
      { time: "2026-08-20T10:01:00.000Z", beatsPerMinute: 160 },
    ], 40, "2026-08-20T10:01:30.000Z");

    expect(analysis.estimatedMaxBpm).toBe(180);
    expect(analysis.coveredSeconds).toBe(90);
    expect(analysis.zones.find((zone) => zone.id === "recovery")?.seconds).toBe(30);
    expect(analysis.zones.find((zone) => zone.id === "aerobic")?.seconds).toBe(30);
    expect(analysis.zones.find((zone) => zone.id === "threshold")?.seconds).toBe(30);
  });

  it("не создаёт зоны, пока возраст профиля не задан", () => {
    expect(analyzeHeartRate([{ time: "2026-08-20T10:00:00.000Z", beatsPerMinute: 140 }]).coveredSeconds).toBe(0);
  });

  it("не приписывает часам длинные пропуски синхронизации", () => {
    const analysis = analyzeHeartRate([
      { time: "2026-08-20T10:00:00.000Z", beatsPerMinute: 125 },
      { time: "2026-08-20T10:10:00.000Z", beatsPerMinute: 130 },
    ], 30, "2026-08-20T10:20:00.000Z");
    expect(analysis.coveredSeconds).toBe(180);
  });

  it("выбирает цвет фактической зоны ЧСС и не раскрывает отсутствующие данные", () => {
    expect(getActualHeartRateZoneColor(90, 40)).toBe("#8090A8");
    expect(getActualHeartRateZoneColor(115, 40)).toBe("#3E85D8");
    expect(getActualHeartRateZoneColor(135, 40)).toBe("#37A67A");
    expect(getActualHeartRateZoneColor(160, 40)).toBe("#E4A11B");
    expect(getActualHeartRateZoneColor(170, 40)).toBe("#D94343");
    expect(getActualHeartRateZoneColor(130)).toBeUndefined();
    expect(getActualHeartRateZoneColor(undefined, 40)).toBeUndefined();
  });
});
