import { describe, expect, it } from "vitest";
import { normalizeStoredStatsFilter } from "../lib/stats-filter-storage";

const fallback = { mode: "month" as const, date: "2026-08-18", start: "2026-08-18", end: "2026-08-18" };

describe("statistics filter storage", () => {
  it("restores only supported local filter modes", () => {
    expect(normalizeStoredStatsFilter({ mode: "last90" }, fallback)).toEqual({ mode: "last90", date: undefined, start: undefined, end: undefined });
    expect(normalizeStoredStatsFilter({ mode: "unexpected" }, fallback)).toEqual(fallback);
  });
});
