import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FoodEntry, MealType } from "./nutrition-data";

type NutritionStore = { entries: FoodEntry[]; dailyCalorieGoal: number; ready: boolean; addEntry: (input: Omit<FoodEntry, "id">) => void; removeEntry: (id: string) => void; setDailyCalorieGoal: (goal: number) => void };
const Context = createContext<NutritionStore | null>(null);
const KEY = "ironrise.nutrition.v1";

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<FoodEntry[]>([]); const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2200); const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(KEY).then((raw) => { if (!raw) return; const parsed = JSON.parse(raw) as FoodEntry[] | { entries?: FoodEntry[]; dailyCalorieGoal?: number }; if (Array.isArray(parsed)) setEntries(parsed); else { setEntries(parsed.entries ?? []); if (Number.isFinite(parsed.dailyCalorieGoal) && (parsed.dailyCalorieGoal ?? 0) > 0) setDailyCalorieGoal(parsed.dailyCalorieGoal!); } }).catch(() => undefined).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(KEY, JSON.stringify({ entries, dailyCalorieGoal })); }, [entries, dailyCalorieGoal, ready]);
  const value = useMemo(() => ({ entries, dailyCalorieGoal, ready, addEntry: (input: Omit<FoodEntry, "id">) => setEntries((current) => [{ ...input, id: `food-${Date.now()}` }, ...current]), removeEntry: (id: string) => setEntries((current) => current.filter((entry) => entry.id !== id)), setDailyCalorieGoal: (goal: number) => setDailyCalorieGoal(Math.max(1, Math.round(goal))) }), [entries, dailyCalorieGoal, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useNutritionStore() { const value = useContext(Context); if (!value) throw new Error("NutritionProvider missing"); return value; }
