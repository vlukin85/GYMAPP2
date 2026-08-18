import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { buildLocalWorkoutHistoryRows } from "@/lib/local-workout-history";
import { buildTrainingCsv } from "@/lib/training-export";
import { useWorkoutStore } from "@/lib/workout-store";

export default function ExportScreen() {
  const colors = useColors();
  const { completed, oneRmFormula } = useWorkoutStore();
  const rows = buildLocalWorkoutHistoryRows(completed, oneRmFormula);
  const exportCsv = async () => {
    if (!rows.length) { Alert.alert("Нет данных", "Заверши хотя бы одну тренировку, чтобы выгрузить историю в CSV."); return; }
    const csv = buildTrainingCsv(rows);
    const fileName = `gym-training-history-${new Date().toISOString().slice(0, 10)}.csv`;
    try {
      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
        return;
      }
      const uri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (!(await Sharing.isAvailableAsync())) { Alert.alert("Файл создан", `CSV сохранён: ${uri}`); return; }
      await Sharing.shareAsync(uri, { dialogTitle: "Экспорт истории тренировок", mimeType: "text/csv" });
    } catch { Alert.alert("Не удалось создать CSV", "Попробуй ещё раз после проверки подключения и свободного места на устройстве."); }
  };
  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background"><View style={styles.header}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>Экспорт CSV</Text><View style={{ width: 27 }} /></View><View style={[styles.hero, { backgroundColor: colors.primary }]}><Text style={styles.heroEyebrow}>ИСТОРИЯ ТРЕНИРОВОК</Text><Text style={styles.heroTitle}>Открой данные в Excel</Text><Text style={styles.heroText}>Выгрузка включает дату, программу, упражнение, подход, вес, повторы, объём и расчётный 1RM.</Text></View><View style={[styles.summary, { backgroundColor: colors.surface }]}><Text style={[styles.summaryValue, { color: colors.foreground }]}>{rows.length}</Text><Text style={[styles.summaryLabel, { color: colors.muted }]}>локально сохранённых подходов в файле</Text></View><Pressable onPress={exportCsv} style={[styles.exportButton, { backgroundColor: colors.primary }]}><Text style={styles.exportText}>Скачать CSV</Text><IconSymbol name="chevron.right" size={20} color="#101412" /></Pressable><Text style={[styles.note, { color: colors.muted }]}>На Android откроется системное меню: можно сохранить файл на устройство, отправить его по почте или открыть в табличном приложении.</Text></ScreenContainer>;
}

const styles = StyleSheet.create({ header: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { fontSize: 16, fontWeight: "800" }, hero: { borderRadius: 22, padding: 20, marginTop: 16 }, heroEyebrow: { color: "#101412", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, heroTitle: { color: "#101412", fontSize: 25, fontWeight: "900", marginTop: 8 }, heroText: { color: "#101412CC", fontSize: 13, lineHeight: 19, marginTop: 8 }, summary: { marginTop: 14, borderRadius: 17, padding: 16 }, summaryValue: { fontSize: 25, fontWeight: "900" }, summaryLabel: { fontSize: 12, marginTop: 4 }, exportButton: { minHeight: 56, borderRadius: 16, marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, exportText: { color: "#101412", fontSize: 15, fontWeight: "900" }, note: { fontSize: 12, lineHeight: 18, marginTop: 14 } });
