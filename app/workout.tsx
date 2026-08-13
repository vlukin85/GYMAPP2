import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { calculateVolume, getExercise, getProgram } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";

type ActualSet = { reps: string; weight: string };

export default function WorkoutScreen() {
  const colors = useColors();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const program = getProgram(programId ?? "upper-strength");
  const { finishWorkout } = useWorkoutStore();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [actualSets, setActualSets] = useState<Record<string, ActualSet[]>>({});
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [draftSets, setDraftSets] = useState<ActualSet[]>([]);
  const [started] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [started]);

  const total = useMemo(() => program?.exercises.reduce((sum, item) => {
    const sets = actualSets[item.exerciseId] ?? [];
    const source = sets.length ? sets : Array.from({ length: item.sets }, () => ({ reps: String(item.reps), weight: String(item.weight) }));
    return sum + source.reduce((setSum, set) => setSum + calculateVolume(Number(set.weight) || 0, Number(set.reps) || 0, 1), 0);
  }, 0) ?? 0, [program, actualSets]);

  if (!program) return null;
  const completed = Object.values(done).filter(Boolean).length;
  const activePlan = program.exercises.find((item) => item.exerciseId === activeExerciseId);
  const activeExercise = activeExerciseId ? getExercise(activeExerciseId) : undefined;

  const openExercise = (exerciseId: string) => {
    const plan = program.exercises.find((item) => item.exerciseId === exerciseId);
    if (!plan) return;
    const saved = actualSets[exerciseId];
    setDraftSets(saved?.length ? saved.map((set) => ({ ...set })) : Array.from({ length: plan.sets }, () => ({ reps: String(plan.reps), weight: String(plan.weight) })));
    setActiveExerciseId(exerciseId);
  };

  const saveExercise = () => {
    if (!activeExerciseId) return;
    setActualSets((current) => ({ ...current, [activeExerciseId]: draftSets }));
    setDone((current) => ({ ...current, [activeExerciseId]: true }));
    setActiveExerciseId(null);
  };

  const updateDraft = (index: number, field: keyof ActualSet, value: string) => {
    setDraftSets((current) => current.map((set, setIndex) => setIndex === index ? { ...set, [field]: value } : set));
  };

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.nav}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.navTitle, { color: colors.foreground }]}>Активная тренировка</Text><Text style={[styles.timer, { color: colors.primary }]}>{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</Text></View>
      <View style={styles.progressRow}><Text style={[styles.programName, { color: colors.foreground }]}>{program.name}</Text><Text style={[styles.progress, { color: colors.muted }]}>{completed}/{program.exercises.length} упражнений</Text></View>
      <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.max(8, (completed / program.exercises.length) * 100)}%` }]} /></View>
      <Text style={[styles.helper, { color: colors.muted }]}>Нажми на упражнение, чтобы открыть таблицу подходов и внести фактический результат.</Text>
      {program.exercises.map((item, index) => {
        const exercise = getExercise(item.exerciseId);
        const isDone = !!done[item.exerciseId];
        const sets = actualSets[item.exerciseId];
        return <Pressable key={item.exerciseId} onPress={() => openExercise(item.exerciseId)} style={({ pressed }) => [styles.exercise, { backgroundColor: colors.surface, borderColor: isDone ? colors.primary : colors.border }, pressed && { opacity: 0.75 }]}>
          <View style={styles.exerciseHeader}><View style={[styles.number, { backgroundColor: isDone ? colors.primary : colors.background }]}><Text style={{ color: isDone ? "#101412" : colors.muted, fontWeight: "800" }}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={[styles.exerciseName, { color: colors.foreground }]}>{exercise?.name}</Text><Text style={[styles.plan, { color: colors.muted }]}>План: {item.sets} подхода × {item.reps} повторов · {item.weight} кг</Text></View><IconSymbol name="chevron.right" size={20} color={colors.muted} /></View>
          <View style={[styles.exerciseSummary, { borderTopColor: colors.border }]}><Text style={[styles.summaryText, { color: isDone ? colors.primary : colors.muted }]}>{isDone ? `${sets?.length ?? item.sets} подхода заполнено` : "Открыть таблицу подходов"}</Text><Text style={[styles.summaryText, { color: colors.muted }]}>{sets ? `${sets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0)} повторов` : "По плану"}</Text></View>
        </Pressable>;
      })}
      <View style={[styles.summary, { backgroundColor: colors.surface }]}><Text style={[styles.summaryLabel, { color: colors.muted }]}>ТЕКУЩИЙ ОБЪЁМ</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{Math.round(total).toLocaleString("ru-RU")} кг</Text></View>
      <Pressable onPress={() => { if (completed < program.exercises.length) { Alert.alert("Не всё заполнено", "Открой каждое упражнение и сохрани фактические подходы перед завершением тренировки.", [{ text: "Понятно" }]); return; } finishWorkout(program.id, total); router.replace("/(tabs)"); }} style={[styles.finish, { backgroundColor: colors.primary }]}><Text style={styles.finishText}>Завершить тренировку</Text><IconSymbol name="checkmark" size={20} color="#101412" /></Pressable>
    </ScrollView>

    <Modal visible={!!activeExerciseId} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveExerciseId(null)}>
      <KeyboardAvoidingView style={[styles.modalRoot, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}><Pressable onPress={() => setActiveExerciseId(null)}><Text style={[styles.cancel, { color: colors.muted }]}>Отмена</Text></Pressable><Text style={[styles.modalTitle, { color: colors.foreground }]}>{activeExercise?.name}</Text><Pressable onPress={saveExercise}><Text style={[styles.save, { color: colors.primary }]}>Готово</Text></Pressable></View>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.modalPlan, { backgroundColor: colors.surface }]}><Text style={[styles.modalPlanLabel, { color: colors.muted }]}>ПЛАН</Text><Text style={[styles.modalPlanValue, { color: colors.foreground }]}>{activePlan?.sets} подхода × {activePlan?.reps} повторов · {activePlan?.weight} кг</Text><Text style={[styles.modalPlanHint, { color: colors.muted }]}>Можно добавить подходы сверх плана</Text></View>
          <View style={styles.tableHeader}><Text style={[styles.columnSet, styles.tableLabel, { color: colors.muted }]}>ПОДХОД №</Text><Text style={[styles.column, styles.tableLabel, { color: colors.muted }]}>ПОВТОРЫ</Text><Text style={[styles.column, styles.tableLabel, { color: colors.muted }]}>ВЕС, КГ</Text></View>
          {draftSets.map((set, index) => <View key={`set-${index}`} style={[styles.tableRow, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.setNumber, { backgroundColor: index < (activePlan?.sets ?? 0) ? colors.primary + "25" : colors.background }]}><Text style={[styles.setNumberText, { color: index < (activePlan?.sets ?? 0) ? colors.primary : colors.muted }]}>{index + 1}</Text></View><TextInput value={set.reps} onChangeText={(value) => updateDraft(index, "reps", value)} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.muted} style={[styles.tableInput, { color: colors.foreground, borderColor: colors.border }]} /><TextInput value={set.weight} onChangeText={(value) => updateDraft(index, "weight", value)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={[styles.tableInput, { color: colors.foreground, borderColor: colors.border }]} /></View>)}
          <Pressable onPress={() => setDraftSets((current) => [...current, { reps: String(activePlan?.reps ?? 0), weight: String(activePlan?.weight ?? 0) }])} style={[styles.addSet, { borderColor: colors.primary }]}><Text style={[styles.addSetText, { color: colors.primary }]}>＋  Добавить подход</Text></Pressable>
          <View style={[styles.modalTotal, { backgroundColor: colors.surface }]}><Text style={[styles.modalTotalLabel, { color: colors.muted }]}>ОБЪЁМ УПРАЖНЕНИЯ</Text><Text style={[styles.modalTotalValue, { color: colors.foreground }]}>{draftSets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0).toLocaleString("ru-RU")} кг</Text></View>
          <Pressable onPress={saveExercise} style={[styles.saveButton, { backgroundColor: colors.primary }]}><Text style={styles.saveButtonText}>Сохранить подходы</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 32, gap: 13 }, nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, navTitle: { fontWeight: "800", fontSize: 16 }, timer: { fontWeight: "800", fontSize: 14 }, progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }, programName: { fontSize: 22, fontWeight: "800" }, progress: { fontSize: 12 }, progressTrack: { height: 7, borderRadius: 8, overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 8 }, helper: { fontSize: 12, lineHeight: 18, marginTop: -3 }, exercise: { borderRadius: 19, borderWidth: 1, padding: 14 }, exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 11 }, number: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" }, exerciseName: { fontSize: 14, fontWeight: "800" }, plan: { fontSize: 11, marginTop: 4, lineHeight: 16 }, exerciseSummary: { borderTopWidth: 1, marginTop: 13, paddingTop: 11, flexDirection: "row", justifyContent: "space-between" }, summaryText: { fontSize: 11, fontWeight: "700" }, summary: { borderRadius: 17, padding: 15 }, summaryLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 }, summaryValue: { fontSize: 25, fontWeight: "800", marginTop: 5 }, finish: { borderRadius: 16, minHeight: 55, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }, finishText: { color: "#101412", fontWeight: "800", fontSize: 15 }, modalRoot: { flex: 1, paddingTop: 10 }, modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: "#88928A", alignSelf: "center", marginBottom: 10 }, modalHeader: { minHeight: 54, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#303A33" }, cancel: { fontSize: 14 }, modalTitle: { fontSize: 15, fontWeight: "800", maxWidth: "55%", textAlign: "center" }, save: { fontSize: 14, fontWeight: "800" }, modalContent: { padding: 18, gap: 13, paddingBottom: 40 }, modalPlan: { borderRadius: 17, padding: 15 }, modalPlanLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 }, modalPlanValue: { fontSize: 16, fontWeight: "800", marginTop: 5 }, modalPlanHint: { fontSize: 12, marginTop: 6 }, tableHeader: { flexDirection: "row", paddingHorizontal: 10, alignItems: "center" }, tableLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }, columnSet: { width: 78 }, column: { flex: 1, textAlign: "center" }, tableRow: { minHeight: 62, borderRadius: 15, borderWidth: 1, padding: 8, flexDirection: "row", alignItems: "center", gap: 9 }, setNumber: { width: 51, height: 43, borderRadius: 12, alignItems: "center", justifyContent: "center" }, setNumberText: { fontSize: 16, fontWeight: "800" }, tableInput: { flex: 1, height: 43, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, textAlign: "center", fontSize: 16, fontWeight: "800" }, addSet: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }, addSetText: { fontWeight: "800", fontSize: 14 }, modalTotal: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, modalTotalLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 }, modalTotalValue: { fontSize: 18, fontWeight: "800" }, saveButton: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" }, saveButtonText: { color: "#101412", fontSize: 15, fontWeight: "800" } });
