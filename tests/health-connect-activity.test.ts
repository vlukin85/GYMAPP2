import { describe, expect, it } from "vitest";

import {
  ALL_HEALTH_CONNECT_PERMISSIONS,
  ACTIVITY_PERMISSIONS,
  HEART_RATE_PERMISSION,
  buildActivityWeek,
  energyToKilocalories,
  isValidMetricValue,
  lengthToKilometers,
  localDateKey,
  localDayStartISO,
  shiftDateISO,
  summarizeActivityDay,
  summarizeDailyHeartRate,
  type ActivityRecordInput,
} from "../lib/health-connect-activity";

describe("разрешения Health Connect на активность", () => {
  it("запрашивает чтение шагов, калорий, дистанции и пульса", () => {
    expect(ACTIVITY_PERMISSIONS).toEqual([
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "TotalCaloriesBurned" },
      { accessType: "read", recordType: "Distance" },
    ]);
    expect(HEART_RATE_PERMISSION).toEqual({ accessType: "read", recordType: "HeartRate" });
    expect(ALL_HEALTH_CONNECT_PERMISSIONS).toHaveLength(4);
    expect(ALL_HEALTH_CONNECT_PERMISSIONS.every((permission) => permission.accessType === "read")).toBe(true);
  });
});

describe("валидация значений активности", () => {
  it("принимает только конечные неотрицательные числа", () => {
    expect(isValidMetricValue(0)).toBe(true);
    expect(isValidMetricValue(1250)).toBe(true);
    expect(isValidMetricValue(-1)).toBe(false);
    expect(isValidMetricValue(Number.NaN)).toBe(false);
    expect(isValidMetricValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidMetricValue("7000")).toBe(false);
    expect(isValidMetricValue(undefined)).toBe(false);
  });

  it("переводит единицы калорий в килокалории", () => {
    expect(energyToKilocalories({ value: 320, unit: "kilocalories" })).toBeCloseTo(320);
    expect(energyToKilocalories({ value: 320000, unit: "calories" })).toBeCloseTo(320);
    expect(energyToKilocalories({ value: 1338.88, unit: "kilojoules" })).toBeCloseTo(320, 1);
    expect(energyToKilocalories({ value: -5, unit: "kilocalories" })).toBeNull();
  });

  it("переводит единицы длины в километры", () => {
    expect(lengthToKilometers({ value: 4200, unit: "meters" })).toBeCloseTo(4.2);
    expect(lengthToKilometers({ value: 3.1, unit: "miles" })).toBeCloseTo(4.989, 2);
    expect(lengthToKilometers({ value: -1, unit: "meters" })).toBeNull();
  });
});

describe("сводка активности за день", () => {
  it("суммирует записи по трём типам", () => {
    const records: ActivityRecordInput[] = [
      { recordType: "Steps", startTime: "2026-02-10T08:00:00.000Z", count: 3000 },
      { recordType: "Steps", startTime: "2026-02-10T12:00:00.000Z", count: 1200 },
      { recordType: "TotalCaloriesBurned", startTime: "2026-02-10T08:00:00.000Z", energy: { value: 180, unit: "kilocalories" } },
      { recordType: "TotalCaloriesBurned", startTime: "2026-02-10T13:00:00.000Z", energy: { value: 50000, unit: "calories" } },
      { recordType: "Distance", startTime: "2026-02-10T08:00:00.000Z", distance: { value: 1800, unit: "meters" } },
      { recordType: "Distance", startTime: "2026-02-10T13:00:00.000Z", distance: { value: 1.2, unit: "kilometers" } },
    ];
    expect(summarizeActivityDay(records)).toEqual({ steps: 4200, activeKcal: 230, distanceKm: 3 });
  });

  it("не подменяет отсутствующие данные нулями", () => {
    expect(summarizeActivityDay([])).toEqual({});
    expect(summarizeActivityDay([{ recordType: "Steps", startTime: "2026-02-10T08:00:00.000Z", count: 500 }])).toEqual({ steps: 500 });
  });

  it("отбрасывает отрицательные, NaN и неизвестные единицы", () => {
    const records: ActivityRecordInput[] = [
      { recordType: "Steps", startTime: "2026-02-10T08:00:00.000Z", count: -100 },
      { recordType: "Steps", startTime: "2026-02-10T08:10:00.000Z", count: Number.NaN },
      { recordType: "Steps", startTime: "2026-02-10T08:20:00.000Z", count: 2000 },
      { recordType: "TotalCaloriesBurned", startTime: "2026-02-10T08:00:00.000Z", energy: { value: Number.NaN, unit: "kilocalories" } },
      { recordType: "Distance", startTime: "2026-02-10T08:00:00.000Z", distance: { value: 100, unit: "parsecs" as never } },
      { recordType: "Distance", startTime: "2026-02-10T08:00:00.000Z", distance: { value: 2000, unit: "meters" } },
    ];
    expect(summarizeActivityDay(records)).toEqual({ steps: 2000, distanceKm: 2 });
  });

  it("учитывает нулевые значения как валидные записи", () => {
    expect(summarizeActivityDay([{ recordType: "Steps", startTime: "2026-02-10T08:00:00.000Z", count: 0 }])).toEqual({ steps: 0 });
  });
});

describe("неделя активности", () => {
  it("заполняет нулями дни без данных и сортирует по дате", () => {
    const records: ActivityRecordInput[] = [
      { recordType: "Steps", startTime: "2026-02-10T10:00:00.000Z", count: 6000 },
      { recordType: "Steps", startTime: "2026-02-12T10:00:00.000Z", count: 2500 },
      { recordType: "TotalCaloriesBurned", startTime: "2026-02-12T10:00:00.000Z", energy: { value: 310, unit: "kilocalories" } },
    ];
    const week = buildActivityWeek(records, "2026-02-13");
    expect(week).toHaveLength(7);
    expect(week.map((day) => day.dateISO)).toEqual([
      "2026-02-07", "2026-02-08", "2026-02-09", "2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13",
    ]);
    expect(week[0]).toEqual({ dateISO: "2026-02-07", steps: 0, activeKcal: 0, distanceKm: 0 });
    expect(week[3]).toEqual({ dateISO: "2026-02-10", steps: 6000, activeKcal: 0, distanceKm: 0 });
    expect(week[5]).toEqual({ dateISO: "2026-02-12", steps: 2500, activeKcal: 310, distanceKm: 0 });
    expect(week[6]).toEqual({ dateISO: "2026-02-13", steps: 0, activeKcal: 0, distanceKm: 0 });
  });

  it("якорится на самый поздний день записей, если якорь не задан", () => {
    const records: ActivityRecordInput[] = [
      { recordType: "Steps", startTime: "2026-02-08T10:00:00.000Z", count: 1000 },
      { recordType: "Steps", startTime: "2026-02-10T22:30:00.000Z", count: 4000 },
    ];
    const week = buildActivityWeek(records);
    expect(week.at(-1)?.dateISO).toBe("2026-02-10");
    expect(week.at(-1)?.steps).toBe(4000);
    expect(week[0]?.dateISO).toBe("2026-02-04");
  });

  it("возвращает пустой массив без записей и якоря, игнорирует битые даты", () => {
    expect(buildActivityWeek([])).toEqual([]);
    expect(buildActivityWeek([{ recordType: "Steps", startTime: "не дата", count: 100 }])).toEqual([]);
    const week = buildActivityWeek([{ recordType: "Steps", startTime: "битая дата", count: 100 }], "2026-02-13");
    expect(week).toHaveLength(7);
    expect(week.every((day) => day.steps === 0 && day.activeKcal === 0 && day.distanceKm === 0)).toBe(true);
  });
});

describe("служебные функции локального времени", () => {
  it("формирует локальный ключ даты без сдвига на UTC", () => {
    expect(localDateKey(new Date(2026, 1, 13))).toBe("2026-02-13");
    expect(shiftDateISO("2026-02-01", -1)).toBe("2026-01-31");
    expect(shiftDateISO("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("начало локального дня — полуночь по времени устройства", () => {
    const noon = new Date(2026, 1, 13, 15, 45);
    const start = new Date(localDayStartISO(noon));
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(1);
    expect(start.getDate()).toBe(13);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });
});

describe("сводка пульса за день", () => {
  it("переиспользует агрегатор тренировочного пульса", () => {
    const summary = summarizeDailyHeartRate([{ samples: [
      { time: "2026-02-13T09:00:00.000Z", beatsPerMinute: 72 },
      { time: "2026-02-13T09:05:00.000Z", beatsPerMinute: 152 },
      { time: "2026-02-13T09:02:00.000Z", beatsPerMinute: 84 },
    ] }]);
    expect(summary).toEqual({ currentBpm: 152, averageBpm: 103, peakBpm: 152, sampleCount: 3, latestSampleAt: "2026-02-13T09:05:00.000Z" });
    expect(summarizeDailyHeartRate([])).toEqual({ sampleCount: 0 });
  });
});
