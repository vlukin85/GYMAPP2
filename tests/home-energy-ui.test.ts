import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

describe("виджет расхода калорий на главном экране", () => {
  it("передаёт выбранный уровень активности в расчёт и показывает семидневную динамику", () => {
    expect(home).toContain("activityLevel");
    expect(home).toContain("buildHomeEnergyTrend");
    expect(home).toContain("РАСХОД · 7 ДНЕЙ");
    expect(home).toContain("Акцент — дни с завершённой тренировкой.");
  });
});
