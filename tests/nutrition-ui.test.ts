import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const nutrition = readFileSync(resolve(process.cwd(), "app/(tabs)/nutrition.tsx"), "utf8") + readFileSync(resolve(process.cwd(), "lib/i18n/domains/nutrition.ts"), "utf8");
const tabs = readFileSync(resolve(process.cwd(), "app/(tabs)/_layout.tsx"), "utf8");
// Русские подписи экрана настроек живут в словаре домена settings,
// поэтому экран проверяется вместе со своим словарём локализации.
const settings =
  readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8") +
  readFileSync(
    resolve(process.cwd(), "lib/i18n/domains/settings.ts"),
    "utf8",
  );

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
    // Подписи «ОСТАЛОСЬ»/«ПЕРЕБОР» живут в словаре домена nutrition.
    expect(nutrition).toContain(
      'calorieDelta >= 0 ? t("nutrition.total.left") : t("nutrition.total.over")',
    );
    expect(settings).toContain("Плановый калораж за сутки");
    expect(settings).toContain("setDailyCalorieGoal");
  });
  it("shows daily protein, fat, carbohydrates and links to CSV import", () => {
    expect(nutrition).toContain("sumEntryMacros");
    expect(nutrition).toContain("ИМПОРТ CSV");
    expect(nutrition).toContain('t("nutrition.total.macroValue"');
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
  it("lets a user create a local product with calories and macros per 100 grams", () => {
    expect(nutrition).toContain("СОЗДАТЬ СВОЙ ПРОДУКТ");
    expect(nutrition).toContain("ЗНАЧЕНИЯ НА 100 Г");
    expect(nutrition).toContain("СОХРАНИТЬ И ВЫБРАТЬ");
    expect(nutrition).toContain("Мои продукты");
    expect(nutrition).toContain("addCustomProduct");
  });
  it("supports editing, deleting and barcode lookup for custom products", () => {
    expect(nutrition).toContain("ИЗМЕНИТЬ ПРОДУКТ");
    expect(nutrition).toContain("confirmDeleteCustomProduct");
    expect(nutrition).toContain("СКАНИРОВАТЬ ШТРИХКОД");
    expect(nutrition).toContain("CameraView");
    expect(nutrition).toContain("barcodeScannerSettings");
  });
  it("creates and applies reusable meal templates", () => {
    expect(nutrition).toContain("ШАБЛОНЫ БЛЮД");
    expect(nutrition).toContain("СОХРАНИТЬ КАК ШАБЛОН");
    expect(nutrition).toContain("addMealTemplate");
    expect(nutrition).toContain("applyMealTemplate");
  });
  it("uses an SVG circular center instead of a square overlay for macro totals", () => {
    expect(nutrition).toContain('<Circle cx="71" cy="71" r="33"');
    expect(nutrition).toContain("SvgText");
    expect(nutrition).not.toContain("macroDonutCenter,");
  });
  it("allows moving the snack block between lunch gaps", () => {
    expect(nutrition).toContain("PanResponder.create");
    expect(nutrition).toContain("dragGrip");
    expect(nutrition).not.toContain("ПЕРЕТАЩИТЕ МЕЖДУ ПРИЁМАМИ");
    expect(nutrition).toContain("orderedMealTypes");
  });
  it("switches between grams and pieces for products with a piece weight", () => {
    expect(nutrition).toContain("ГРАММЫ");
    expect(nutrition).toContain("ШТУКИ");
    expect(nutrition).toContain("pieceMode");
    expect(nutrition).toContain("pieceWeightG");
    expect(nutrition).toContain("Вес порции, г");
  });
  it("counts pieces with a stepper and a live recalculation", () => {
    expect(nutrition).toContain("pieceStepper");
    expect(nutrition).toContain("pieceCount");
    expect(nutrition).toContain("Добавить одну штуку");
    expect(nutrition).toContain("Убрать одну штуку");
    expect(nutrition).toContain("ккал");
    expect(nutrition).toContain("tabular-nums");
  });
  it("bumps meal entries piece by piece from the meal list", () => {
    expect(nutrition).toContain("updateEntry");
    expect(nutrition).toContain("bumpEntryPieces");
    expect(nutrition).toContain("pieceEntryButton");
  });
  it("adds an optional piece weight to custom products with a per-piece preview", () => {
    expect(nutrition).toContain("Вес одной штуки, г — необязательно");
    expect(nutrition).toContain("В одной штуке:");
    expect(nutrition).toContain("pieceWeightG: customPieceValid ? customPieceWeight : undefined");
  });
  it("offers an optional custom product photo with camera, gallery and crop", () => {
    expect(nutrition).toContain("ФОТО ПРОДУКТА — НЕОБЯЗАТЕЛЬНО");
    expect(nutrition).toContain("Выбрать фото продукта");
    expect(nutrition).toContain("УБРАТЬ ФОТО");
    expect(nutrition).toContain("Из галереи");
    expect(nutrition).toContain("Сделать фото");
    expect(nutrition).toContain("ImageCropSheet");
    expect(nutrition).toContain('scope="food"');
    expect(nutrition).toContain("pickFoodProductPhotoFromLibrary");
    expect(nutrition).toContain("captureFoodProductPhoto");
  });
  it("renders a custom product photo in the catalog and keeps the svg fallback otherwise", () => {
    expect(nutrition).toContain("food.imageUri ? <Image");
    expect(nutrition).toContain('source={{ uri: food.imageUri }}');
    expect(nutrition).toContain("getFoodIllustrationXml(food.id, food.category, food.name)");
    expect(nutrition).toContain(
      'accessibilityLabel={t("nutrition.picker.illustrationA11y", { name: foodName(food, lang) })}',
    );
    expect(nutrition).toContain("imageUri: customPhotoUri ?? undefined");
  });
});
