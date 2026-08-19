import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const store = readFileSync(resolve(process.cwd(), "lib/nutrition-store.tsx"), "utf8");

describe("nutrition snack position", () => {
  it("persists the selected snack position with the nutrition diary", () => {
    expect(store).toContain("snackPosition");
    expect(store).toContain("setSnackPosition");
  });
  it("persists favorite product ids with the local nutrition diary", () => {
    expect(store).toContain("favoriteProductIds");
    expect(store).toContain("toggleFavoriteProduct");
  });
  it("persists custom products with their nutrition values", () => {
    expect(store).toContain("customProducts");
    expect(store).toContain("addCustomProduct");
  });
  it("persists meal templates and exposes local product maintenance actions", () => {
    expect(store).toContain("mealTemplates");
    expect(store).toContain("addMealTemplate");
    expect(store).toContain("updateCustomProduct");
    expect(store).toContain("deleteCustomProduct");
  });
});
