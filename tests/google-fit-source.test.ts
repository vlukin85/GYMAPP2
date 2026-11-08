import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Моки инфраструктуры ────────────────────────────────────────────────────

const asyncStorage = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
});
vi.mock("@react-native-async-storage/async-storage", () => ({ default: asyncStorage }));

const platform = vi.hoisted(() => ({ os: "android" }));
vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return platform.os;
    },
  },
}));

const googleFit = vi.hoisted(() => ({
  status: { state: "ready", message: "ок" } as { state: string; message: string },
  daily: { steps: 7777, activeKcal: 350, distanceKm: 5.2, heartRate: null } as Record<string, unknown>,
  week: [{ dateISO: "2026-02-10", steps: 7777, activeKcal: 350, distanceKm: 5.2 }] as unknown[],
  weightSamples: [] as { timestampISO: string; weightKg: number }[],
  calls: { daily: 0, week: 0, weight: 0, authorize: 0 },
}));
vi.mock("../lib/google-fit", () => ({
  GOOGLE_FIT_SCOPES: [],
  getGoogleFitStatus: vi.fn(async () => googleFit.status),
  isGoogleFitAvailable: vi.fn(async () => googleFit.status.state === "ready"),
  authorizeGoogleFit: vi.fn(async () => {
    googleFit.calls.authorize += 1;
    return googleFit.status;
  }),
  readGoogleFitDailyActivity: vi.fn(async () => {
    googleFit.calls.daily += 1;
    return googleFit.daily;
  }),
  readGoogleFitActivityWeek: vi.fn(async () => {
    googleFit.calls.week += 1;
    return googleFit.week;
  }),
  readGoogleFitWeightSamples: vi.fn(async () => {
    googleFit.calls.weight += 1;
    return googleFit.weightSamples;
  }),
}));

const healthConnect = vi.hoisted(() => ({
  status: { state: "ready", heartRateGranted: true, activityGranted: true, message: "" } as Record<string, unknown>,
  daily: { steps: 4321, activeKcal: 210, distanceKm: 3.1, heartRate: null } as Record<string, unknown>,
  week: [{ dateISO: "2026-02-10", steps: 4321, activeKcal: 210, distanceKm: 3.1 }] as unknown[],
  calls: { daily: 0, week: 0 },
}));
vi.mock("../lib/health-connect", () => ({
  getHealthConnectStatus: vi.fn(async () => healthConnect.status),
  readDailyActivity: vi.fn(async () => {
    healthConnect.calls.daily += 1;
    return healthConnect.daily;
  }),
  readActivityWeek: vi.fn(async () => {
    healthConnect.calls.week += 1;
    return healthConnect.week;
  }),
}));

const healthConnectNative = vi.hoisted(() => ({
  SdkAvailabilityStatus: { SDK_AVAILABLE: 1, SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2 },
  getSdkStatus: vi.fn(async () => 1),
  initialize: vi.fn(async () => true),
  getGrantedPermissions: vi.fn(async () => [] as { accessType: string; recordType: string }[]),
  requestPermission: vi.fn(async () => []),
  readRecords: vi.fn(async (_recordType?: string, _options?: unknown): Promise<{ records: unknown[] }> => ({ records: [] })),
}));
vi.mock("react-native-health-connect", () => healthConnectNative);

// ── Импорты тестируемых модулей ───────────────────────────────────────────

import { syncBodyWeighIns } from "../lib/health-connect-body-sync";
import { collectGoogleFitWeighIns, googleFitMeasurementId } from "../lib/health-connect-body";
import {
  getActivityStatus,
  getActivityToday,
  getActivityWeek,
  GOOGLE_FIT_CONNECT_HINT,
} from "../lib/activity-provider";
import {
  DEFAULT_HEALTH_SOURCE,
  HEALTH_SOURCE_STORAGE_KEY,
  loadHealthSource,
  normalizeHealthSource,
  saveHealthSource,
} from "../lib/health-source";

function resetDefaults() {
  asyncStorage.store.clear();
  platform.os = "android";
  googleFit.status = { state: "ready", message: "ок" };
  googleFit.weightSamples = [];
  googleFit.calls = { daily: 0, week: 0, weight: 0, authorize: 0 };
  healthConnect.status = { state: "ready", heartRateGranted: true, activityGranted: true, message: "" };
  healthConnect.calls = { daily: 0, week: 0 };
  healthConnectNative.readRecords.mockImplementation(async () => ({ records: [] }));
  healthConnectNative.getGrantedPermissions.mockImplementation(async () => []);
}

beforeEach(resetDefaults);

// ── Выбор источника ───────────────────────────────────────────────────────

describe("выбор источника данных о здоровье", () => {
  it("по умолчанию выбран Google Fit, даже если хранилище пустое", async () => {
    expect(DEFAULT_HEALTH_SOURCE).toBe("google-fit");
    expect(await loadHealthSource()).toBe("google-fit");
  });

  it("сохраняет и загружает выбор источника", async () => {
    await saveHealthSource("health-connect");
    expect(asyncStorage.store.get(HEALTH_SOURCE_STORAGE_KEY)).toBe("health-connect");
    expect(await loadHealthSource()).toBe("health-connect");
    await saveHealthSource("google-fit");
    expect(await loadHealthSource()).toBe("google-fit");
  });

  it("приводит битые значения к дефолту Google Fit", async () => {
    expect(normalizeHealthSource("kitchen-sink")).toBe("google-fit");
    expect(normalizeHealthSource(undefined)).toBe("google-fit");
    expect(normalizeHealthSource("health-connect")).toBe("health-connect");
    asyncStorage.store.set(HEALTH_SOURCE_STORAGE_KEY, "kitchen-sink");
    expect(await loadHealthSource()).toBe("google-fit");
  });
});

// ── Провайдер активности ──────────────────────────────────────────────────

describe("провайдер активности", () => {
  it("читает день и неделю из Google Fit, когда он основной и готов", async () => {
    await saveHealthSource("google-fit");
    await expect(getActivityToday()).resolves.toMatchObject({ steps: 7777 });
    await expect(getActivityWeek()).resolves.toHaveLength(1);
    expect(googleFit.calls.daily).toBe(1);
    expect(googleFit.calls.week).toBe(1);
    expect(healthConnect.calls.daily).toBe(0);
    const status = await getActivityStatus();
    expect(status).toMatchObject({ source: "google-fit", connected: true, hint: null });
  });

  it("фолбэкает на Health Connect, когда Google Fit не авторизован", async () => {
    await saveHealthSource("google-fit");
    googleFit.status = { state: "unauthorized", message: "нужно разрешение" };
    await expect(getActivityToday()).resolves.toMatchObject({ steps: 4321 });
    await expect(getActivityWeek()).resolves.toHaveLength(1);
    expect(googleFit.calls.daily).toBe(0);
    expect(healthConnect.calls.daily).toBe(1);
    const status = await getActivityStatus();
    expect(status.connected).toBe(true);
    expect(status.hint).toBeNull();
  });

  it("подсказывает подключить Google Fit, когда резерв Health Connect тоже не готов", async () => {
    await saveHealthSource("google-fit");
    googleFit.status = { state: "unauthorized", message: "нужно разрешение" };
    healthConnect.status = { state: "permission-required", heartRateGranted: false, activityGranted: false, message: "" };
    const status = await getActivityStatus();
    expect(status.connected).toBe(false);
    expect(status.hint).toBe(GOOGLE_FIT_CONNECT_HINT);
    expect(GOOGLE_FIT_CONNECT_HINT).toBe("Подключите Google Fit в настройках");
  });

  it("при источнике Health Connect Google Fit не читается вовсе", async () => {
    await saveHealthSource("health-connect");
    await expect(getActivityToday()).resolves.toMatchObject({ steps: 4321 });
    expect(googleFit.calls.daily).toBe(0);
    expect(googleFit.calls.week).toBe(0);
    const status = await getActivityStatus();
    expect(status).toMatchObject({ source: "health-connect", connected: true, hint: null });
  });
});

// ── Обёртка Google Fit: деградация вне Android и без нативного модуля ─────

describe("обёртка Google Fit деградирует без нативного модуля", () => {
  it("вне Android всё чтение возвращает пустые значения без исключений", async () => {
    platform.os = "ios";
    const wrapper = await vi.importActual<typeof import("../lib/google-fit")>("../lib/google-fit");
    await expect(wrapper.isGoogleFitAvailable()).resolves.toBe(false);
    await expect(wrapper.getGoogleFitStatus()).resolves.toMatchObject({ state: "unavailable" });
    await expect(wrapper.readGoogleFitDailyActivity()).resolves.toEqual({ heartRate: null });
    await expect(wrapper.readGoogleFitActivityWeek()).resolves.toEqual([]);
    await expect(wrapper.readGoogleFitWeightSamples(90)).resolves.toEqual([]);
    await expect(wrapper.authorizeGoogleFit()).resolves.toMatchObject({ state: "unavailable" });
  });

  it("на Android без нативного модуля статус unavailable, а не исключение", async () => {
    platform.os = "android";
    const wrapper = await vi.importActual<typeof import("../lib/google-fit")>("../lib/google-fit");
    await expect(wrapper.isGoogleFitAvailable()).resolves.toBe(false);
    const status = await wrapper.getGoogleFitStatus();
    expect(status.state).toBe("unavailable");
    expect(status.message).toContain("OAuth");
    await expect(wrapper.readGoogleFitWeightSamples()).resolves.toEqual([]);
  });
});

// ── Чистая логика взвешиваний из Google Fit ───────────────────────────────

describe("collectGoogleFitWeighIns", () => {
  it("конвертирует образцы веса в кандидатов и пропускает обработанные метки", () => {
    const samples = [
      { timestampISO: "2026-02-10T08:00:00.000Z", weightKg: 80.23 },
      { timestampISO: "2026-02-11T07:30:00.000Z", weightKg: 80.0 },
      { timestampISO: "2026-02-11T07:35:00.000Z", weightKg: 79.8 },
    ];
    const candidates = collectGoogleFitWeighIns(samples, ["2026-02-11T07:30:00.000Z"]);
    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({ date: "2026-02-10", weightKg: 80.2, sourceAtISO: "2026-02-10T08:00:00.000Z" });
    expect(candidates[1]).toMatchObject({ date: "2026-02-11", weightKg: 79.8 });
    expect(candidates.every((candidate) => candidate.bodyFatPct === undefined && candidate.muscleMassKg === undefined)).toBe(true);
  });

  it("отбрасывает мусорные образцы: NaN, нулевой и отрицательный вес", () => {
    const samples = [
      { timestampISO: "broken", weightKg: 80 },
      { timestampISO: "2026-02-10T08:00:00.000Z", weightKg: Number.NaN },
      { timestampISO: "2026-02-10T08:05:00.000Z", weightKg: 0 },
      { timestampISO: "2026-02-10T08:10:00.000Z", weightKg: -1 },
      { timestampISO: "2026-02-10T08:15:00.000Z", weightKg: 81.5 },
    ];
    expect(collectGoogleFitWeighIns(samples, [])).toHaveLength(1);
  });

  it("строит детерминированный идентификатор замера gf-<метка>", () => {
    expect(googleFitMeasurementId("2026-02-10T08:00:00.000Z")).toBe("gf-2026-02-10T08:00:00.000Z");
  });
});

// ── syncBodyWeighIns с источником Google Fit ──────────────────────────────

describe("syncBodyWeighIns с источником Google Fit", () => {
  it("создаёт замер из мок-веса Google Fit и пишет его в журнал", async () => {
    await saveHealthSource("google-fit");
    googleFit.weightSamples = [{ timestampISO: "2026-02-10T08:00:00.000Z", weightKg: 80.23 }];
    const created: Record<string, unknown>[] = [];
    const result = await syncBodyWeighIns({ force: true, addMeasurement: (measurement) => created.push(measurement) });
    expect(result).toMatchObject({ created: 1, skipped: 0, lastWeight: 80.2, granted: true });
    expect(created[0]).toMatchObject({
      id: "gf-2026-02-10T08:00:00.000Z",
      date: "2026-02-10",
      weightKg: 80.2,
      sourceAtISO: "2026-02-10T08:00:00.000Z",
    });
    expect(created[0]).not.toHaveProperty("bodyFatPct");
    expect(googleFit.calls.weight).toBe(1);
    expect(healthConnectNative.readRecords).not.toHaveBeenCalled();
    const state = JSON.parse(asyncStorage.store.get("ironrise.health-connect-body-sync.v1") ?? "{}");
    expect(state.processedAtISO).toEqual(["2026-02-10T08:00:00.000Z"]);
  });

  it("второй синк не дублирует уже обработанные метки", async () => {
    await saveHealthSource("google-fit");
    googleFit.weightSamples = [{ timestampISO: "2026-02-10T08:00:00.000Z", weightKg: 80.23 }];
    await syncBodyWeighIns({ force: true, addMeasurement: () => undefined });
    const created: unknown[] = [];
    const second = await syncBodyWeighIns({ force: true, addMeasurement: (measurement) => created.push(measurement) });
    expect(second).toMatchObject({ created: 0, granted: true });
    expect(created).toHaveLength(0);
  });

  it("без авторизации Google Fit возвращает granted: false и ничего не создаёт", async () => {
    await saveHealthSource("google-fit");
    googleFit.status = { state: "unauthorized", message: "нужно разрешение" };
    googleFit.weightSamples = [{ timestampISO: "2026-02-10T08:00:00.000Z", weightKg: 80.23 }];
    const created: unknown[] = [];
    const result = await syncBodyWeighIns({ force: true, addMeasurement: (measurement) => created.push(measurement) });
    expect(result).toMatchObject({ created: 0, skipped: 0, granted: false });
    expect(created).toHaveLength(0);
  });

  it("при источнике Health Connect работает прежний путь и Google Fit не читается", async () => {
    await saveHealthSource("health-connect");
    healthConnectNative.getGrantedPermissions.mockImplementation(async () =>
      ["Weight", "BodyFat", "LeanBodyMass", "BoneMass", "BodyWaterMass"].map((recordType) => ({ accessType: "read", recordType })),
    );
    healthConnectNative.readRecords.mockImplementation(async (recordType?: string) => ({
      records: recordType === "Weight" ? [{ time: "2026-02-11T07:00:00.000Z", weight: { inKilograms: 79.5 } }] : [],
    }));
    const created: Record<string, unknown>[] = [];
    const result = await syncBodyWeighIns({ force: true, addMeasurement: (measurement) => created.push(measurement) });
    expect(result).toMatchObject({ created: 1, granted: true, lastWeight: 79.5 });
    expect(created[0]).toMatchObject({ id: "hc-2026-02-11T07:00:00.000Z", date: "2026-02-11", weightKg: 79.5 });
    expect(googleFit.calls.weight).toBe(0);
  });
});
