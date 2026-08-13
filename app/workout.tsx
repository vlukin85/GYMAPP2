import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { bestOneRepMax, calculateVolume, getExercise, getExerciseHistory, getLoadZones, getProgram } from "@/lib/workout-data";
import { trpc } from "@/lib/trpc";
import { useWorkoutStore } from "@/lib/workout-store";

type ActualSet = { reps: string; weight: string };

export default function WorkoutScreen() {
  const colors = useColors();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const program = getProgram(programId ?? "upper-strength");
  const { finishWorkout, oneRmFormula } = useWorkoutStore();
  const saveMutation = trpc.workoutHistory.save.useMutation();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [actualSets, setActualSets] = useState<Record<string, ActualSet[]>>({});
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [draftSets, setDraftSets] = useState<ActualSet[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [restVisible, setRestVisible] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [started] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (!restVisible || restRemaining <= 0) { if (restVisible && restRemaining <= 0) setRestVisible(false); return; }
    const timer = setInterval(() => setRestRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [restVisible, restRemaining]);

  const total = useMemo(() => program?.exercises.reduce((sum, item) => {
    const sets = actualSets[item.exerciseId] ?? Array.from({ length: item.sets }, () => ({ reps: String(item.reps), weight: String(item.weight) }));
    return sum + sets.reduce((setSum, set) => setSum + calculateVolume(Number(set.weight) || 0, Number(set.reps) || 0, 1), 0);
  }, 0) ?? 0, [program, actualSets]);

  const remoteHistoryQuery = trpc.workoutHistory.byExercise.useQuery({ exerciseId: activeExerciseId ?? "" }, { enabled: Boolean(activeExerciseId) });
  const remoteHistory = useMemo(() => {
    const grouped = new Map<number, { id: string; date: string; sets: { weight: number; reps: number }[]; volume: number }>();
    (remoteHistoryQuery.data ?? []).forEach((row) => {
      const entry = grouped.get(row.sessionId) ?? { id: `remote-${row.sessionId}`, date: new Date(row.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }).replace(".", ""), sets: [], volume: 0 };
      entry.sets.push({ weight: row.weightCentiKg / 100, reps: row.reps });
      entry.volume += row.volumeCentiKg / 100;
      grouped.set(row.sessionId, entry);
    });
    return Array.from(grouped.values());
  }, [remoteHistoryQuery.data]);

  if (!program) return null;
  const activePlan = program.exercises.find((item) => item.exerciseId === activeExerciseId);
  const activeExercise = activeExerciseId ? getExercise(activeExerciseId) : undefined;
  const fallbackHistory = activeExerciseId ? getExerciseHistory(activeExerciseId).map((entry, index) => ({ ...entry, id: `sample-${index}` })) : [];
  const historyEntries = (remoteHistory.length ? remoteHistory : fallbackHistory).map((entry) => ({ ...entry, oneRm: bestOneRepMax(entry.sets, oneRmFormula) }));
  const currentOneRm = bestOneRepMax(draftSets.map((set) => ({ weight: Number(set.weight) || 0, reps: Number(set.reps) || 0 })), oneRmFormula);
  const completed = Object.values(done).filter(Boolean).length;

  const openExercise = (exerciseId: string) => {
    const plan = program.exercises.find((item) => item.exerciseId === exerciseId);
    if (!plan) return;
    const saved = actualSets[exerciseId];
    setDraftSets(saved?.length ? saved.map((set) => ({ ...set })) : Array.from({ length: plan.sets }, () => ({ reps: String(plan.reps), weight: String(plan.weight) })));
    setExpandedHistory(null);
    setActiveExerciseId(exerciseId);
  };

  const updateSet = (index: number, field: keyof ActualSet, value: string) => setDraftSets((sets) => sets.map((set, setIndex) => setIndex === index ? { ...set, [field]: value } : set));

  const saveExercise = () => {
    if (!activeExerciseId) return;
    setActualSets((current) => ({ ...current, [activeExerciseId]: draftSets }));
    setDone((current) => ({ ...current, [activeExerciseId]: true }));
    setActiveExerciseId(null);
    const rest = activePlan?.rest ?? 90;
    setRestRemaining(rest);
    setRestTotal(rest);
    setRestVisible(true);
  };

  const completeWorkout = async () => {
    if (completed < program.exercises.length) {
      Alert.alert("Не всё заполнено", "Сохрани фактические подходы по каждому упражнению перед завершением тренировки.");
      return;
    }
    const sets = program.exercises.flatMap((item) => (actualSets[item.exerciseId] ?? []).map((set, index) => ({ exerciseId: item.exerciseId, setNumber: index + 1, reps: Number(set.reps) || 0, weightKg: Number(set.weight) || 0 })));
    try {
      await saveMutation.mutateAsync({ programId: program.id, durationMinutes: Math.max(1, Math.ceil(elapsed / 60)), sets });
      const result = finishWorkout(program.id, total, sets.map((set) => ({ exerciseId: set.exerciseId, reps: set.reps, weight: set.weightKg })));
      if (result.newRecordIds.length) Alert.alert("Новый личный рекорд", `Обновлено рекордов: ${result.newRecordIds.length}`, [{ text: "К статистике", onPress: () => router.replace("/(tabs)/stats") }]);
      else router.replace("/(tabs)");
    } catch {
      Alert.alert("Не удалось сохранить", "Проверь подключение к серверу. Тренировка пока не завершена.");
    }
  };

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.nav}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.navTitle, { color: colors.foreground }]}>Активная тренировка</Text><Text style={[styles.timer, { color: colors.primary }]}>{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</Text></View>
      <View style={styles.progressRow}><Text style={[styles.programName, { color: colors.foreground }]}>{program.name}</Text><Text style={[styles.progress, { color: colors.muted }]}>{completed}/{program.exercises.length}</Text></View>
      <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.max(8, (completed / program.exercises.length) * 100)}%` }]} /></View>
      <Text style={[styles.helper, { color: colors.muted }]}>Нажми на упражнение, чтобы внести фактические подходы и увидеть зоны нагрузки.</Text>
      {program.exercises.map((item, index) => { const exercise = getExercise(item.exerciseId); const isDone = Boolean(done[item.exerciseId]); const sets = actualSets[item.exerciseId]; return <Pressable key={item.exerciseId} onPress={() => openExercise(item.exerciseId)} style={({ pressed }) => [styles.exercise, { backgroundColor: colors.surface, borderColor: isDone ? colors.primary : colors.border }, pressed && { opacity: 0.72 }]}><View style={styles.exerciseHeader}><View style={[styles.number, { backgroundColor: isDone ? colors.primary : colors.background }]}><Text style={{ color: isDone ? "#101412" : colors.muted, fontWeight: "800" }}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={[styles.exerciseName, { color: colors.foreground }]}>{exercise?.name}</Text><Text style={[styles.plan, { color: colors.muted }]}>План: {item.sets} × {item.reps} · {item.weight} кг</Text></View><IconSymbol name="chevron.right" size={20} color={colors.muted} /></View><View style={[styles.exerciseSummary, { borderTopColor: colors.border }]}><Text style={[styles.summaryText, { color: isDone ? colors.primary : colors.muted }]}>{isDone ? `${sets?.length ?? item.sets} подхода сохранено` : "Открыть подходы"}</Text><Text style={[styles.summaryText, { color: colors.muted }]}>{sets ? `${sets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0)} повторов` : "По плану"}</Text></View></Pressable>; })}
      <View style={[styles.summary, { backgroundColor: colors.surface }]}><Text style={[styles.summaryLabel, { color: colors.muted }]}>ТЕКУЩИЙ ОБЪЁМ</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{Math.round(total).toLocaleString("ru-RU")} кг</Text></View>
      <Pressable disabled={saveMutation.isPending} onPress={completeWorkout} style={[styles.finish, { backgroundColor: colors.primary, opacity: saveMutation.isPending ? 0.6 : 1 }]}><Text style={styles.finishText}>{saveMutation.isPending ? "Сохраняем…" : "Завершить тренировку"}</Text><IconSymbol name="checkmark" size={20} color="#101412" /></Pressable>
    </ScrollView>
    {restVisible && <View style={[styles.restBanner, { backgroundColor: colors.surface, borderColor: colors.primary }]}><View style={styles.restTop}><View><Text style={[styles.restEyebrow, { color: colors.primary }]}>ОТДЫХ</Text><Text style={[styles.restTitle, { color: colors.foreground }]}>Восстановись перед следующим подходом</Text></View><Text style={[styles.restTime, { color: colors.primary }]}>{String(Math.floor(restRemaining / 60)).padStart(2, "0")}:{String(restRemaining % 60).padStart(2, "0")}</Text></View><View style={[styles.restTrack, { backgroundColor: colors.background }]}><View style={[styles.restFill, { backgroundColor: colors.primary, width: `${restTotal ? (restRemaining / restTotal) * 100 : 0}%` }]} /></View><View style={styles.restActions}><Pressable onPress={() => setRestRemaining((value) => value + 30)} style={[styles.restSecondary, { borderColor: colors.border }]}><Text style={[styles.restSecondaryText, { color: colors.foreground }]}>+30 сек</Text></Pressable><Pressable onPress={() => setRestVisible(false)} style={[styles.restPrimary, { backgroundColor: colors.primary }]}><Text style={styles.restPrimaryText}>Пропустить</Text></Pressable></View></View>}
    <Modal visible={Boolean(activeExerciseId)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveExerciseId(null)}><KeyboardAvoidingView style={[styles.modalRoot, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.modalHandle} /><View style={[styles.modalHeader, { borderBottomColor: colors.border }]}><Pressable onPress={() => setActiveExerciseId(null)}><Text style={[styles.cancel, { color: colors.muted }]}>Отмена</Text></Pressable><Text style={[styles.modalTitle, { color: colors.foreground }]}>{activeExercise?.name}</Text><Pressable onPress={saveExercise}><Text style={[styles.save, { color: colors.primary }]}>Готово</Text></Pressable></View><ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled"><View style={[styles.modalPlan, { backgroundColor: colors.surface }]}><Text style={[styles.modalPlanLabel, { color: colors.muted }]}>ПЛАН</Text><Text style={[styles.modalPlanValue, { color: colors.foreground }]}>{activePlan?.sets} × {activePlan?.reps} · {activePlan?.weight} кг</Text></View><View style={[styles.oneRmCard, { backgroundColor: colors.primary }]}><View><Text style={styles.oneRmLabel}>ПРЕДПОЛАГАЕМЫЙ 1RM</Text><Text style={styles.oneRmHint}>Формула: {oneRmFormula === "epley" ? "Эпли" : "Бржицки"}</Text></View><Text style={styles.oneRmValue}>{currentOneRm.toFixed(1)} кг</Text></View><View style={styles.zoneSection}><Text style={[styles.zoneTitle, { color: colors.foreground }]}>Целевые зоны нагрузки</Text><View style={styles.zoneRow}>{getLoadZones(currentOneRm).map((zone) => <View key={zone.percent} style={[styles.zoneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.zonePercent, { color: colors.primary }]}>{zone.percent}%</Text><Text style={[styles.zoneWeight, { color: colors.foreground }]}>{zone.weight.toFixed(1)} кг</Text></View>)}</View></View><View style={styles.historyHeader}><Text style={[styles.historyTitle, { color: colors.foreground }]}>Прошлые результаты</Text><Text style={[styles.historyHint, { color: colors.muted }]}>Нажми на дату, чтобы раскрыть подходы</Text></View>{historyEntries.length ? <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{historyEntries.map((entry) => { const expanded = expandedHistory === entry.id; return <View key={entry.id} style={[styles.historyEntry, { borderBottomColor: colors.border }]}><Pressable onPress={() => setExpandedHistory(expanded ? null : entry.id)} style={styles.historyRow}><View style={styles.historyDate}><Text style={[styles.historyDateText, { color: colors.foreground }]}>{entry.date}</Text><Text style={[styles.historyVolume, { color: colors.muted }]}>{entry.volume.toLocaleString("ru-RU")} кг · 1RM {entry.oneRm.toFixed(1)}</Text></View><Text style={[styles.historyPreview, { color: colors.foreground }]}>{entry.sets[0]?.weight} × {entry.sets[0]?.reps} {entry.sets.length > 1 ? `+ ${entry.sets.length - 1}` : ""}</Text><IconSymbol name={expanded ? "chevron.down" : "chevron.right"} size={18} color={colors.muted} /></Pressable>{expanded && <View style={[styles.historyDetails, { borderTopColor: colors.border }]}>{entry.sets.map((set, index) => <View key={`${entry.id}-${index}`} style={styles.detailRow}><Text style={[styles.detailIndex, { color: colors.muted }]}>{index + 1}</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{set.reps} повт.</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{set.weight} кг</Text></View>)}</View>}</View>; })}</View> : <View style={[styles.historyEmpty, { backgroundColor: colors.surface }]}><Text style={[styles.historyEmptyText, { color: colors.muted }]}>Это первое зафиксированное выполнение</Text></View>}<View style={styles.tableHeader}><Text style={[styles.columnSet, styles.tableLabel, { color: colors.muted }]}>ПОДХОД</Text><Text style={[styles.column, styles.tableLabel, { color: colors.muted }]}>ПОВТОРЫ</Text><Text style={[styles.column, styles.tableLabel, { color: colors.muted }]}>ВЕС</Text></View>{draftSets.map((set, index) => <View key={`set-${index}`} style={[styles.tableRow, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.setNumber, { backgroundColor: colors.primary + "22" }]}><Text style={[styles.setNumberText, { color: colors.primary }]}>{index + 1}</Text></View><TextInput value={set.reps} onChangeText={(value) => updateSet(index, "reps", value)} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.muted} style={[styles.tableInput, { color: colors.foreground, borderColor: colors.border }]} /><TextInput value={set.weight} onChangeText={(value) => updateSet(index, "weight", value)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={[styles.tableInput, { color: colors.foreground, borderColor: colors.border }]} /></View>)}<Pressable onPress={() => setDraftSets((sets) => [...sets, { reps: String(activePlan?.reps ?? 0), weight: String(activePlan?.weight ?? 0) }])} style={[styles.addSet, { borderColor: colors.primary }]}><Text style={[styles.addSetText, { color: colors.primary }]}>＋ Добавить подход</Text></Pressable><View style={[styles.modalTotal, { backgroundColor: colors.surface }]}><Text style={[styles.modalPlanLabel, { color: colors.muted }]}>ОБЪЁМ УПРАЖНЕНИЯ</Text><Text style={[styles.modalTotalValue, { color: colors.foreground }]}>{draftSets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0).toLocaleString("ru-RU")} кг</Text></View><Pressable onPress={saveExercise} style={[styles.saveButton, { backgroundColor: colors.primary }]}><Text style={styles.saveButtonText}>Сохранить подходы</Text></Pressable></ScrollView></KeyboardAvoidingView></Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 32, gap: 13 }, nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, navTitle: { fontSize: 16, fontWeight: "800" }, timer: { fontSize: 14, fontWeight: "800" }, progressRow: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, programName: { fontSize: 22, fontWeight: "800" }, progress: { fontSize: 12 }, progressTrack: { height: 7, borderRadius: 7, overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 7 }, helper: { fontSize: 12, lineHeight: 18 }, exercise: { borderRadius: 18, borderWidth: 1, padding: 14 }, exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 11 }, number: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" }, exerciseName: { fontSize: 14, fontWeight: "800" }, plan: { fontSize: 11, marginTop: 4 }, exerciseSummary: { marginTop: 13, paddingTop: 11, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between" }, summaryText: { fontSize: 11, fontWeight: "700" }, summary: { borderRadius: 17, padding: 15 }, summaryLabel: { fontSize: 10, letterSpacing: 1, fontWeight: "800" }, summaryValue: { fontSize: 25, fontWeight: "800", marginTop: 5 }, finish: { minHeight: 55, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 }, finishText: { color: "#101412", fontSize: 15, fontWeight: "800" }, restBanner: { position: "absolute", left: 18, right: 18, bottom: 18, borderRadius: 20, borderWidth: 1, padding: 15, elevation: 8 }, restTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }, restEyebrow: { fontSize: 10, letterSpacing: 1, fontWeight: "900" }, restTitle: { fontSize: 13, fontWeight: "800", marginTop: 4 }, restTime: { fontSize: 28, fontWeight: "900" }, restTrack: { height: 6, borderRadius: 6, overflow: "hidden", marginTop: 14 }, restFill: { height: "100%" }, restActions: { marginTop: 12, flexDirection: "row", gap: 8 }, restSecondary: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" }, restSecondaryText: { fontSize: 13, fontWeight: "800" }, restPrimary: { flex: 2, minHeight: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" }, restPrimaryText: { color: "#101412", fontSize: 13, fontWeight: "800" }, modalRoot: { flex: 1, paddingTop: 10 }, modalHandle: { width: 42, height: 5, borderRadius: 3, alignSelf: "center", backgroundColor: "#88928A", marginBottom: 10 }, modalHeader: { minHeight: 54, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 }, cancel: { fontSize: 14 }, modalTitle: { maxWidth: "55%", textAlign: "center", fontSize: 15, fontWeight: "800" }, save: { fontSize: 14, fontWeight: "800" }, modalContent: { padding: 18, gap: 13, paddingBottom: 40 }, modalPlan: { borderRadius: 17, padding: 15 }, modalPlanLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 }, modalPlanValue: { fontSize: 16, fontWeight: "800", marginTop: 5 }, oneRmCard: { borderRadius: 17, padding: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, oneRmLabel: { color: "#101412", fontSize: 10, letterSpacing: 0.8, fontWeight: "900" }, oneRmHint: { color: "#101412AA", fontSize: 11, marginTop: 4 }, oneRmValue: { color: "#101412", fontSize: 25, fontWeight: "900" }, zoneSection: { gap: 8 }, zoneTitle: { fontSize: 16, fontWeight: "800" }, zoneRow: { flexDirection: "row", gap: 8 }, zoneCard: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 11, alignItems: "center", gap: 4 }, zonePercent: { fontSize: 13, fontWeight: "900" }, zoneWeight: { fontSize: 13, fontWeight: "800" }, historyHeader: { gap: 3, marginTop: 2 }, historyTitle: { fontSize: 18, fontWeight: "800" }, historyHint: { fontSize: 12 }, historyCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 13 }, historyEntry: { borderBottomWidth: 1 }, historyRow: { minHeight: 61, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 }, historyDate: { width: 142 }, historyDateText: { fontSize: 13, fontWeight: "800" }, historyVolume: { fontSize: 10, marginTop: 3 }, historyPreview: { flex: 1, fontSize: 11, fontWeight: "800" }, historyDetails: { borderTopWidth: 1, paddingVertical: 8 }, detailRow: { flexDirection: "row", paddingHorizontal: 9, paddingVertical: 5 }, detailIndex: { width: 62, fontSize: 12, fontWeight: "700" }, detailValue: { flex: 1, fontSize: 12, fontWeight: "700" }, historyEmpty: { borderRadius: 16, padding: 14 }, historyEmptyText: { fontSize: 12 }, tableHeader: { flexDirection: "row", paddingHorizontal: 10 }, tableLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }, columnSet: { width: 70 }, column: { flex: 1, textAlign: "center" }, tableRow: { minHeight: 62, borderRadius: 15, borderWidth: 1, padding: 8, flexDirection: "row", alignItems: "center", gap: 9 }, setNumber: { width: 51, height: 43, borderRadius: 12, alignItems: "center", justifyContent: "center" }, setNumberText: { fontSize: 16, fontWeight: "800" }, tableInput: { flex: 1, height: 43, borderRadius: 12, borderWidth: 1, textAlign: "center", fontSize: 16, fontWeight: "800" }, addSet: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }, addSetText: { fontSize: 14, fontWeight: "800" }, modalTotal: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, modalTotalValue: { fontSize: 18, fontWeight: "800" }, saveButton: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" }, saveButtonText: { color: "#101412", fontSize: 15, fontWeight: "800" } });
