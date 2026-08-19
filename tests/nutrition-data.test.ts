import { describe, expect, it } from "vitest";
import { entryCalories, popularFoods } from "../lib/nutrition-data";

describe("nutrition food database", () => {
  it("contains exactly 100 popular foods with calorie values", () => {
    expect(popularFoods).toHaveLength(100);
    expect(popularFoods.every((food) => food.kcalPer100g >= 0 && food.name.length > 0)).toBe(true);
  });
  it("calculates a meal entry from grams and kcal per 100 g", () => {
    expect(entryCalories({ id: "entry", date: "2026-08-19", meal: "Перекус", productId: "banana", grams: 150 })).toBe(134);
  });
});
