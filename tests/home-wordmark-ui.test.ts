import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const screen = readFileSync(
  resolve(process.cwd(), "app/(tabs)/index.tsx"),
  "utf8",
);

describe("home hero layout (Dark Energy redesign)", () => {
  it("opens with the diary eyebrow and time-aware greeting instead of a giant wordmark", () => {
    expect(screen).toContain("Дневник тренировок");
    expect(screen).toContain("heroEyebrow: { ...typeTokens.eyebrow }");
    expect(screen).not.toMatch(/fontSize:\s*34/);
  });

  it("keeps the redesigned week and quote cards on the home screen", () => {
    expect(screen).toContain("weekCard");
    expect(screen).toContain("quoteCard");
    expect(screen).toContain("Начать тренировку");
  });
});
