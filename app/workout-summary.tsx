import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getExercise, getProgram } from "@/lib/workout-data";

export default function WorkoutSummaryScreen() {
  const colors = useColors();
  const { programId, volume = "0", minutes = "0", records = "" } = useLocalSearchParams<{ programId: string; volume?: string; minutes?: string; records?: string }>();
  const program = getProgram(programId);
  const recordIds = records.split(",").filter(Boolean);

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.redBar, { backgroundColor: colors.primary }]} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}><Text style={[styles.headerIndex, { color: colors.foreground }]}>01</Text><Text style={[styles.headerLabel, { color: colors.primary }]}>ТРЕНИРОВКА{`\n`}ЗАВЕРШЕНА</Text></View>
      <Text style={[styles.heroWord, { color: colors.foreground }]}>ГОТОВО.</Text>
      <Text style={[styles.programName, { color: colors.foreground }]}>{program?.name ?? "Тренировка"}</Text>
      <Text style={[styles.programCopy, { color: colors.muted }]}>Результаты сохранены в локальной истории. Данные сразу учтены в статистике и личных рекордах.</Text>
      <View style={[styles.metrics, { borderColor: colors.border }]}>
        <View style={[styles.metric, { borderRightColor: colors.border }]}><Text style={[styles.metricValue, { color: colors.foreground }]}>{Number(volume).toLocaleString("ru-RU")}</Text><Text style={[styles.metricLabel, { color: colors.muted }]}>ОБЪЁМ · КГ</Text></View>
        <View style={styles.metric}><Text style={[styles.metricValue, { color: "#1746D2" }]}>{minutes}</Text><Text style={[styles.metricLabel, { color: colors.muted }]}>МИНУТ</Text></View>
      </View>
      <View style={[styles.recordPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.recordPanelHeader}><IconSymbol name="trophy" size={23} color={colors.primary} /><Text style={[styles.recordPanelTitle, { color: colors.foreground }]}>ЛИЧНЫЕ РЕКОРДЫ</Text><Text style={[styles.recordCount, { color: colors.primary }]}>{recordIds.length}</Text></View>
        {recordIds.length ? recordIds.map((id, index) => <View key={id} style={[styles.recordRow, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}><Text style={[styles.recordNumber, { color: colors.primary }]}>{String(index + 1).padStart(2, "0")}</Text><Text style={[styles.recordName, { color: colors.foreground }]}>{getExercise(id)?.name ?? id}</Text><IconSymbol name="arrow.up.right" size={18} color="#1746D2" /></View>) : <Text style={[styles.noRecords, { color: colors.muted }]}>Сегодня без нового рекорда. Последовательность — уже прогресс.</Text>}
      </View>
      <View style={styles.actions}><Pressable onPress={() => router.replace("/(tabs)/stats")} style={({ pressed }) => [styles.primaryAction, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}><Text style={styles.primaryActionText}>ОТКРЫТЬ СТАТИСТИКУ</Text><IconSymbol name="chart.bar.fill" size={19} color="#FFFDF8" /></Pressable><Pressable onPress={() => router.replace("/(tabs)")} style={({ pressed }) => [styles.secondaryAction, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.secondaryActionText, { color: colors.foreground }]}>К ПЛАНУ</Text><IconSymbol name="house.fill" size={19} color={colors.foreground} /></Pressable></View>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34, gap: 18 }, redBar: { height: 8, marginHorizontal: -20, marginTop: -20 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 15, marginTop: 8 }, headerIndex: { fontSize: 66, lineHeight: 57, fontWeight: "900", letterSpacing: -4 }, headerLabel: { textAlign: "right", fontSize: 14, lineHeight: 18, fontWeight: "900", letterSpacing: 1.2 }, heroWord: { fontSize: 58, fontWeight: "900", letterSpacing: -3.6, marginTop: 6 }, programName: { fontSize: 23, fontWeight: "900", textTransform: "uppercase", marginTop: -8 }, programCopy: { fontSize: 13, lineHeight: 19, maxWidth: 330 }, metrics: { flexDirection: "row", borderWidth: 1 }, metric: { flex: 1, minHeight: 104, padding: 14, justifyContent: "space-between", borderRightWidth: StyleSheet.hairlineWidth }, metricValue: { fontSize: 31, fontWeight: "900", letterSpacing: -1.4 }, metricLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }, recordPanel: { borderWidth: 1, borderLeftWidth: 6, padding: 14, gap: 12 }, recordPanelHeader: { flexDirection: "row", alignItems: "center", gap: 8 }, recordPanelTitle: { flex: 1, fontSize: 13, fontWeight: "900", letterSpacing: 0.4 }, recordCount: { fontSize: 25, fontWeight: "900" }, recordRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10 }, recordNumber: { width: 28, fontSize: 15, fontWeight: "900" }, recordName: { flex: 1, fontSize: 13, lineHeight: 17, fontWeight: "900", textTransform: "uppercase" }, noRecords: { fontSize: 12, lineHeight: 18 }, actions: { gap: 9, marginTop: 4 }, primaryAction: { minHeight: 57, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15 }, primaryActionText: { color: "#FFFDF8", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 }, secondaryAction: { minHeight: 52, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15 }, secondaryActionText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
});
