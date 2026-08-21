import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const calendar = readFileSync(
  resolve(process.cwd(), "app/(tabs)/calendar.tsx"),
  "utf8",
);

describe("empty calendar date planning", () => {
  it("uses a dedicated empty state and searchable program choice", () => {
    expect(calendar).toContain("Тренировка на эту дату не запланирована");
    expect(calendar).toContain("programSearchOpen");
    expect(calendar).toContain("Поиск программы");
    expect(calendar).toContain("filteredPrograms");
  });
});
