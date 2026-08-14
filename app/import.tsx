import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { groupImportedSessions, parseTrainingCsv, type ParsedTrainingCsv } from "@/lib/csv-import";
import { trpc } from "@/lib/trpc";
import { useWorkoutStore } from "@/lib/workout-store";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function ImportScreen() {
  const colors = useColors();
  const { oneRmFormula, importCompletedWorkouts } = useWorkoutStore();
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTrainingCsv | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const importMutation = trpc.workoutHistory.import.useMutation();
  const sessions = useMemo(() => groupImportedSessions(parsed?.rows ?? []), [parsed]);

  const pickCsv = async () => {
    try {
      setIsPicking(true);
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/plain", "application/vnd.ms-excel"], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      if ((asset.size ?? 0) > MAX_FILE_SIZE) { Alert.alert("Файл слишком большой", "Выбери CSV размером не более 2 МБ и до 500 строк подходов."); return; }
      const text = Platform.OS === "web" && asset.file ? await asset.file.text() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const report = parseTrainingCsv(text);
      setFileName(asset.name);
      setParsed(report);
    } catch {
      Alert.alert("Не удалось прочитать файл", "Проверь, что это текстовый CSV-файл в кодировке UTF-8.");
    } finally { setIsPicking(false); }
  };

  const importHistory = async () => {
    if (!sessions.length || !parsed?.rows.length) return;
    try {
      const result = await importMutation.mutateAsync({ formula: oneRmFormula, sessions: sessions.map((session) => ({ programId: session.programId, durationMinutes: session.durationMinutes, completedAt: new Date(`${session.date}T12:00:00.000Z`), sets: session.sets.map((set) => ({ exerciseId: set.exerciseId, setNumber: set.setNumber, reps: set.reps, weightKg: set.weightKg, setType: set.setType })) })) });
      importCompletedWorkouts(sessions.map((session, index) => ({ id: `server-${result.sessionIds[index]}`, programId: session.programId, date: session.date, durationMinutes: session.durationMinutes, totalVolume: session.totalVolumeKg, sets: session.sets.map((set) => ({ exerciseId: set.exerciseId, weight: set.weightKg, reps: set.reps })) })));
      Alert.alert("История добавлена", `Загружено тренировок: ${sessions.length}; подходов: ${parsed.rows.length}.`, [{ text: "Готово", onPress: () => router.back() }]);
    } catch {
      Alert.alert("Импорт не завершён", "Сервер не подтвердил загрузку. Локальная история не была изменена — попробуй ещё раз.");
    }
  };

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.iconButton}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>Импорт CSV</Text><View style={styles.iconButton} /></View><View style={[styles.hero, { backgroundColor: colors.primary }]}><Text style={styles.heroEyebrow}>ПЕРЕНОС ИСТОРИИ</Text><Text style={styles.heroTitle}>Загрузи старые тренировки</Text><Text style={styles.heroText}>Поддерживаются собственные выгрузки приложения, а также заголовки на русском и английском: дата, упражнение, подход, повторы и вес.</Text></View><View style={[styles.format, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.formatTitle, { color: colors.foreground }]}>Минимальный формат файла</Text><Text style={[styles.formatText, { color: colors.muted }]}>Дата · Упражнение · Повторы · Вес_кг{`\n`}Необязательно: Программа · Подход · Длительность · Тип подхода · ID сессии</Text></View><Pressable onPress={pickCsv} disabled={isPicking || importMutation.isPending} style={[styles.pickButton, { backgroundColor: colors.primary, opacity: isPicking || importMutation.isPending ? 0.6 : 1 }]}><Text style={styles.pickText}>{isPicking ? "Читаем файл…" : "Выбрать CSV-файл"}</Text><IconSymbol name="chevron.right" size={20} color="#101412" /></Pressable>{parsed && <View style={styles.report}><View style={[styles.fileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{fileName}</Text><Text style={[styles.fileMeta, { color: colors.muted }]}>Разделитель: {parsed.delimiter === ";" ? "точка с запятой" : "запятая"} · найдены колонки: {parsed.detectedColumns.length}</Text></View><View style={styles.summaryRow}><View style={[styles.summaryCard, { backgroundColor: colors.success + "18" }]}><Text style={[styles.summaryValue, { color: colors.success }]}>{parsed.rows.length}</Text><Text style={[styles.summaryLabel, { color: colors.muted }]}>валидных подходов</Text></View><View style={[styles.summaryCard, { backgroundColor: parsed.errors.length ? colors.error + "18" : colors.surface }]}><Text style={[styles.summaryValue, { color: parsed.errors.length ? colors.error : colors.foreground }]}>{parsed.errors.length}</Text><Text style={[styles.summaryLabel, { color: colors.muted }]}>строк с ошибками</Text></View><View style={[styles.summaryCard, { backgroundColor: colors.surface }]}><Text style={[styles.summaryValue, { color: colors.foreground }]}>{sessions.length}</Text><Text style={[styles.summaryLabel, { color: colors.muted }]}>тренировок</Text></View></View>{parsed.errors.length > 0 && <View style={[styles.errors, { backgroundColor: colors.error + "12", borderColor: colors.error + "35" }]}><Text style={[styles.errorsTitle, { color: colors.error }]}>Требуют внимания</Text>{parsed.errors.slice(0, 3).map((error) => <Text key={`${error.line}-${error.message}`} style={[styles.errorText, { color: colors.muted }]}>Строка {error.line}: {error.message}</Text>)}{parsed.errors.length > 3 && <Text style={[styles.errorText, { color: colors.muted }]}>И ещё {parsed.errors.length - 3} строк — они не будут загружены.</Text>}</View>}<Text style={[styles.sectionTitle, { color: colors.foreground }]}>Предпросмотр</Text>{parsed.rows.slice(0, 5).map((row) => <View key={`${row.sourceLine}-${row.exerciseId}`} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.rowName, { color: colors.foreground }]}>{row.exerciseName}</Text><Text style={[styles.rowMeta, { color: colors.muted }]}>{row.date} · {row.programName}</Text></View><Text style={[styles.rowValue, { color: colors.foreground }]}>{row.weightKg} кг × {row.reps}</Text></View>)}{parsed.rows.length > 5 && <Text style={[styles.more, { color: colors.muted }]}>Показаны первые 5 из {parsed.rows.length} валидных подходов.</Text>}<Pressable onPress={importHistory} disabled={!sessions.length || importMutation.isPending} style={[styles.importButton, { backgroundColor: colors.primary, opacity: !sessions.length || importMutation.isPending ? 0.5 : 1 }]}><Text style={styles.importText}>{importMutation.isPending ? "Загружаем историю…" : `Импортировать ${sessions.length} тренировок`}</Text></Pressable><Text style={[styles.note, { color: colors.muted }]}>Будут загружены только валидные строки. Перед импортом можно вернуться, выбрать другой файл или исправить исходный CSV.</Text></View>}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 10, paddingBottom: 36, gap: 12 }, header: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" }, headerTitle: { fontSize: 16, fontWeight: "800" }, hero: { borderRadius: 22, padding: 20, marginTop: 6 }, heroEyebrow: { color: "#101412", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, heroTitle: { color: "#101412", fontSize: 25, fontWeight: "900", marginTop: 8 }, heroText: { color: "#101412CC", fontSize: 13, lineHeight: 19, marginTop: 8 }, format: { borderWidth: 1, borderRadius: 17, padding: 15 }, formatTitle: { fontSize: 14, fontWeight: "800" }, formatText: { fontSize: 12, lineHeight: 19, marginTop: 6 }, pickButton: { minHeight: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, pickText: { color: "#101412", fontSize: 15, fontWeight: "900" }, report: { gap: 11 }, fileCard: { borderRadius: 16, borderWidth: 1, padding: 13 }, fileName: { fontSize: 14, fontWeight: "800" }, fileMeta: { fontSize: 11, marginTop: 5 }, summaryRow: { flexDirection: "row", gap: 8 }, summaryCard: { flex: 1, minHeight: 78, borderRadius: 15, padding: 10, justifyContent: "space-between" }, summaryValue: { fontSize: 22, fontWeight: "900" }, summaryLabel: { fontSize: 10, lineHeight: 13 }, errors: { borderRadius: 16, borderWidth: 1, padding: 13, gap: 5 }, errorsTitle: { fontSize: 13, fontWeight: "900", marginBottom: 2 }, errorText: { fontSize: 11, lineHeight: 16 }, sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 2 }, row: { minHeight: 61, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }, rowName: { fontSize: 13, fontWeight: "800" }, rowMeta: { fontSize: 11, marginTop: 4 }, rowValue: { fontSize: 13, fontWeight: "900" }, more: { fontSize: 11, marginTop: -3 }, importButton: { minHeight: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 3 }, importText: { color: "#101412", fontSize: 15, fontWeight: "900" }, note: { fontSize: 12, lineHeight: 18, marginTop: 1 } });
