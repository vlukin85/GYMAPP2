import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { mapOpenFoodFactsProduct } from "../lib/open-food-facts";
import { buildWeeklyNutritionReport } from "../lib/nutrition-weekly-report";

const store = readFileSync(resolve(process.cwd(), "lib/nutrition-store.tsx"), "utf8");
const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const nutrition = readFileSync(resolve(process.cwd(), "app/(tabs)/nutrition.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");

describe("nutrition goals, barcode lookup and weekly report", () => {
  it("maps Open Food Facts values per 100 grams without trusting missing products", () => {
    expect(mapOpenFoodFactsProduct("12345678", { status: 1, product: { product_name: "Тестовый продукт", nutriments: { "energy-kcal_100g": 123.4, proteins_100g: 12.5, fat_100g: 4, carbohydrates_100g: 8.8 } } })).toEqual({ name: "Тестовый продукт", barcode: "12345678", kcalPer100g: 123.4, proteinPer100g: 12.5, fatPer100g: 4, carbsPer100g: 8.8 });
    expect(mapOpenFoodFactsProduct("12345678", { status: 0 })).toBeNull();
  });
  it("builds a seven-day report with explicit zero days from local entries", () => {
    const report = buildWeeklyNutritionReport([{ id: "one", date: "2026-08-19", meal: "Завтрак", productId: "custom", grams: 100, customProduct: { id: "custom", name: "Тест", category: "Мои продукты", kcalPer100g: 200, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 20 } }], new Date(2026, 7, 19));
    expect(report).toHaveLength(7);
    expect(report.at(-1)?.calories).toBe(200);
    expect(report.at(-1)?.macros).toEqual({ protein: 10, fat: 5, carbs: 20 });
    expect(report.slice(0, 6).every((point) => point.calories === 0)).toBe(true);
  });
  it("persists personalized macro goals and exposes progress and report navigation", () => {
    expect(store).toContain("dailyMacroGoals");
    expect(store).toContain("setDailyMacroGoals");
    expect(settings).toContain("Дневные цели калорий и БЖУ");
    expect(home).toContain("NutritionProgress");
    expect(nutrition).toContain('router.push("/nutrition-report")');
  });
  it("looks up an unknown barcode before opening the local product form", () => {
    expect(nutrition).toContain("lookupOpenFoodFactsProduct");
    expect(nutrition).toContain("Найдено в Open Food Facts");
  });
});
