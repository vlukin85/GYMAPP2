import { entryCalories, sumEntryMacros, type FoodEntry, type NutritionMacros } from "./nutrition-data";

export type WeeklyNutritionPoint = { date: string; label: string; calories: number; macros: NutritionMacros };

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function buildWeeklyNutritionReport(entries: FoodEntry[], endDate = new Date()): WeeklyNutritionPoint[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - 6 + index);
    const key = localDateKey(date);
    const dayEntries = entries.filter((entry) => entry.date === key);
    return { date: key, label: date.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "").toUpperCase(), calories: dayEntries.reduce((sum, entry) => sum + entryCalories(entry), 0), macros: sumEntryMacros(dayEntries) };
  });
}
