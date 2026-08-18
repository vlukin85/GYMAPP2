import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { buildWorkoutComparison, groupWorkoutSessions } from "@/lib/csv-import";
import { buildLocalWorkoutHistoryRows } from "@/lib/local-workout-history";
import { formatDuration, getExercise } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function signed(value: number, suffix = "") {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix ? ` ${suffix}` : ""}`;
}

export default function CompareScreen() {
  const colors = useColors();
  const { programs, completed, oneRmFormula } = useWorkoutStore();
  const sessions = useMemo(() => groupWorkoutSessions(buildLocalWorkoutHistoryRows(completed, oneRmFormula)), [completed, oneRmFormula]);
  const [firstId, setFirstId] = useState<string | null>(null);
  const [secondId, setSecondId] = useState<string | null>(null);
  const [target, setTarget] = useState<"first" | "second">("first");

  useEffect(() => {
    if (sessions.length >= 2 && !firstId && !secondId) {
      setFirstId(sessions[1].id);
      setSecondId(sessions[0].id);
    }
  }, [sessions, firstId, secondId]);

  const first = sessions.find((session) => session.id === firstId) ?? null;
  const second = sessions.find((session) => session.id === secondId) ?? null;
  const comparison = first && second && first.id !== second.id ? buildWorkoutComparison(first, second) : null;
  const label = (programId: string) => programs.find((program) => program.id === programId)?.name ?? (programId.startsWith("imported-") ? "Импортированная тренировка" : programId);
  const choose = (id: string) => target === "first" ? setFirstId(id) : setSecondId(id);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <IconSymbol name="chevron.left" size={27} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Сравнение тренировок</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroEyebrow}>АНАЛИЗ ПРОГРЕССА</Text>
          <Text style={styles.heroTitle}>Два занятия — один вывод</Text>
          <Text style={styles.heroText}>Сравни общий объём и максимальный расчётный 1RM по каждому упражнению.</Text>
        </View>

        {sessions.length < 2 && (
          <View style={[styles.empty, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Нужно ещё одно занятие</Text>
            <Text style={[styles.stateText, { color: colors.muted }]}>Заверши или импортируй минимум две тренировки, чтобы увидеть сравнение.</Text>
            <Pressable onPress={() => router.push("/import")} style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.emptyButtonText}>Импортировать CSV</Text>
            </Pressable>
          </View>
        )}

        {sessions.length >= 2 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Выбери тренировки</Text>
            <View style={styles.slots}>
              <SessionSlot title="ТРЕНИРОВКА А" session={first} active={target === "first"} programLabel={first ? label(first.programId) : "Нажми, чтобы выбрать"} foreground={colors.foreground} muted={colors.muted} primary={colors.primary} surface={colors.surface} border={colors.border} onPress={() => setTarget("first")} />
              <SessionSlot title="ТРЕНИРОВКА Б" session={second} active={target === "second"} programLabel={second ? label(second.programId) : "Нажми, чтобы выбрать"} foreground={colors.foreground} muted={colors.muted} primary={colors.primary} surface={colors.surface} border={colors.border} onPress={() => setTarget("second")} />
            </View>
            <Text style={[styles.selectHint, { color: colors.muted }]}>Сейчас выбирается: {target === "first" ? "тренировка А" : "тренировка Б"}. Коснись любой строки ниже.</Text>

            <View style={styles.sessionList}>
              {sessions.map((session) => {
                const selected = session.id === firstId || session.id === secondId;
                return (
                  <Pressable key={session.id} onPress={() => choose(session.id)} style={[styles.session, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionDate, { color: colors.foreground }]}>{formatDate(session.date)}</Text>
                      <Text style={[styles.sessionMeta, { color: colors.muted }]}>{label(session.programId)} · {session.totalVolumeKg.toFixed(0)} кг</Text>
                    </View>
                    <Text style={[styles.sessionTag, { color: selected ? colors.primary : colors.muted }]}>{session.id === firstId ? "А" : session.id === secondId ? "Б" : "Выбрать"}</Text>
                  </Pressable>
                );
              })}
            </View>

            {comparison && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Изменения Б относительно А</Text>
                <View style={styles.metricRow}>
                  <MetricCard title="Объём" value={signed(comparison.volumeDeltaKg, "кг")} hint={`${comparison.first.totalVolumeKg.toFixed(0)} → ${comparison.second.totalVolumeKg.toFixed(0)} кг`} valueColor={comparison.volumeDeltaKg >= 0 ? colors.success : colors.error} background={colors.surface} muted={colors.muted} />
                  <MetricCard title="Подходы" value={signed(comparison.setCountDelta)} hint={`${comparison.first.setCount} → ${comparison.second.setCount}`} valueColor={comparison.setCountDelta >= 0 ? colors.success : colors.error} background={colors.surface} muted={colors.muted} />
                </View>

                <View style={[styles.duration, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.durationLabel, { color: colors.muted }]}>Длительность</Text>
                  <Text style={[styles.durationValue, { color: colors.foreground }]}>
                    {formatDuration(comparison.first.durationMinutes)}
                    <Text style={{ color: comparison.durationDeltaMinutes === 0 ? colors.muted : comparison.durationDeltaMinutes > 0 ? colors.error : colors.success }}>
                      {` → ${formatDuration(comparison.second.durationMinutes)} (${signed(comparison.durationDeltaMinutes, "мин")})`}
                    </Text>
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Объём по мышечным группам</Text>
                <MuscleGroupVolumeChart rows={comparison.muscleGroupDeltas} primary={colors.primary} secondary="#FF9F43" foreground={colors.foreground} muted={colors.muted} surface={colors.surface} border={colors.border} success={colors.success} error={colors.error} />

                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>1RM по упражнениям</Text>
                {comparison.exerciseDeltas.map((exercise) => {
                  const exclusive = exercise.deltaKg === null;
                  const name = getExercise(exercise.exerciseId)?.name ?? exercise.exerciseId;
                  const exclusiveValue = exercise.firstOneRmKg ?? exercise.secondOneRmKg;
                  return (
                    <View key={exercise.exerciseId} style={[styles.exercise, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.exerciseName, { color: colors.foreground }]}>{name}</Text>
                        <Text style={[styles.exerciseMeta, { color: colors.muted }]}>{exclusive ? "Выполнялось только в одной тренировке" : `${exercise.firstOneRmKg?.toFixed(1)} → ${exercise.secondOneRmKg?.toFixed(1)} кг`}</Text>
                      </View>
                      <Text style={[styles.exerciseDelta, { color: exclusive ? colors.muted : (exercise.deltaKg ?? 0) >= 0 ? colors.success : colors.error }]}>{exclusive ? `${exclusiveValue?.toFixed(1)} кг` : signed(exercise.deltaKg ?? 0, "кг")}</Text>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function SessionSlot({ title, session, active, programLabel, foreground, muted, primary, surface, border, onPress }: { title: string; session: { date: Date | string } | null; active: boolean; programLabel: string; foreground: string; muted: string; primary: string; surface: string; border: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.slot, { backgroundColor: surface, borderColor: active ? primary : border }]}><Text style={[styles.slotEyebrow, { color: active ? primary : muted }]}>{title}</Text><Text style={[styles.slotDate, { color: foreground }]}>{session ? formatDate(session.date) : "Выбрать"}</Text><Text style={[styles.slotProgram, { color: muted }]} numberOfLines={1}>{programLabel}</Text></Pressable>;
}

function MetricCard({ title, value, hint, valueColor, background, muted }: { title: string; value: string; hint: string; valueColor: string; background: string; muted: string }) {
  return <View style={[styles.metric, { backgroundColor: background }]}><Text style={[styles.metricTitle, { color: muted }]}>{title}</Text><Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text><Text style={[styles.metricHint, { color: muted }]}>{hint}</Text></View>;
}

function MuscleGroupVolumeChart({ rows, primary, secondary, foreground, muted, surface, border, success, error }: { rows: { group: string; firstVolumeKg: number; secondVolumeKg: number; deltaKg: number }[]; primary: string; secondary: string; foreground: string; muted: string; surface: string; border: string; success: string; error: string }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.firstVolumeKg, row.secondVolumeKg]));
  return <View style={[styles.groupChart, { backgroundColor: surface, borderColor: border }]}><View style={styles.chartLegend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: primary }]} /><Text style={[styles.legendText, { color: muted }]}>Тренировка А</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: secondary }]} /><Text style={[styles.legendText, { color: muted }]}>Тренировка Б</Text></View></View>{rows.map((row) => <View key={row.group} style={styles.groupChartRow}><View style={styles.groupChartHeader}><Text style={[styles.groupChartName, { color: foreground }]}>{row.group}</Text><Text style={[styles.groupChartDelta, { color: row.deltaKg >= 0 ? success : error }]}>{signed(row.deltaKg, "кг")}</Text></View><View style={styles.groupBars}><View style={[styles.barTrack, { backgroundColor: border + "70" }]}><View style={[styles.bar, { width: `${(row.firstVolumeKg / max) * 100}%`, backgroundColor: primary }]} /></View><Text style={[styles.barValue, { color: muted }]}>{row.firstVolumeKg.toFixed(0)}</Text></View><View style={styles.groupBars}><View style={[styles.barTrack, { backgroundColor: border + "70" }]}><View style={[styles.bar, { width: `${(row.secondVolumeKg / max) * 100}%`, backgroundColor: secondary }]} /></View><Text style={[styles.barValue, { color: muted }]}>{row.secondVolumeKg.toFixed(0)}</Text></View></View>)}</View>;
}

const styles = StyleSheet.create({ content: { paddingTop: 10, paddingBottom: 38, gap: 12 }, header: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" }, headerTitle: { fontSize: 16, fontWeight: "800" }, hero: { borderRadius: 22, padding: 20, marginTop: 6 }, heroEyebrow: { color: "#101412", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, heroTitle: { color: "#101412", fontSize: 25, fontWeight: "900", marginTop: 8 }, heroText: { color: "#101412CC", fontSize: 13, lineHeight: 19, marginTop: 8 }, stateText: { fontSize: 13, lineHeight: 20, marginTop: 7 }, empty: { borderRadius: 18, padding: 17, gap: 8 }, emptyTitle: { fontSize: 17, fontWeight: "900" }, emptyButton: { alignSelf: "flex-start", minHeight: 42, paddingHorizontal: 14, borderRadius: 13, justifyContent: "center", marginTop: 4 }, emptyButtonText: { color: "#101412", fontSize: 13, fontWeight: "900" }, sectionTitle: { fontSize: 19, fontWeight: "900", marginTop: 4 }, slots: { flexDirection: "row", gap: 8 }, slot: { flex: 1, minHeight: 113, borderWidth: 1.5, borderRadius: 17, padding: 12, justifyContent: "space-between" }, slotEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.7 }, slotDate: { fontSize: 15, fontWeight: "900", marginTop: 9 }, slotProgram: { fontSize: 10, marginTop: 5 }, selectHint: { fontSize: 11, lineHeight: 17, marginTop: -3 }, sessionList: { gap: 7 }, session: { minHeight: 60, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }, sessionDate: { fontSize: 13, fontWeight: "900" }, sessionMeta: { fontSize: 11, marginTop: 4 }, sessionTag: { fontSize: 11, fontWeight: "900" }, metricRow: { flexDirection: "row", gap: 8 }, metric: { flex: 1, minHeight: 103, borderRadius: 17, padding: 13, justifyContent: "space-between" }, metricTitle: { fontSize: 11, fontWeight: "800" }, metricValue: { fontSize: 21, fontWeight: "900" }, metricHint: { fontSize: 10 }, duration: { borderRadius: 17, padding: 14 }, durationLabel: { fontSize: 11, fontWeight: "800" }, durationValue: { fontSize: 14, fontWeight: "800", marginTop: 7, lineHeight: 21 }, groupChart: { borderRadius: 17, borderWidth: 1, padding: 13, gap: 12 }, chartLegend: { flexDirection: "row", gap: 14 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 5 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { fontSize: 10, fontWeight: "800" }, groupChartRow: { gap: 4 }, groupChartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, groupChartName: { fontSize: 12, fontWeight: "900" }, groupChartDelta: { fontSize: 11, fontWeight: "900" }, groupBars: { flexDirection: "row", alignItems: "center", gap: 7 }, barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" }, bar: { height: "100%", minWidth: 2, borderRadius: 4 }, barValue: { width: 38, textAlign: "right", fontSize: 10, fontWeight: "800" }, exercise: { minHeight: 67, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }, exerciseName: { fontSize: 13, fontWeight: "900" }, exerciseMeta: { fontSize: 11, marginTop: 5 }, exerciseDelta: { fontSize: 13, fontWeight: "900", textAlign: "right" } });
