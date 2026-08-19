import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FoodEntry, MealType } from "./nutrition-data";

type NutritionStore = { entries: FoodEntry[]; ready: boolean; addEntry: (input: Omit<FoodEntry, "id">) => void; removeEntry: (id: string) => void };
const Context = createContext<NutritionStore | null>(null);
const KEY = "ironrise.nutrition.v1";

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<FoodEntry[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(KEY).then((raw) => { if (raw) setEntries(JSON.parse(raw)); }).catch(() => undefined).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(KEY, JSON.stringify(entries)); }, [entries, ready]);
  const value = useMemo(() => ({ entries, ready, addEntry: (input: Omit<FoodEntry, "id">) => setEntries((current) => [{ ...input, id: `food-${Date.now()}` }, ...current]), removeEntry: (id: string) => setEntries((current) => current.filter((entry) => entry.id !== id)) }), [entries, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useNutritionStore() { const value = useContext(Context); if (!value) throw new Error("NutritionProvider missing"); return value; }
