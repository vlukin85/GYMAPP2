import { describe, expect, it } from "vitest";
import { entryCalories, entryMacros, popularFoods } from "../lib/nutrition-data";

describe("nutrition food database", () => {
  it("contains exactly 300 popular foods with calorie values and macronutrients", () => {
    expect(popularFoods).toHaveLength(300);
    expect(popularFoods.every((food) => food.kcalPer100g >= 0 && food.name.length > 0 && food.proteinPer100g >= 0 && food.fatPer100g >= 0 && food.carbsPer100g >= 0)).toBe(true);
  });
  it("calculates a meal entry from grams and kcal per 100 g", () => {
    expect(entryCalories({ id: "entry", date: "2026-08-19", meal: "Перекус", productId: "banana", grams: 150 })).toBe(134);
  });
  it("calculates proteins, fats and carbs for an entry", () => {
    const macros = entryMacros({ id: "entry", date: "2026-08-19", meal: "Перекус", productId: "banana", grams: 100 });
    expect(macros).toEqual({ protein: 0.7, fat: 0.2, carbs: 14 });
  });
});
