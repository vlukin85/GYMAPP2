import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createMeasurementRecord } from "../lib/body-store";
import {
  BODY_SCALE_PERMISSIONS,
  COMPOSITION_MATCH_TOLERANCE_MS,
  bodyFatToPercent,
  bodySyncMeasurementId,
  collectWeighIns,
  dedupeAgainst,
  massToKilograms,
  type BodyFatRecordInput,
  type BodyMassRecordInput,
  type WeightRecordInput,
  type WeighInCandidate,
} from "../lib/health-connect-body";

const bodyStore = readFileSync(resolve(process.cwd(), "lib/body-store.tsx"), "utf8");
const bodyScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/body.tsx"), "utf8") + readFileSync(resolve(process.cwd(), "lib/i18n/domains/body.ts"), "utf8");
// Русские подписи экрана настроек живут в словаре домена settings,
// поэтому экран проверяется вместе со своим словарём локализации.
const settings =
  readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8") +
  readFileSync(
    resolve(process.cwd(), "lib/i18n/domains/settings.ts"),
    "utf8",
  );
const layout = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");

const kg = (value: number) => ({ value, unit: "kilograms" as const });

describe("разрешения Health Connect на весы", () => {
  it("запрашивает чтение веса и четырёх типов состава тела", () => {
    expect(BODY_SCALE_PERMISSIONS).toEqual([
      { accessType: "read", recordType: "Weight" },
      { accessType: "read", recordType: "BodyFat" },
      { accessType: "read", recordType: "LeanBodyMass" },
      { accessType: "read", recordType: "BoneMass" },
      { accessType: "read", recordType: "BodyWaterMass" },
    ]);
    expect(BODY_SCALE_PERMISSIONS.every((permission) => permission.accessType === "read")).toBe(true);
  });
});

describe("конвертация единиц массы", () => {
  it("переводит единицы веса в килограммы", () => {
    expect(massToKilograms({ value: 74.1, unit: "kilograms" })).toBeCloseTo(74.1);
    expect(massToKilograms({ value: 163.36, unit: "pounds" })).toBeCloseTo(74.09, 1);
    expect(massToKilograms({ value: 74100, unit: "grams" })).toBeCloseTo(74.1);
    expect(massToKilograms({ value: 2614.9, unit: "ounces" })).toBeCloseTo(74.1, 1);
    expect(massToKilograms({ value: 74100000, unit: "milligrams" })).toBeCloseTo(74.1);
    expect(massToKilograms({ value: 74100000000, unit: "micrograms" })).toBeCloseTo(74.1);
  });

  it("отбрасывает битые и неизвестные значения массы", () => {
    expect(massToKilograms({ value: -1, unit: "kilograms" })).toBeNull();
    expect(massToKilograms({ value: Number.NaN, unit: "kilograms" })).toBeNull();
    expect(massToKilograms({ value: 74, unit: "parsecs" as never })).toBeNull();
    expect(massToKilograms(undefined)).toBeNull();
  });

  it("принимает процент жира только в диапазоне 0–100", () => {
    expect(bodyFatToPercent(21.4)).toBeCloseTo(21.4);
    expect(bodyFatToPercent(0)).toBe(0);
    expect(bodyFatToPercent(-1)).toBeNull();
    expect(bodyFatToPercent(140)).toBeNull();
    expect(bodyFatToPercent(Number.NaN)).toBeNull();
    expect(bodyFatToPercent(undefined)).toBeNull();
  });
});

describe("сопоставление веса с составом тела", () => {
  const weight: WeightRecordInput[] = [
    { time: "2026-02-10T07:00:00.000Z", weight: kg(74.1) },
    { time: "2026-02-11T07:02:00.000Z", weight: kg(73.9) },
  ];
  const fat: BodyFatRecordInput[] = [
    { time: "2026-02-10T07:01:30.000Z", percentage: 21.4 },
    { time: "2026-02-11T07:00:00.000Z", percentage: 21.1 },
  ];
  const mass = (time: string, value: number): BodyMassRecordInput => ({ time, mass: kg(value) });

  it("сопоставляет состав в пределах ±2 минут и выбирает ближайшую запись", () => {
    expect(COMPOSITION_MATCH_TOLERANCE_MS).toBe(120000);
    const candidates = collectWeighIns(weight, fat, [mass("2026-02-10T07:01:00.000Z", 55.2)], [mass("2026-02-10T07:00:30.000Z", 3.4)], [mass("2026-02-10T07:01:59.000Z", 42.7)], []);
    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({ date: "2026-02-10", weightKg: 74.1, bodyFatPct: 21.4, muscleMassKg: 55.2, boneMassKg: 3.4, waterMassKg: 42.7, sourceAtISO: "2026-02-10T07:00:00.000Z" });
    expect(candidates[1]).toMatchObject({ date: "2026-02-11", weightKg: 73.9, bodyFatPct: 21.1 });
  });

  it("создаёт запись только с весом, если состав отсутствует или вне допуска", () => {
    const candidates = collectWeighIns([weight[0]], [], [mass("2026-02-10T07:05:00.000Z", 55.2)], [], [], []);
    expect(candidates).toEqual([{ date: "2026-02-10", weightKg: 74.1, sourceAtISO: "2026-02-10T07:00:00.000Z" }]);
  });

  it("отфильтровывает уже обработанные метки веса", () => {
    const candidates = collectWeighIns(weight, fat, [], [], [], ["2026-02-10T07:00:00.000Z", "2026-02-10T09:00:00.000+0200"]);
    expect(candidates.map((candidate) => candidate.sourceAtISO)).toEqual(["2026-02-11T07:02:00.000Z"]);
  });

  it("отбрасывает битые значения веса и состава", () => {
    const candidates = collectWeighIns(
      [
        { time: "2026-02-12T07:00:00.000Z", weight: { value: 0, unit: "kilograms" } },
        { time: "2026-02-12T07:10:00.000Z", weight: { value: -80, unit: "kilograms" } },
        { time: "2026-02-12T07:20:00.000Z", weight: { value: Number.NaN, unit: "pounds" } },
        { time: "битая метка", weight: kg(75) },
        { time: "2026-02-12T07:30:00.000Z", weight: kg(72.3) },
      ],
      [
        { time: "2026-02-12T07:30:30.000Z", percentage: 130 },
        { time: "2026-02-12T07:31:00.000Z", percentage: Number.NaN },
      ],
      [{ time: "2026-02-12T07:30:30.000Z", mass: { value: Number.NaN, unit: "kilograms" } }],
      [],
      [],
      [],
    );
    expect(candidates).toEqual([{ date: "2026-02-12", weightKg: 72.3, sourceAtISO: "2026-02-12T07:30:00.000Z" }]);
  });

  it("возвращает пустой список без записей веса", () => {
    expect(collectWeighIns([], [], [], [], [], [])).toEqual([]);
  });
});

describe("дедупликация против локального журнала", () => {
  const candidate = (date: string, weightKg: number): WeighInCandidate => ({ date, weightKg, sourceAtISO: `${date}T07:00:00.000Z` });

  it("пропускает кандидата на ту же дату с тем же весом ±0,1 кг", () => {
    const existing = [{ date: "2026-02-10", weightKg: 74.05 }];
    expect(dedupeAgainst(existing, [candidate("2026-02-10", 74.1)])).toEqual([]);
    expect(dedupeAgainst([{ date: "2026-02-10", weightKg: 74.21 }], [candidate("2026-02-10", 74.1)])).toEqual([candidate("2026-02-10", 74.1)]);
  });

  it("создаёт запись на другую дату и при другом весе на ту же дату", () => {
    const existing = [{ date: "2026-02-10", weightKg: 74.1 }];
    expect(dedupeAgainst(existing, [candidate("2026-02-11", 74.1)])).toEqual([candidate("2026-02-11", 74.1)]);
    expect(dedupeAgainst(existing, [candidate("2026-02-10", 76.4)])).toEqual([candidate("2026-02-10", 76.4)]);
  });

  it("не мешает кандидатам без веса в существующем замере", () => {
    const existing = [{ date: "2026-02-10" }];
    expect(dedupeAgainst(existing, [candidate("2026-02-10", 74.1)])).toEqual([candidate("2026-02-10", 74.1)]);
  });
});

describe("детерминированные идентификаторы синхронизации", () => {
  it("строит id как hc-<timestampISO>", () => {
    expect(bodySyncMeasurementId("2026-02-10T07:00:00.000Z")).toBe("hc-2026-02-10T07:00:00.000Z");
    expect(bodySyncMeasurementId("2026-02-10T07:00:00.000Z")).toBe(bodySyncMeasurementId("2026-02-10T07:00:00.000Z"));
  });

  it("addMeasurement сохраняет состав тела и внешний id", () => {
    const record = createMeasurementRecord({
      id: "hc-2026-02-10T07:00:00.000Z",
      date: "2026-02-10",
      weightKg: 74.1,
      bodyFatPct: 21.4,
      muscleMassKg: 55.2,
      boneMassKg: 3.4,
      waterMassKg: 42.7,
      bmiKgM2: 24.2,
      sourceAtISO: "2026-02-10T07:00:00.000Z",
    });
    expect(record.id).toBe("hc-2026-02-10T07:00:00.000Z");
    expect(record).toMatchObject({ date: "2026-02-10", weightKg: 74.1, muscleMassKg: 55.2, boneMassKg: 3.4, waterMassKg: 42.7, bmiKgM2: 24.2, sourceAtISO: "2026-02-10T07:00:00.000Z" });
    const generated = createMeasurementRecord({ date: "2026-02-10", weightKg: 74.1 });
    expect(generated.id).toContain("2026-02-10-");
  });
});

describe("модель тела расширена опциональным составом", () => {
  it("BodyMeasurement несёт поля состава и источник без изменения BODY_METRICS", () => {
    expect(bodyStore).toContain("muscleMassKg");
    expect(bodyStore).toContain("boneMassKg");
    expect(bodyStore).toContain("waterMassKg");
    expect(bodyStore).toContain("bmiKgM2");
    expect(bodyStore).toContain("sourceAtISO");
    expect(bodyStore).toContain('"weightKg" | "bodyFatPct" | "chestCm" | "waistCm" | "hipsCm" | "upperArmCm" | "thighCm"');
  });

  it("вкладка «Тело» показывает состав, источник и синхронизируется автоматически", () => {
    expect(bodyScreen).toContain("Мышцы");
    expect(bodyScreen).toContain("Кости");
    expect(bodyScreen).toContain("Вода");
    expect(bodyScreen).toContain("ИМТ");
    expect(bodyScreen).toContain("measurementSourceLabel");
    expect(bodyScreen).toContain("syncBodyWeighIns");
  });

  it("настройки содержат секцию умных весов с автосинхронизацией", () => {
    expect(settings).toContain("Умные весы (OKOK · Health Connect)");
    expect(settings).toContain("Подключить весы");
    expect(settings).toContain("Синхронизировать сейчас");
    expect(settings).toContain("Автосинхронизация при запуске");
    expect(settings).toContain("connectBodyScale");
  });

  it("корневой layout запускает автосинхронизацию весов внутри провайдеров", () => {
    expect(layout).toContain("BodyScaleAutoSync");
  });
});
