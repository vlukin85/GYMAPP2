import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const nutrition = readFileSync(resolve(process.cwd(), "app/(tabs)/nutrition.tsx"), "utf8");
const tabs = readFileSync(resolve(process.cwd(), "app/(tabs)/_layout.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");

describe("nutrition journal ui", () => {
  it("shows meals, food search and a calendar on the nutrition tab", () => {
    expect(nutrition).toContain("ПРИЁМЫ ПИЩИ");
    expect(nutrition).toContain("КАЛЕНДАРЬ ПИТАНИЯ");
    expect(nutrition).toContain("Поиск по базе продуктов");
  });
  it("adds a dedicated nutrition main tab", () => expect(tabs).toContain('name="nutrition"'));
  it("adds products directly to a selected meal without closing the picker", () => {
    expect(nutrition).toContain("＋ ДОБАВИТЬ ПРОДУКТЫ");
    expect(nutrition).toContain("ДОБАВИТЬ И ЕЩЁ");
  });
  it("shows a calorie goal delta and exposes its setting", () => {
    expect(nutrition).toContain('calorieDelta >= 0 ? "ОСТАЛОСЬ" : "ПЕРЕБОР"');
    expect(settings).toContain("Плановый калораж за сутки");
    expect(settings).toContain("setDailyCalorieGoal");
  });
  it("shows daily protein, fat, carbohydrates and links to CSV import", () => {
    expect(nutrition).toContain("sumEntryMacros");
    expect(nutrition).toContain("ИМПОРТ CSV");
    expect(nutrition).toContain("Б {dayMacros.protein}г");
  });
  it("keeps product category filters compact", () => {
    expect(nutrition).toContain('alignSelf:"flex-start"');
    expect(nutrition).toContain("flexGrow:0");
    expect(nutrition).toContain("flexShrink:0");
  });
  it("keeps search and filters above the independently scrolling product list", () => {
    expect(nutrition).toContain("<FlatList");
    expect(nutrition).toContain("pickerControls");
    expect(nutrition).toContain("keyboardShouldPersistTaps");
  });
  it("shows a favorites tab and a pie chart for daily macros", () => {
    expect(nutrition).toContain("ИЗБРАННОЕ");
    expect(nutrition).toContain("toggleFavoriteProduct");
    expect(nutrition).toContain("MacroBalanceChart");
    expect(nutrition).toContain("Круговая диаграмма белков, жиров и углеводов");
  });
  it("allows moving the snack block between lunch gaps", () => {
    expect(nutrition).toContain("PanResponder.create");
    expect(nutrition).toContain("dragGrip");
    expect(nutrition).not.toContain("ПЕРЕТАЩИТЕ МЕЖДУ ПРИЁМАМИ");
    expect(nutrition).toContain("orderedMealTypes");
  });
});
