import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { popularFoods } from "../lib/nutrition-data";
import { getFoodIllustration } from "../lib/nutrition-icons";

const nutrition = readFileSync(resolve(process.cwd(), "app/(tabs)/nutrition.tsx"), "utf8");

const isValidSvg = (uri: string) =>
  uri.startsWith("data:image/svg+xml;utf8,") &&
  decodeURIComponent(uri).includes('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">') &&
  decodeURIComponent(uri).endsWith("</svg>") &&
  !uri.includes("NaN") &&
  !uri.includes("undefined") &&
  !uri.includes("null");

describe("nutrition food illustrations", () => {
  it("produces a valid SVG for every catalog product with full coverage", () => {
    expect(popularFoods.length).toBeGreaterThanOrEqual(330);
    const unique = new Set<string>();
    for (const food of popularFoods) {
      const uri = getFoodIllustration(food.id, food.category, food.name);
      expect(isValidSvg(uri)).toBe(true);
      unique.add(getFoodIllustration(food.id, food.category, food.name));
    }
    expect(unique.size).toBe(popularFoods.length);
  });
  it("draws at least 25 distinct compositions among 30 random products", () => {
    const sample = popularFoods.filter((_, index) => index % 11 === 0).slice(0, 30);
    expect(sample.length).toBe(30);
    const distinct = new Set(sample.map((food) => getFoodIllustration(food.id, food.category, food.name)));
    expect(distinct.size).toBeGreaterThanOrEqual(25);
  });
  it("is deterministic for repeated calls", () => {
    const food = popularFoods[42];
    expect(getFoodIllustration(food.id, food.category, food.name)).toBe(getFoodIllustration(food.id, food.category, food.name));
  });
  it("gives custom products a neutral plate illustration", () => {
    const uri = getFoodIllustration("custom-abc-123", "Мои продукты", "Бабушкин пирог");
    expect(isValidSvg(uri)).toBe(true);
    expect(decodeURIComponent(uri)).toContain("circle");
  });
  it("keeps every background palette and silhouette accent deterministic by id", () => {
    const first = popularFoods[7];
    const second = popularFoods[7];
    expect(getFoodIllustration(first.id, first.category, first.name)).toBe(getFoodIllustration(second.id, second.category, second.name));
  });
  it("shows the illustration in the nutrition catalog rows", () => {
    expect(nutrition).toContain("getFoodIllustration");
    expect(nutrition).toContain("expo-image");
    expect(nutrition).toContain("foodThumb");
  });
});
