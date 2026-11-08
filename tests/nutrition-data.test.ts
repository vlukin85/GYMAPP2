import { describe, expect, it } from "vitest";
import { effectiveEntryGrams, entryCalories, entryMacros, getFood, popularFoods } from "../lib/nutrition-data";

describe("nutrition food database", () => {
  it("contains 336 popular foods with calorie values and macronutrients", () => {
    expect(popularFoods).toHaveLength(336);
    expect(popularFoods.every((food) => food.kcalPer100g >= 0 && food.name.length > 0 && food.proteinPer100g >= 0 && food.fatPer100g >= 0 && food.carbsPer100g >= 0)).toBe(true);
  });
  it("splits chicken eggs into size categories with piece weights", () => {
    expect(getFood("egg")).toMatchObject({ name: "Яйцо куриное С1", category: "Мясо и рыба", kcalPer100g: 143, pieceWeightG: 55 });
    expect(getFood("egg-c0")).toMatchObject({ name: "Яйцо куриное С0", category: "Мясо и рыба", kcalPer100g: 143, pieceWeightG: 62 });
    expect(getFood("egg-c2")).toMatchObject({ name: "Яйцо куриное С2", category: "Мясо и рыба", kcalPer100g: 143, pieceWeightG: 43 });
  });
  it("calculates a meal entry from grams and kcal per 100 g", () => {
    expect(entryCalories({ id: "entry", date: "2026-08-19", meal: "Перекус", productId: "banana", grams: 150 })).toBe(134);
  });
  it("calculates proteins, fats and carbs for an entry", () => {
    const macros = entryMacros({ id: "entry", date: "2026-08-19", meal: "Перекус", productId: "banana", grams: 100 });
    expect(macros).toEqual({ protein: 0.7, fat: 0.2, carbs: 14 });
  });
  it("resolves entry grams through pieces when the product has a piece weight", () => {
    expect(effectiveEntryGrams({ grams: 100, pieces: 3 }, { pieceWeightG: 55 })).toBe(165);
    expect(effectiveEntryGrams({ grams: 150 }, { pieceWeightG: 55 })).toBe(150);
  });
});
