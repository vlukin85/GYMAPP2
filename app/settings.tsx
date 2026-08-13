import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { type OneRepMaxFormula } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";

const options: { id: OneRepMaxFormula; title: string; formula: string; description: string }[] = [
  { id: "epley", title: "Эпли", formula: "Вес × (1 + повторы / 30)", description: "Подходит для большинства рабочих подходов до 10–12 повторений." },
  { id: "brzycki", title: "Бржицки", formula: "Вес × 36 / (37 − повторы)", description: "Часто используют для оценки максимума на небольшом числе повторений." },
];

export default function SettingsScreen() {
  const colors = useColors();
  const { oneRmFormula, setOneRmFormula } = useWorkoutStore();
  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background"><View style={styles.header}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>Настройки</Text><View style={{ width: 27 }} /></View><Text style={[styles.eyebrow, { color: colors.primary }]}>РАСЧЁТ СИЛЫ</Text><Text style={[styles.title, { color: colors.foreground }]}>Формула 1RM</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Выбранный метод применяется к текущим подходам, истории и личным рекордам.</Text><View style={styles.options}>{options.map((option) => { const selected = option.id === oneRmFormula; return <Pressable key={option.id} onPress={() => setOneRmFormula(option.id)} style={({ pressed }) => [styles.option, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }, pressed && { opacity: 0.72 }]}><View style={[styles.radio, { borderColor: selected ? colors.primary : colors.muted }]}>{selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}</View><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{option.title}</Text><Text style={[styles.optionFormula, { color: colors.primary }]}>{option.formula}</Text><Text style={[styles.optionDescription, { color: colors.muted }]}>{option.description}</Text></View></Pressable>; })}</View><View style={[styles.note, { backgroundColor: colors.surface }]}><IconSymbol name="lightbulb" size={20} color={colors.primary} /><Text style={[styles.noteText, { color: colors.muted }]}>1RM — это ориентировочная оценка. Используйте её для планирования нагрузки, а не как обязательный тест максимального веса.</Text></View></ScreenContainer>;
}

const styles = StyleSheet.create({ header: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { fontSize: 16, fontWeight: "800" }, eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginTop: 14 }, title: { fontSize: 30, fontWeight: "800", marginTop: 7 }, subtitle: { fontSize: 13, lineHeight: 20, marginTop: 8 }, options: { gap: 11, marginTop: 24 }, option: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: "row", gap: 12 }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 }, radioDot: { width: 11, height: 11, borderRadius: 6 }, optionTitle: { fontSize: 16, fontWeight: "800" }, optionFormula: { fontSize: 12, fontWeight: "800", marginTop: 5 }, optionDescription: { fontSize: 12, lineHeight: 18, marginTop: 7 }, note: { borderRadius: 16, padding: 14, flexDirection: "row", gap: 10, marginTop: 18 }, noteText: { flex: 1, fontSize: 12, lineHeight: 18 } });
