import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useWorkoutStore } from "@/lib/workout-store";
import { getExercise } from "@/lib/workout-data";
import { groupWorkoutHistoryExercises } from "@/lib/workout-history";

export default function WorkoutHistoryScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { completed, programs } = useWorkoutStore();
  const [loading, setLoading] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    setLoading(true);
    fade.setValue(0);
    const pulseLoop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 0.95, duration: 480, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.45, duration: 480, useNativeDriver: true })]));
    pulseLoop.start();
    const timer = setTimeout(() => { setLoading(false); Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start(); }, 260);
    return () => { clearTimeout(timer); pulseLoop.stop(); };
  }, [fade, id, pulse]);

  if (loading) return <HistorySkeleton colors={colors} pulse={pulse} />;

  const workout = completed.find((item) => item.id === id);
  const exercises = workout ? groupWorkoutHistoryExercises(workout) : [];
  if (!workout) return <ScreenContainer className="px-5"><View style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Тренировка не найдена</Text><Pressable onPress={() => router.back()}><Text style={[styles.link, { color: colors.primary }]}>Вернуться назад</Text></Pressable></View></ScreenContainer>;

  const program = programs.find((item) => item.id === workout.programId);
  const date = new Date(`${workout.date}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5"><Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>Завершённая тренировка</Text><View style={{ width: 27 }} /></View><View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.eyebrow, { color: colors.success }]}>ТОЛЬКО ПРОСМОТР</Text><Text style={[styles.title, { color: colors.foreground }]}>{program?.name ?? "Тренировка"}</Text><Text style={[styles.date, { color: colors.muted }]}>{date}</Text><View style={styles.metrics}><Metric value={`${workout.durationMinutes} мин`} label="длительность" colors={colors} /><Metric value={`${Math.round(workout.totalVolume).toLocaleString("ru-RU")} кг`} label="объём" colors={colors} /><Metric value={String(workout.sets?.length ?? 0)} label="подходов" colors={colors} /></View></View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Упражнения</Text><Text style={[styles.hint, { color: colors.muted }]}>Нажмите упражнение, чтобы посмотреть все фактические подходы.</Text>{exercises.length ? exercises.map((exercise) => { const item = getExercise(exercise.exerciseId); return <Pressable key={exercise.exerciseId} onPress={() => router.push({ pathname: "/workout-history/exercise" as never, params: { workoutId: workout.id, exerciseId: exercise.exerciseId } })} style={({ pressed }) => [styles.exercise, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.exerciseIcon, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name="dumbbell.fill" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.exerciseName, { color: colors.foreground }]}>{item?.name ?? exercise.exerciseId}</Text><Text style={[styles.exerciseMeta, { color: colors.muted }]}>{exercise.sets.length} подходов · {Math.round(exercise.volume).toLocaleString("ru-RU")} кг</Text></View><IconSymbol name="chevron.right" size={18} color={colors.muted} /></Pressable>; }) : <View style={[styles.noSets, { borderColor: colors.border }]}><Text style={{ color: colors.muted }}>В этой тренировке не сохранены подробные подходы.</Text></View>}</ScrollView></Animated.View></ScreenContainer>;
}

function HistorySkeleton({ colors, pulse }: { colors: any; pulse: Animated.Value }) { const tone = `${colors.primary}18`; return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5"><View style={styles.skeletonContent}><View style={styles.skeletonHeader}><Animated.View style={[styles.skeletonCircle, { backgroundColor: tone, opacity: pulse }]} /><Animated.View style={[styles.skeletonTitle, { backgroundColor: tone, opacity: pulse }]} /></View><Animated.View style={[styles.skeletonSummary, { backgroundColor: tone, opacity: pulse }]} />{[0, 1, 2].map((item) => <Animated.View key={item} style={[styles.skeletonExercise, { backgroundColor: tone, opacity: pulse }]} />)}</View></ScreenContainer>; }
function Metric({ value, label, colors }: { value: string; label: string; colors: any }) { return <View><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text></View>; }
const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 32, gap: 12 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { fontSize: 16, fontWeight: "900" }, summary: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 7 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, title: { fontSize: 24, fontWeight: "900" }, date: { fontSize: 12 }, metrics: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 }, metricValue: { fontSize: 14, fontWeight: "900" }, metricLabel: { fontSize: 9, marginTop: 3 }, sectionTitle: { fontSize: 19, fontWeight: "900", marginTop: 4 }, hint: { fontSize: 11, lineHeight: 16, marginTop: -6 }, exercise: { minHeight: 72, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }, exerciseIcon: { width: 39, height: 39, borderRadius: 13, justifyContent: "center", alignItems: "center" }, exerciseName: { fontSize: 14, fontWeight: "900" }, exerciseMeta: { fontSize: 11, marginTop: 4 }, noSets: { borderWidth: 1, borderRadius: 16, padding: 16, alignItems: "center" }, empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }, emptyTitle: { fontSize: 18, fontWeight: "900" }, link: { fontSize: 14, fontWeight: "800" }, skeletonContent: { flex: 1, paddingTop: 18, gap: 13 }, skeletonHeader: { height: 40, flexDirection: "row", alignItems: "center", gap: 14 }, skeletonCircle: { width: 30, height: 30, borderRadius: 15 }, skeletonTitle: { width: 162, height: 17, borderRadius: 8 }, skeletonSummary: { height: 162, borderRadius: 20, marginTop: 5 }, skeletonExercise: { height: 72, borderRadius: 16 } });
