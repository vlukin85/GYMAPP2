import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const nutrition = readFileSync(resolve(process.cwd(), "app/(tabs)/nutrition.tsx"), "utf8");
const tabs = readFileSync(resolve(process.cwd(), "app/(tabs)/_layout.tsx"), "utf8");

describe("nutrition journal ui", () => {
  it("shows meals, food search and a calendar on the nutrition tab", () => {
    expect(nutrition).toContain("ПРИЁМЫ ПИЩИ");
    expect(nutrition).toContain("КАЛЕНДАРЬ ПИТАНИЯ");
    expect(nutrition).toContain("Поиск по базе продуктов");
  });
  it("adds a dedicated nutrition main tab", () => expect(tabs).toContain('name="nutrition"'));
});
