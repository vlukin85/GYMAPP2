import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const exercises = readFileSync(
  resolve(process.cwd(), "app/(tabs)/exercises.tsx"),
  "utf8",
);

describe("компактные фильтры каталога упражнений", () => {
  it("оставляет фильтры в одной горизонтально прокручиваемой компактной строке", () => {
    expect(exercises).toContain("horizontal");
    expect(exercises).toContain("style={styles.filtersScroller}");
    expect(exercises).toContain("contentContainerStyle={styles.filters}");
    expect(exercises).toContain(
      "filtersScroller: { flexGrow: 0, maxHeight: 58 }",
    );
  });

  it("не даёт отдельным чипам растягиваться по высоте или ширине", () => {
    expect(exercises).toMatch(/filter:\s*\{[\s\S]*?height:\s*36/);
    expect(exercises).toMatch(
      /filter:\s*\{[\s\S]*?alignSelf:\s*"flex-start"/,
    );
    expect(exercises).toMatch(/filter:\s*\{[\s\S]*?flexGrow:\s*0/);
    expect(exercises).toMatch(
      /filters:\s*\{[\s\S]*?alignItems:\s*"flex-start"/,
    );
  });
});
