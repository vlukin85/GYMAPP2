import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const screen = readFileSync(resolve(process.cwd(), "app/dev/design-gallery.tsx"), "utf8");

describe("design gallery", () => {
  it("contains five compositionally distinct visual directions", () => {
    expect(screen).toContain("SwissSignal");
    expect(screen).toContain("BrutalGrid");
    expect(screen).toContain("LiquidGlass");
    expect(screen).toContain("PocketCoach");
    expect(screen).toContain("TrainingLedger");
  });

  it("uses distinct structural motifs instead of recoloring one dashboard", () => {
    expect(screen).toContain("swissNumber");
    expect(screen).toContain("brutalTimer");
    expect(screen).toContain("orbPercent");
    expect(screen).toContain("coachPath");
    expect(screen).toContain("ledgerTableHead");
  });
});
