import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { bestOneRepMax, exercises, getExerciseHistory } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";
import { trpc } from "@/lib/trpc";

export default function ProgressScreen() {
  const colors = useColors();
  const { oneRmFormula } = useWorkoutStore();
  const [exerciseId, setExerciseId] = useState("bench-press");
  const exercise = exercises.find((item) => item.id === exerciseId) ?? exercises[0];
  const historyQuery = trpc.workoutHistory.byExercise.useQuery({ exerciseId });
  const points = useMemo(() => {
    const grouped = new Map<number, { date: string; sets: { weight: number; reps: number }[] }>();
    (historyQuery.data ?? []).forEach((row) => { const entry = grouped.get(row.sessionId) ?? { date: new Date(row.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }).replace(".", ""), sets: [] }; entry.sets.push({ weight: row.weightCentiKg / 100, reps: row.reps }); grouped.set(row.sessionId, entry); });
    const remote = Array.from(grouped.values()).reverse().map((entry) => ({ date: entry.date, value: bestOneRepMax(entry.sets, oneRmFormula) }));
    return remote.length ? remote : getExerciseHistory(exercise.id).slice().reverse().map((entry) => ({ date: entry.date, value: bestOneRepMax(entry.sets, oneRmFormula) }));
  }, [historyQuery.data, exercise.id, oneRmFormula]);
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0); const max = Math.max(...values, 1); const width = 310; const height = 170; const padding = 24;
  const coordinates = points.map((point, index) => ({ x: padding + (points.length === 1 ? 0 : index * ((width - padding * 2) / (points.length - 1))), y: height - padding - ((point.value - min) / Math.max(1, max - min)) * (height - padding * 2), ...point }));
  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>Прогресс 1RM</Text><View style={{ width: 27 }} /></View><Text style={[styles.eyebrow, { color: colors.primary }]}>СИЛОВОЙ ПРОГРЕСС</Text><Text style={[styles.title, { color: colors.foreground }]}>{exercise.name}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{exercises.filter((item) => getExerciseHistory(item.id).length > 0).map((item) => <Pressable key={item.id} onPress={() => setExerciseId(item.id)} style={[styles.tab, { backgroundColor: item.id === exercise.id ? colors.primary : colors.surface }]}><Text style={{ color: item.id === exercise.id ? "#101412" : colors.foreground, fontSize: 12, fontWeight: "800" }}>{item.name}</Text></Pressable>)}</ScrollView><View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{points.length > 1 ? <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke={colors.border} strokeWidth="1" /><Line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke={colors.border} strokeWidth="1" /><Polyline points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={colors.primary} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{coordinates.map((point) => <Circle key={point.date} cx={point.x} cy={point.y} r="5" fill={colors.primary} />)}</Svg> : <Text style={[styles.empty, { color: colors.muted }]}>Недостаточно записей для графика.</Text>}<View style={styles.axis}>{points.map((point) => <Text key={point.date} style={[styles.axisLabel, { color: colors.muted }]}>{point.date}</Text>)}</View></View><View style={[styles.summary, { backgroundColor: colors.primary }]}><Text style={styles.summaryLabel}>ТЕКУЩИЙ ЛУЧШИЙ 1RM</Text><Text style={styles.summaryValue}>{Math.max(0, ...values).toFixed(1)} кг</Text><Text style={styles.summaryHint}>Формула {oneRmFormula === "epley" ? "Эпли" : "Бржицки"}</Text></View></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 34, gap: 13 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { fontSize: 16, fontWeight: "800" }, eyebrow: { marginTop: 14, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 25, fontWeight: "800", marginTop: 4 }, tabs: { gap: 8, paddingVertical: 5 }, tab: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 13, maxWidth: 168 }, chartCard: { borderWidth: 1, borderRadius: 18, padding: 14 }, axis: { flexDirection: "row", justifyContent: "space-between", gap: 6 }, axisLabel: { fontSize: 10 }, empty: { height: 170, textAlign: "center", textAlignVertical: "center" }, summary: { borderRadius: 18, padding: 16 }, summaryLabel: { color: "#101412", fontSize: 10, letterSpacing: 1, fontWeight: "900" }, summaryValue: { color: "#101412", fontSize: 29, fontWeight: "900", marginTop: 6 }, summaryHint: { color: "#101412AA", fontSize: 12, marginTop: 4 } });
