import { describe, expect, it } from "vitest";
import { previewNutritionCsv } from "../lib/nutrition-import";

describe("nutrition CSV import", () => {
  it("recognizes a common English tracker export with nutrition values", () => {
    const preview = previewNutritionCsv("Date,Meal,Food Name,Grams,Calories,Protein,Fat,Carbs\n2026-08-19,Breakfast,Custom oatmeal,150,180,6,3,33");
    expect(preview.error).toBeUndefined();
    expect(preview.entries).toHaveLength(1);
    expect(preview.entries[0]).toMatchObject({ date: "2026-08-19", meal: "Завтрак", grams: 150 });
    expect(preview.entries[0].customProduct?.proteinPer100g).toBe(4);
  });
  it("skips malformed rows instead of adding them", () => {
    const preview = previewNutritionCsv("Дата;Приём пищи;Продукт;Вес\n19.08.2026;Обед;Рис;200\ninvalid;Ужин;Суп;100");
    expect(preview.entries).toHaveLength(1);
    expect(preview.skipped).toBe(1);
  });
});
