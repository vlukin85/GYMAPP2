import { describe, expect, it } from "vitest";
import { formatStorageBytes, getAsyncStorageEntriesBytes, getUsagePercent, utf8ByteLength } from "../lib/storage-usage-utils";

describe("расчёт локального хранилища", () => {
  it("считает байты UTF-8 для русских и emoji-символов", () => {
    expect(utf8ByteLength("A")).toBe(1);
    expect(utf8ByteLength("Я")).toBe(2);
    expect(utf8ByteLength("🏋️")).toBe(7);
  });

  it("учитывает ключи и значения AsyncStorage", () => {
    expect(getAsyncStorageEntriesBytes([["set", "100"]])).toBe(6);
    expect(getAsyncStorageEntriesBytes([["план", null]])).toBe(8);
  });

  it("ограничивает проценты и форматирует объём", () => {
    expect(getUsagePercent(50, 200)).toBe(25);
    expect(getUsagePercent(400, 200)).toBe(100);
    expect(getUsagePercent(10, null)).toBe(0);
    expect(formatStorageBytes(1024 ** 2 * 1.5)).toBe("1.5 МБ");
  });
});
