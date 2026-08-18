import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getExercise } from "@/lib/workout-data";
import { filterWorkoutsByStatsFilter, getLatestPersonalRecordsByFilter, type StatsFilterMode } from "@/lib/stats-period";
import { useWorkoutStore } from "@/lib/workout-store";

const periodOptions: { id: StatsFilterMode; label: string }[] = [
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "date", label: "Дата" },
  { id: "custom", label: "Диапазон" },
];

export default function StatsScreen() {
  const colors = useColors();
  const { completed, personalRecords } = useWorkoutStore();
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<StatsFilterMode>("month");
  const [selectedDate, setSelectedDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const filter = useMemo(() => ({ mode: period, date: selectedDate, start: rangeStart, end: rangeEnd }), [period, rangeEnd, rangeStart, selectedDate]);
  const periodWorkouts = useMemo(() => filterWorkoutsByStatsFilter(completed, filter), [completed, filter]);
  const recentRecords = useMemo(() => getLatestPersonalRecordsByFilter(personalRecords, filter), [filter, personalRecords]);
  const volume = periodWorkouts.reduce((sum, item) => sum + item.totalVolume, 0);
  const minutes = periodWorkouts.reduce((sum, item) => sum + item.durationMinutes, 0);
  const periodLabel = period === "date" ? selectedDate : period === "custom" ? `${rangeStart} — ${rangeEnd}` : periodOptions.find((option) => option.id === period)?.label.toLocaleLowerCase("ru") ?? "месяц";

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={styles.topRow}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>АНАЛИЗ ПРОГРЕССА</Text><Text style={[styles.title, { color: colors.foreground }]}>Статистика</Text></View><Pressable onPress={() => router.push("/profile")} style={[styles.settingsButton, { backgroundColor: colors.surface }]}><IconSymbol name="gearshape" size={21} color={colors.foreground} /></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filters, { backgroundColor: colors.surface, borderColor: colors.border }]}>{periodOptions.map((option) => <Pressable key={option.id} onPress={() => setPeriod(option.id)} style={[styles.filter, { minWidth: option.id === "custom" ? 92 : 73, backgroundColor: period === option.id ? colors.primary : "transparent" }]}><Text style={[styles.filterText, { color: period === option.id ? "#101412" : colors.muted }]}>{option.label}</Text></Pressable>)}</ScrollView>
    {period === "date" && <View style={[styles.dateForm, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.dateLabel, { color: colors.muted }]}>КОНКРЕТНАЯ ДАТА</Text><TextInput value={selectedDate} onChangeText={setSelectedDate} placeholder="ГГГГ-ММ-ДД" placeholderTextColor={colors.muted} autoCapitalize="none" style={[styles.dateInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>}
    {period === "custom" && <View style={[styles.dateForm, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.dateLabel, { color: colors.muted }]}>ПОЛЬЗОВАТЕЛЬСКИЙ ДИАПАЗОН</Text><View style={styles.rangeInputs}><TextInput value={rangeStart} onChangeText={setRangeStart} placeholder="ГГГГ-ММ-ДД" placeholderTextColor={colors.muted} autoCapitalize="none" style={[styles.rangeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.rangeDivider, { color: colors.muted }]}>—</Text><TextInput value={rangeEnd} onChangeText={setRangeEnd} placeholder="ГГГГ-ММ-ДД" placeholderTextColor={colors.muted} autoCapitalize="none" style={[styles.rangeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View><Text style={[styles.rangeHint, { color: colors.muted }]}>Даты в формате ГГГГ-ММ-ДД. Границы можно вводить в любом порядке.</Text></View>}
    <View style={styles.bigStats}><Metric icon="dumbbell.fill" iconColor={colors.primary} value={String(periodWorkouts.length)} label="тренировок" colors={colors} /><Metric icon="chart.bar.fill" iconColor="#FF9F43" value={`${(volume / 1000).toFixed(1)}т`} label="общий объём" colors={colors} /><Metric icon="timer" iconColor="#7BE495" value={String(minutes)} label="минут" colors={colors} /></View>
    <View style={styles.sectionRow}><View><Text style={[styles.section, { color: colors.foreground }]}>Личные рекорды</Text><Text style={[styles.hint, { color: colors.muted }]}>Последние зафиксированные или обновлённые за {periodLabel}.</Text></View><Text style={[styles.count, { color: colors.muted }]}>{recentRecords.length}</Text></View>
    {recentRecords.length ? recentRecords.map((record) => {
      const exercise = getExercise(record.exerciseId);
      const date = new Date(record.achievedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      return <View key={record.exerciseId} style={[styles.record, { backgroundColor: colors.surface, borderColor: colors.primary + "66" }]}><View style={[styles.recordIcon, { backgroundColor: colors.primary + "20" }]}><IconSymbol name="trophy" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.recordName, { color: colors.foreground }]}>{exercise?.name ?? record.exerciseId}</Text><Text style={[styles.recordGroup, { color: colors.muted }]}>{exercise?.group ?? "Упражнение"} · обновлён {date}</Text></View><View style={styles.recordValueWrap}><Text style={[styles.recordValue, { color: colors.foreground }]}>{record.weight} кг × {record.reps}</Text><Text style={[styles.oneRm, { color: colors.primary }]}>1RM {record.estimatedOneRepMax.toFixed(1)} кг</Text></View></View>;
    }) : <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="trophy" size={22} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Нет обновлений за этот период</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Завершите тренировку с новым результатом, и он появится здесь.</Text></View>}
  </ScrollView></ScreenContainer>;
}

function Metric({ icon, iconColor, value, label, colors }: { icon: any; iconColor: string; value: string; label: string; colors: any }) { return <View style={[styles.bigCard, { backgroundColor: colors.surface }]}><IconSymbol name={icon} size={20} color={iconColor} /><Text style={[styles.bigValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.bigLabel, { color: colors.muted }]}>{label}</Text></View>; }

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 32, gap: 13 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, settingsButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { fontSize: 30, fontWeight: "800", marginTop: 5 }, filters: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 4, gap: 3 }, filter: { minHeight: 35, borderRadius: 11, paddingHorizontal: 11, alignItems: "center", justifyContent: "center" }, filterText: { fontSize: 12, fontWeight: "800" }, dateForm: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 }, dateLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, dateInput: { minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, fontSize: 14, fontWeight: "800" }, rangeInputs: { flexDirection: "row", alignItems: "center", gap: 6 }, rangeInput: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, fontSize: 12, fontWeight: "800" }, rangeDivider: { fontSize: 16, fontWeight: "900" }, rangeHint: { fontSize: 10, lineHeight: 15 }, bigStats: { flexDirection: "row", gap: 8, marginTop: 4 }, bigCard: { flex: 1, minHeight: 109, borderRadius: 17, padding: 13, justifyContent: "space-between" }, bigValue: { fontSize: 23, fontWeight: "800" }, bigLabel: { fontSize: 11 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 7 }, section: { fontSize: 19, fontWeight: "800" }, hint: { fontSize: 12, lineHeight: 18, marginTop: 3, maxWidth: 270 }, count: { fontSize: 16, fontWeight: "800", marginTop: 4 }, record: { minHeight: 69, borderRadius: 16, borderWidth: 1, padding: 11, flexDirection: "row", alignItems: "center", gap: 11 }, recordIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" }, recordName: { fontSize: 13, fontWeight: "800" }, recordGroup: { fontSize: 11, marginTop: 4 }, recordValueWrap: { alignItems: "flex-end", maxWidth: 104 }, recordValue: { textAlign: "right", fontSize: 12, fontWeight: "800" }, oneRm: { fontSize: 10, fontWeight: "800", marginTop: 4 }, empty: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: "center", gap: 8 }, emptyTitle: { fontSize: 14, fontWeight: "800", marginTop: 2 }, emptyText: { fontSize: 12, lineHeight: 17, textAlign: "center" },
});
