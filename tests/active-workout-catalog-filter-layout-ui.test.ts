import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");

describe("компактные фильтры каталога активной тренировки", () => {
  it("оставляет фильтры в одной горизонтально прокручиваемой компактной строке", () => {
    expect(workout).toContain("horizontal");
    expect(workout).toContain("style={styles.groupFiltersScroller}");
    expect(workout).toContain("contentContainerStyle={styles.groupFilters}");
    expect(workout).toContain(
      "groupFiltersScroller: { flexGrow: 0, maxHeight: 58 }",
    );
  });

  it("не даёт отдельным чипам растягиваться на высоту или ширину каталога", () => {
    expect(workout).toMatch(/groupFilter:\s*\{[\s\S]*?height:\s*36/);
    expect(workout).toMatch(
      /groupFilter:\s*\{[\s\S]*?alignSelf:\s*"flex-start"/,
    );
    expect(workout).toMatch(/groupFilter:\s*\{[\s\S]*?flexGrow:\s*0/);
    expect(workout).toMatch(
      /groupFilters:\s*\{[\s\S]*?alignItems:\s*"flex-start"/,
    );
  });
});
