import { describe, expect, it } from "vitest";
import { DEFAULT_INTERFACE_DENSITY, getInterfaceDensityPreset, INTERFACE_DENSITY_PRESETS, isInterfaceDensity } from "../lib/interface-density";

describe("interface density presets", () => {
  it("provides compact and large display presets", () => {
    expect(DEFAULT_INTERFACE_DENSITY).toBe("compact");
    expect(INTERFACE_DENSITY_PRESETS.map((preset) => preset.id)).toEqual(["compact", "large"]);
    expect(getInterfaceDensityPreset("large").fontScale).toBeGreaterThan(getInterfaceDensityPreset("compact").fontScale);
    expect(getInterfaceDensityPreset("large").spacingScale).toBeGreaterThan(getInterfaceDensityPreset("compact").spacingScale);
  });

  it("accepts only known density identifiers", () => {
    expect(isInterfaceDensity("compact")).toBe(true);
    expect(isInterfaceDensity("large")).toBe(true);
    expect(isInterfaceDensity("regular")).toBe(false);
  });
});
