import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { storage.set(key, value); }),
  },
}));

describe("приватность пульса на экране блокировки", () => {
  beforeEach(() => storage.clear());

  it("по умолчанию разрешает пульс, но сохраняет явное отключение", async () => {
    const { loadLockScreenHeartRateVisible, saveLockScreenHeartRateVisible } = await import("../lib/lock-screen-heart-rate-privacy");
    expect(await loadLockScreenHeartRateVisible()).toBe(true);
    await saveLockScreenHeartRateVisible(false);
    expect(await loadLockScreenHeartRateVisible()).toBe(false);
  });
});
