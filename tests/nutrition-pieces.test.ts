import { describe, expect, it } from "vitest";
import { defaultPieceLabel, effectiveEntryGrams, entryCalories, entryMacros, getFood, pieceLabelOf, type FoodEntry } from "../lib/nutrition-data";

const entry = (patch: Partial<FoodEntry>): FoodEntry => ({ id: "entry", date: "2026-08-19", meal: "Перекус", productId: "egg", grams: 100, ...patch });

describe("piece-based food entries", () => {
  it("converts pieces to grams through the product piece weight", () => {
    expect(effectiveEntryGrams(entry({ pieces: 3 }), getFood("egg"))).toBe(165);
    expect(effectiveEntryGrams(entry({ pieces: 2 }), getFood("egg-c0"))).toBe(124);
    expect(effectiveEntryGrams(entry({ pieces: 4 }), getFood("egg-c2"))).toBe(172);
  });
  it("keeps grams when the entry has no pieces", () => {
    expect(effectiveEntryGrams(entry({ grams: 180 }), getFood("egg"))).toBe(180);
    expect(effectiveEntryGrams(entry({ grams: 180 }), undefined)).toBe(180);
  });
  it("falls back to grams for products without a piece weight", () => {
    expect(effectiveEntryGrams(entry({ productId: "rice", grams: 200, pieces: 2 }), getFood("rice"))).toBe(200);
    const custom = entry({ grams: 250, pieces: 1, customProduct: { id: "custom", name: "Свой", category: "Мои продукты", kcalPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 20 } });
    expect(effectiveEntryGrams(custom, custom.customProduct)).toBe(250);
  });
  it("rounds fractional pieces and ignores non-positive piece counts", () => {
    expect(effectiveEntryGrams(entry({ pieces: 2.6 }), getFood("egg"))).toBe(165);
    expect(effectiveEntryGrams(entry({ pieces: 0 }), getFood("egg"))).toBe(100);
    expect(effectiveEntryGrams(entry({ pieces: -2 }), getFood("egg"))).toBe(100);
    expect(effectiveEntryGrams(entry({ pieces: Number.NaN }), getFood("egg"))).toBe(100);
  });
  it("recalculates calories and macros from pieces", () => {
    expect(entryCalories(entry({ pieces: 3 }))).toBe(236);
    const macros = entryMacros(entry({ pieces: 3 }));
    expect(macros).toEqual({ protein: 20 * 1.65, fat: 8 * 1.65, carbs: 0 });
    expect(entryCalories(entry({ pieces: 3 }))).toBe(entryCalories(entry({ grams: 165 })));
  });
  it("keeps legacy piece-free entries unchanged", () => {
    expect(entryCalories(entry({ productId: "banana", grams: 150 }))).toBe(134);
    expect(effectiveEntryGrams(entry({ productId: "banana", grams: 150 }), getFood("banana"))).toBe(150);
  });
  it("labels pieces with the product piece label and a default", () => {
    expect(pieceLabelOf(getFood("egg"))).toBe("штука");
    expect(pieceLabelOf(getFood("yogurt"))).toBe("банка");
    expect(pieceLabelOf(getFood("snezhok"))).toBe("стакан");
    expect(pieceLabelOf(getFood("omelette"))).toBe("порция");
    expect(pieceLabelOf(getFood("rice"))).toBe(defaultPieceLabel);
    expect(pieceLabelOf(null)).toBe(defaultPieceLabel);
  });
});
