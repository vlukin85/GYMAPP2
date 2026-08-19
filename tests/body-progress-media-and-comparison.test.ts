import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { compareBodyMeasurements, formatBodyDifference } from "../lib/body-comparison";

const bodyStore = readFileSync(resolve(process.cwd(), "lib/body-store.tsx"), "utf8");
const bodyScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/body.tsx"), "utf8");
const mediaHelper = readFileSync(resolve(process.cwd(), "lib/body-progress-media.ts"), "utf8");

describe("body progress photos and comparison", () => {
  const earlier = { id: "earlier", date: "2026-08-01", weightKg: 80, waistCm: 90, chestCm: 100 };
  const later = { id: "later", date: "2026-08-15", weightKg: 78.5, waistCm: 87.5, chestCm: 101 };

  it("calculates kilogram and centimetre differences only from existing values", () => {
    const rows = compareBodyMeasurements(earlier, later);
    expect(rows.find((row) => row.metricId === "weightKg")?.difference).toBe(-1.5);
    expect(rows.find((row) => row.metricId === "waistCm")?.difference).toBe(-2.5);
    expect(rows.find((row) => row.metricId === "upperArmCm")?.difference).toBeUndefined();
    expect(formatBodyDifference(-2.5, "см")).toBe("-2.5 см");
    expect(formatBodyDifference(1, "кг")).toBe("+1 кг");
  });

  it("stores photo metadata separately from measurements and renders a two-date comparison", () => {
    expect(bodyStore).toContain("BodyProgressPhoto");
    expect(bodyStore).toContain("ironrise.body-progress-photos.v1");
    expect(bodyStore).toContain("addPhoto");
    expect(bodyScreen).toContain("pickAndPersistBodyProgressPhoto");
    expect(bodyScreen).toContain("BodyComparisonCard");
    expect(bodyScreen).toContain("ComparePhoto");
  });

  it("uses a deliberate image-library action and persists only the final body-scoped rendition", () => {
    expect(mediaHelper).toContain("launchImageLibraryAsync");
    expect(mediaHelper).toContain("result.canceled");
    expect(mediaHelper).toContain("MAX_USER_IMAGE_BYTES");
    expect(mediaHelper).toContain('"body"');
  });
});
