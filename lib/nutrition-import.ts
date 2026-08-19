import { popularFoods, type FoodEntry, type FoodProduct, type MealType } from "./nutrition-data";

export type NutritionImportPreview = { entries: Omit<FoodEntry, "id">[]; skipped: number; error?: string };

const normalize = (value: string) => value.trim().toLocaleLowerCase("ru-RU").replace(/[\s_\-]+/g, " ");
const numeric = (value: string | undefined) => Number((value ?? "").replace(/\s/g, "").replace(",", "."));
const field = (row: Record<string, string>, names: string[]) => names.map((name) => row[normalize(name)]).find(Boolean);

const parseDate = (value: string | undefined) => {
  const raw = (value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const matched = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!matched) return null;
  const [, day, month, year] = matched; const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const parseMeal = (value: string | undefined): MealType => {
  const source = normalize(value ?? "");
  if (/завтрак|breakfast/.test(source)) return "Завтрак";
  if (/обед|lunch/.test(source)) return "Обед";
  if (/ужин|dinner|supper/.test(source)) return "Ужин";
  return "Перекус";
};

const splitCsvLine = (line: string, separator: string) => {
  const cells: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"') { if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted; } else if (char === separator && !quoted) { cells.push(cell.trim()); cell = ""; } else cell += char; }
  cells.push(cell.trim()); return cells;
};

const toProduct = (name: string, kcal: number, protein: number, fat: number, carbs: number): FoodProduct => ({ id: `imported-${normalize(name).replace(/[^а-яёa-z0-9]+/g, "-")}`, name, category: "Импорт", kcalPer100g: kcal, proteinPer100g: protein, fatPer100g: fat, carbsPer100g: carbs });

export function previewNutritionCsv(text: string): NutritionImportPreview {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { entries: [], skipped: 0, error: "Файл не содержит строк дневника." };
  const separator = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = splitCsvLine(lines[0], separator).map(normalize); const entries: Omit<FoodEntry, "id">[] = []; let skipped = 0;
  lines.slice(1).forEach((line) => {
    const cells = splitCsvLine(line, separator); const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    const date = parseDate(field(row, ["date", "дата"])); const name = field(row, ["food name", "food", "product", "название продукта", "продукт", "блюдо"]); const grams = numeric(field(row, ["grams", "gram", "weight", "serving weight", "вес", "граммы", "порция"]));
    if (!date || !name || !Number.isFinite(grams) || grams <= 0) { skipped += 1; return; }
    const byName = popularFoods.find((food) => normalize(food.name) === normalize(name));
    const kcalTotal = numeric(field(row, ["calories", "calorie", "kcal", "ккал", "калории"])); const proteinTotal = numeric(field(row, ["protein", "proteins", "белки"])); const fatTotal = numeric(field(row, ["fat", "fats", "жиры"])); const carbsTotal = numeric(field(row, ["carbs", "carbohydrates", "углеводы"]));
    const matched = byName ?? undefined; const customProduct = matched ? undefined : toProduct(name, Number.isFinite(kcalTotal) ? kcalTotal * 100 / grams : 0, Number.isFinite(proteinTotal) ? proteinTotal * 100 / grams : 0, Number.isFinite(fatTotal) ? fatTotal * 100 / grams : 0, Number.isFinite(carbsTotal) ? carbsTotal * 100 / grams : 0);
    entries.push({ date, meal: parseMeal(field(row, ["meal", "meal name", "приём пищи", "прием пищи", "категория"])), productId: matched?.id ?? customProduct?.id ?? `imported-${entries.length}`, grams, customProduct });
  });
  return { entries, skipped, error: entries.length ? undefined : "Не удалось распознать дату, продукт и вес порции." };
}

export const nutritionEntryFingerprint = (entry: Omit<FoodEntry, "id"> | FoodEntry) => `${entry.date}|${entry.meal}|${entry.productId}|${entry.grams}|${entry.customProduct?.name ?? ""}`;
