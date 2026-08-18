import { describe, expect, it } from "vitest";
import { normalizeStoredStatsFilter, normalizeStoredStatsPreferences } from "../lib/stats-filter-storage";

const fallback = { mode: "month" as const, date: "2026-08-18", start: "2026-08-18", end: "2026-08-18" };

describe("statistics filter storage", () => {
  it("restores only supported local filter modes", () => {
    expect(normalizeStoredStatsFilter({ mode: "last90" }, fallback)).toEqual({ mode: "last90", date: undefined, start: undefined, end: undefined });
    expect(normalizeStoredStatsFilter({ mode: "unexpected" }, fallback)).toEqual(fallback);
  });

  it("restores the selected exercise together with the date filter", () => {
    const preferences = normalizeStoredStatsPreferences({ filter: { mode: "week" }, exerciseId: "barbell-bench-press" }, { filter: fallback, exerciseId: null });
    expect(preferences).toEqual({ filter: { mode: "week", date: undefined, start: undefined, end: undefined }, exerciseId: "barbell-bench-press" });
    expect(normalizeStoredStatsPreferences({ filter: { mode: "month" }, exerciseId: "" }, { filter: fallback, exerciseId: "squat" }).exerciseId).toBeNull();
  });
});
