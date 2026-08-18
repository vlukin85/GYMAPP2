import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MediaPickerSheet } from "@/components/media-picker-sheet";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatProgramCreatedAt, getExercise, getProgramCoverImage, programCoverIllustrationLibrary, sortProgramsByCreatedAt, type WorkoutProgram } from "@/lib/workout-data";
import { buildProgramExchange, parseProgramExchange } from "@/lib/program-exchange";
import { buildPortableProgramMedia, portableMediaKey, restorePortableProgramMedia } from "@/lib/program-media";
import { buildProgramZip, unpackProgramZip } from "@/lib/program-zip";
import { fromByteArray, toByteArray } from "base64-js";
import { useWorkoutStore } from "@/lib/workout-store";

const MAX_PROGRAM_FILE_SIZE = 24 * 1024 * 1024;
const PROGRAM_DELETE_UNDO_MS = 5_000;

export default function ProgramsScreen() {
  const colors = useColors();
  const { programs, customExercises, exerciseImageOverrides, exerciseGalleries, startWorkout, renameProgram, archiveProgram, archivePrograms, restoreProgram, deleteProgram, addPrograms, setProgramCover, setExerciseImage, addExerciseImage } = useWorkoutStore();
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null);
  const [draftName, setDraftName] = useState("");
  const [showArchive, setShowArchive] = useState(false);
  const [archiveQuery, setArchiveQuery] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest");
  const [coverProgram, setCoverProgram] = useState<WorkoutProgram | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<WorkoutProgram | null>(null);
  const pendingDeletionRef = useRef<WorkoutProgram | null>(null);
  const deletionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteProgramRef = useRef(deleteProgram);
  deleteProgramRef.current = deleteProgram;
  const activePrograms = useMemo(() => sortProgramsByCreatedAt(programs.filter((program) => !program.archivedAt && program.id !== pendingDeletion?.id), sortDirection), [pendingDeletion?.id, programs, sortDirection]);
  const archivedPrograms = useMemo(() => sortProgramsByCreatedAt(programs.filter((program) => Boolean(program.archivedAt) && program.id !== pendingDeletion?.id), sortDirection), [pendingDeletion?.id, programs, sortDirection]);
  const visiblePrograms = useMemo(() => showArchive ? archivedPrograms.filter((program) => program.name.toLocaleLowerCase("ru").includes(archiveQuery.trim().toLocaleLowerCase("ru"))) : activePrograms, [activePrograms, archiveQuery, archivedPrograms, showArchive]);

  const startRename = (program: WorkoutProgram) => { setEditingProgram(program); setDraftName(program.name); };
  const saveRename = () => { if (editingProgram && draftName.trim()) renameProgram(editingProgram.id, draftName); setEditingProgram(null); };
  const toggleSelected = (id: string) => setSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const exitBulkMode = () => { setBulkMode(false); setSelectedIds(new Set()); };
  const archiveSelected = () => { archivePrograms([...selectedIds]); exitBulkMode(); };
  const selectAllActive = () => setSelectedIds(new Set(activePrograms.map((program) => program.id)));
  const clearDeletionTimer = () => {
    if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
    deletionTimerRef.current = null;
  };
  const finalizePendingDeletion = (programId: string) => {
    if (pendingDeletionRef.current?.id !== programId) return;
    deleteProgramRef.current(programId);
    pendingDeletionRef.current = null;
    setPendingDeletion(null);
    clearDeletionTimer();
  };
  const stageProgramDeletion = (program: WorkoutProgram) => {
    const previous = pendingDeletionRef.current;
    if (previous) finalizePendingDeletion(previous.id);
    pendingDeletionRef.current = program;
    setPendingDeletion(program);
    clearDeletionTimer();
    deletionTimerRef.current = setTimeout(() => finalizePendingDeletion(program.id), PROGRAM_DELETE_UNDO_MS);
  };
  const undoProgramDeletion = () => {
    clearDeletionTimer();
    pendingDeletionRef.current = null;
    setPendingDeletion(null);
  };
  useEffect(() => () => {
    clearDeletionTimer();
    if (pendingDeletionRef.current) deleteProgramRef.current(pendingDeletionRef.current.id);
  }, []);
  const confirmDelete = (program: WorkoutProgram) => Alert.alert("Удалить программу?", `«${program.name}» будет скрыта из списка. У вас будет ${PROGRAM_DELETE_UNDO_MS / 1000} секунд, чтобы отменить удаление.`, [{ text: "Отмена", style: "cancel" }, { text: "Удалить", style: "destructive", onPress: () => stageProgramDeletion(program) }]);

  const exportPrograms = async () => {
    if (!activePrograms.length) { Alert.alert("Нет программ", "Сначала создайте или восстановите хотя бы одну программу."); return; }
    try {
      const portable = await buildPortableProgramMedia(activePrograms, exerciseImageOverrides, exerciseGalleries);
      const zip = buildProgramZip(portable.programs, portable.media);
      const name = `gym-programs-${new Date().toISOString().slice(0, 10)}.zip`;
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
        const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
        Alert.alert("Файл подготовлен", "Браузер начал скачивание файла программ.");
        return;
      }
      const uri = `${FileSystem.cacheDirectory}${name}`;
      await FileSystem.writeAsStringAsync(uri, fromByteArray(zip), { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/zip", dialogTitle: "Поделиться программами" });
      else Alert.alert("Файл подготовлен", "На этом устройстве недоступно системное меню обмена файлами.");
    } catch { Alert.alert("Не удалось экспортировать", "Попробуйте ещё раз — программы не были изменены."); }
  };

  const importPrograms = async () => {
    try {
      setIsImporting(true);
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/zip", "application/json", "text/json", "text/plain"], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      if ((asset.size ?? 0) > MAX_PROGRAM_FILE_SIZE) { Alert.alert("Файл слишком большой", "Выберите ZIP или JSON-файл программ размером до 24 МБ."); return; }
      const isZip = asset.name.toLowerCase().endsWith(".zip") || asset.mimeType === "application/zip";
      const content = isZip ? unpackProgramZip(Platform.OS === "web" && asset.file ? new Uint8Array(await asset.file.arrayBuffer()) : toByteArray(await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 }))) : Platform.OS === "web" && asset.file ? await asset.file.text() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = parseProgramExchange(content, programs);
      if (parsed.error) { Alert.alert("Импорт не выполнен", parsed.error); return; }
      const restoredMedia = await restorePortableProgramMedia(parsed.media ?? {});
      const importedPrograms = parsed.programs.map((program) => {
        const key = portableMediaKey(program.coverImage);
        return key && restoredMedia[key] ? { ...program, coverImage: restoredMedia[key] } : program;
      });
      addPrograms(importedPrograms);
      importedPrograms.forEach((program) => {
        if (program.coverImage) setProgramCover(program.id, program.coverImage);
        program.exercises.forEach(({ exerciseId }) => {
          const main = restoredMedia[`exercise-${exerciseId}-main`];
          if (main) setExerciseImage(exerciseId, main);
          for (let index = 0; index < 8; index += 1) {
            const extra = restoredMedia[`exercise-${exerciseId}-extra-${index}`];
            if (extra) addExerciseImage(exerciseId, extra);
          }
        });
      });
      const mediaText = Object.keys(restoredMedia).length ? ` Восстановлено изображений: ${Object.keys(restoredMedia).length}.` : "";
      Alert.alert("Импорт завершён", `Добавлено программ: ${importedPrograms.length}.${parsed.duplicateIds.length ? ` Пропущено повторов: ${parsed.duplicateIds.length}.` : ""}${mediaText}`);
    } catch { Alert.alert("Не удалось прочитать файл", "Выберите экспортированный ZIP или JSON-файл программ Дневника тренировок."); }
    finally { setIsImporting(false); }
  };

  const renderProgramCard = (program: WorkoutProgram) => {
    const isArchived = Boolean(program.archivedAt);
    const isSelected = selectedIds.has(program.id);
    return <View key={program.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border, opacity: isArchived ? 0.82 : 1 }]}>
      <View style={styles.cardHeader}>
        <Image source={getProgramCoverImage(program)} contentFit="cover" transition={180} style={styles.programIcon} />
        <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{program.name}</Text><Text style={[styles.cardSub, { color: colors.muted }]}>{program.description}</Text><Text style={[styles.createdAt, { color: colors.muted }]}>{formatProgramCreatedAt(program.createdAt)}{isArchived ? " · В архиве" : ""}</Text></View>
        <View style={styles.cardActions}>{bulkMode && !isArchived ? <Pressable onPress={() => toggleSelected(program.id)} hitSlop={7} style={[styles.check, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : colors.background }]}><Text style={[styles.checkText, { color: isSelected ? "#101412" : colors.muted }]}>{isSelected ? "✓" : ""}</Text></Pressable> : <><Pressable onPress={() => router.push({ pathname: "/program/new", params: { programId: program.id } })} hitSlop={7}><Text style={[styles.rename, { color: colors.primary }]}>Редактировать</Text></Pressable><Pressable onPress={() => startRename(program)} hitSlop={7}><Text style={[styles.renameSecondary, { color: colors.muted }]}>Переименовать</Text></Pressable>{!isArchived && <Pressable onPress={() => router.push({ pathname: "/calendar", params: { programId: program.id } })} hitSlop={7}><IconSymbol name="calendar" size={20} color={colors.muted} /></Pressable>}</>}</View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text style={[styles.exerciseLine, { color: colors.muted }]}>{program.exercises.map((item) => getExercise(item.exerciseId)?.name ?? customExercises.find((exercise) => exercise.id === item.exerciseId)?.name ?? item.exerciseId).join("  ·  ")}</Text>
      {!bulkMode && <View style={styles.managementRow}><Pressable onPress={() => setCoverProgram(program)}><Text style={[styles.managementAction, { color: colors.primary }]}>Обложка</Text></Pressable><Pressable onPress={() => isArchived ? restoreProgram(program.id) : archiveProgram(program.id)}><Text style={[styles.managementAction, { color: colors.primary }]}>{isArchived ? "Вернуть из архива" : "В архив"}</Text></Pressable><Pressable onPress={() => confirmDelete(program)}><Text style={[styles.managementAction, { color: colors.error }]}>Удалить</Text></Pressable></View>}
      <View style={styles.cardFooter}><Text style={[styles.meta, { color: colors.muted }]}>{program.exercises.length} упражнения  ·  {program.exercises.reduce((sum, item) => sum + item.sets, 0)} подходов</Text>{isArchived ? <Text style={[styles.archivedLabel, { color: colors.muted }]}>Скрыта из списка</Text> : !bulkMode && <Pressable onPress={() => { startWorkout(program.id); router.push({ pathname: "/workout", params: { programId: program.id } }); }} style={[styles.start, { backgroundColor: colors.primary }]}><Text style={styles.startText}>Начать</Text></Pressable>}</View>
      <MediaPickerSheet visible={coverProgram?.id === program.id} title={`Обложка: ${program.name}`} ownerId={program.id} scope="program" currentImage={program.coverImage} library={programCoverIllustrationLibrary} onSelect={(uri) => setProgramCover(program.id, uri)} onClose={() => setCoverProgram(null)} />
    </View>;
  };

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>ТВОИ ПЛАНЫ</Text><Text style={[styles.title, { color: colors.foreground }]}>Программы</Text></View><Pressable style={[styles.add, { backgroundColor: colors.primary }]} onPress={() => router.push("/program/new")}><Text style={styles.plus}>＋</Text></Pressable></View>
    <Text style={[styles.subtitle, { color: colors.muted }]}>Собирай тренировки под цель и повторяй их с прогрессом.</Text>
    <Pressable onPress={() => router.push("/program/ai")} style={({ pressed }) => [styles.aiCard, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}><View style={{ flex: 1 }}><Text style={styles.aiEyebrow}>ИИ-КОНСТРУКТОР</Text><Text style={styles.aiTitle}>Сгенерировать программу</Text><Text style={styles.aiText}>Опиши цель, затем доработай упражнения и подходы.</Text></View><Text style={styles.aiArrow}>›</Text></Pressable>
    {!showArchive && <View style={styles.transferRow}><Pressable onPress={() => setSortDirection((value) => value === "newest" ? "oldest" : "newest")} style={[styles.transferButton, { borderColor: colors.primary, backgroundColor: colors.primary + "18" }]}><Text style={[styles.transferText, { color: colors.primary }]}>{sortDirection === "newest" ? "Сначала новые" : "Сначала старые"}</Text></Pressable><Pressable onPress={exportPrograms} style={[styles.transferButton, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.transferText, { color: colors.foreground }]}>Экспорт ZIP</Text></Pressable><Pressable onPress={importPrograms} disabled={isImporting} style={[styles.transferButton, { borderColor: colors.border, backgroundColor: colors.surface, opacity: isImporting ? 0.55 : 1 }]}><Text style={[styles.transferText, { color: colors.foreground }]}>{isImporting ? "Читаем…" : "Импорт"}</Text></Pressable><Pressable onPress={() => bulkMode ? exitBulkMode() : setBulkMode(true)} style={[styles.transferButton, { borderColor: colors.primary, backgroundColor: colors.primary + "18" }]}><Text style={[styles.transferText, { color: colors.primary }]}>{bulkMode ? "Готово" : "Выбрать"}</Text></Pressable></View>}
    {bulkMode && <View style={[styles.selectionBar, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "55" }]}><Text style={[styles.selectionText, { color: colors.foreground }]}>Выбрано: {selectedIds.size}</Text><Pressable onPress={selectAllActive}><Text style={[styles.selectionAction, { color: colors.primary }]}>Все</Text></Pressable><Pressable onPress={archiveSelected} disabled={!selectedIds.size}><Text style={[styles.selectionAction, { color: selectedIds.size ? colors.primary : colors.muted }]}>В архив</Text></Pressable></View>}
    {archivedPrograms.length > 0 && <Pressable onPress={() => { setShowArchive((value) => !value); setArchiveQuery(""); exitBulkMode(); }} style={[styles.archiveToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.archiveToggleText, { color: colors.foreground }]}>{showArchive ? "← Ко всем программам" : `Архив · ${archivedPrograms.length}`}</Text><Text style={[styles.archiveToggleArrow, { color: colors.primary }]}>{showArchive ? "" : "›"}</Text></Pressable>}
    {showArchive && <><Text style={[styles.archiveTitle, { color: colors.foreground }]}>Архив программ</Text><TextInput value={archiveQuery} onChangeText={setArchiveQuery} placeholder="Поиск по названию" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /></>}
    {visiblePrograms.length ? visiblePrograms.map(renderProgramCard) : <View style={[styles.emptyArchive, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.emptyArchiveTitle, { color: colors.foreground }]}>{showArchive ? "Ничего не найдено" : "Список программ пуст"}</Text><Text style={[styles.emptyArchiveText, { color: colors.muted }]}>{showArchive ? "Измени запрос или вернись к общему списку." : "Создай программу вручную, с помощью ИИ или импортируй готовый файл."}</Text></View>}
    {!showArchive && <Pressable onPress={() => router.push("/program/new")} style={[styles.newCard, { borderColor: colors.border }]}><Text style={[styles.newTitle, { color: colors.foreground }]}>＋  Создать новую программу</Text><Text style={[styles.newSub, { color: colors.muted }]}>Настрой упражнения, вес, повторы и отдых</Text></Pressable>}
  </ScrollView>{pendingDeletion && <View style={[styles.undoToast, { backgroundColor: colors.foreground, borderColor: colors.primary }]}><View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.undoToastTitle, { color: colors.background }]}>«{pendingDeletion.name}» удалена</Text><Text style={[styles.undoToastHint, { color: colors.background + "C8" }]}>Можно отменить в течение 5 секунд</Text></View><Pressable onPress={undoProgramDeletion} style={[styles.undoAction, { backgroundColor: colors.primary }]}><Text style={styles.undoActionText}>Отменить</Text></Pressable></View>}<Modal visible={Boolean(editingProgram)} transparent animationType="fade" onRequestClose={() => setEditingProgram(null)}><View style={styles.modalBackdrop}><View style={[styles.renameSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.renameEyebrow, { color: colors.primary }]}>НАЗВАНИЕ ПРОГРАММЫ</Text><Text style={[styles.renameTitle, { color: colors.foreground }]}>Переименовать</Text><TextInput value={draftName} onChangeText={setDraftName} autoFocus maxLength={60} returnKeyType="done" onSubmitEditing={saveRename} style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="Например, Верх тела · Сила" placeholderTextColor={colors.muted} /><View style={styles.renameActions}><Pressable onPress={() => setEditingProgram(null)} style={[styles.cancel, { borderColor: colors.border }]}><Text style={[styles.cancelText, { color: colors.foreground }]}>Отмена</Text></Pressable><Pressable onPress={saveRename} disabled={!draftName.trim()} style={[styles.save, { backgroundColor: colors.primary, opacity: draftName.trim() ? 1 : 0.45 }]}><Text style={styles.saveText}>Сохранить</Text></Pressable></View></View></View></Modal></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 18, paddingBottom: 32, gap: 14 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { fontSize: 30, fontWeight: "800", marginTop: 5 }, subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 }, add: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" }, plus: { fontSize: 25, color: "#101412", lineHeight: 28 }, aiCard: { borderRadius: 20, padding: 17, minHeight: 113, flexDirection: "row", alignItems: "center", gap: 12 }, aiEyebrow: { color: "#101412AA", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, aiTitle: { color: "#101412", fontSize: 18, fontWeight: "900", marginTop: 4 }, aiText: { color: "#101412CC", fontSize: 11, lineHeight: 16, marginTop: 5 }, aiArrow: { color: "#101412", fontSize: 35, fontWeight: "400" }, transferRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" }, transferButton: { flexGrow: 1, minWidth: "40%", minHeight: 43, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }, transferText: { fontSize: 11, fontWeight: "900" }, selectionBar: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 16 }, selectionText: { flex: 1, fontSize: 12, fontWeight: "900" }, selectionAction: { fontSize: 12, fontWeight: "900" }, archiveToggle: { minHeight: 47, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, archiveToggleText: { fontSize: 13, fontWeight: "900" }, archiveToggleArrow: { fontSize: 24 }, archiveTitle: { fontSize: 18, fontWeight: "900", marginTop: 2 }, searchInput: { minHeight: 47, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 13, fontWeight: "700" }, card: { borderRadius: 20, borderWidth: 1, padding: 15 }, cardHeader: { flexDirection: "row", alignItems: "center", gap: 11 }, programIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, cardTitle: { fontSize: 16, fontWeight: "800" }, cardSub: { fontSize: 12, marginTop: 4 }, createdAt: { fontSize: 10, fontWeight: "700", marginTop: 6 }, cardActions: { alignItems: "flex-end", gap: 7 }, rename: { fontSize: 10, fontWeight: "900" }, renameSecondary: { fontSize: 9, fontWeight: "800" }, check: { height: 24, width: 24, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" }, checkText: { fontSize: 15, fontWeight: "900" }, divider: { height: 1, marginVertical: 13 }, exerciseLine: { fontSize: 12, lineHeight: 18 }, managementRow: { flexDirection: "row", gap: 18, marginTop: 12 }, managementAction: { fontSize: 11, fontWeight: "900" }, cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 15 }, meta: { fontSize: 11 }, start: { borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9 }, startText: { fontSize: 12, color: "#101412", fontWeight: "800" }, archivedLabel: { fontSize: 11, fontWeight: "800" }, emptyArchive: { borderRadius: 18, borderWidth: 1, padding: 18 }, emptyArchiveTitle: { fontSize: 15, fontWeight: "900" }, emptyArchiveText: { fontSize: 12, lineHeight: 18, marginTop: 5 }, newCard: { borderRadius: 18, borderWidth: 1, borderStyle: "dashed", padding: 18 }, newTitle: { fontSize: 15, fontWeight: "800" }, newSub: { fontSize: 12, marginTop: 6 }, undoToast: { position: "absolute", left: 14, right: 14, bottom: 74, minHeight: 68, borderRadius: 18, borderWidth: 1, padding: 11, flexDirection: "row", alignItems: "center", gap: 10, elevation: 12, shadowColor: "#000000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, undoToastTitle: { fontSize: 12, fontWeight: "900" }, undoToastHint: { fontSize: 10, marginTop: 3 }, undoAction: { minHeight: 40, paddingHorizontal: 13, borderRadius: 12, justifyContent: "center", alignItems: "center" }, undoActionText: { color: "#101412", fontSize: 11, fontWeight: "900" }, modalBackdrop: { flex: 1, backgroundColor: "#1E1230AA", justifyContent: "flex-end", padding: 16 }, renameSheet: { borderWidth: 1, borderRadius: 23, padding: 18, gap: 10 }, renameEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1 }, renameTitle: { fontSize: 23, fontWeight: "900" }, nameInput: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 15, fontWeight: "800", marginTop: 3 }, renameActions: { flexDirection: "row", gap: 10, marginTop: 4 }, cancel: { flex: 1, minHeight: 47, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" }, cancelText: { fontSize: 13, fontWeight: "900" }, save: { flex: 1, minHeight: 47, borderRadius: 14, alignItems: "center", justifyContent: "center" }, saveText: { color: "#101412", fontSize: 13, fontWeight: "900" } });
