import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useBottomActionInset } from "@/lib/use-bottom-inset";
import { useInterfaceDensity } from "@/lib/interface-density-provider";
import { minTouchTarget, pressedOpacity, radius, shadows, type as typeTokens } from "@/lib/design-tokens";
import { exercises, muscleGroups, sortProgramsByCreatedAt, type Exercise, type MuscleGroup } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";

const selectableGroups = muscleGroups.filter((group): group is MuscleGroup => group !== "Все");

export default function ExercisesScreen() {
  const colors = useColors();
  const sheetBottomInset = useBottomActionInset(18);
  const { fontScale, spacingScale } = useInterfaceDensity();
  const { customExercises, exerciseImageOverrides, programs, addCustomExercise, addExerciseToProgram } = useWorkoutStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<MuscleGroup | "Все">("Все");
  const [programPickerExercise, setProgramPickerExercise] = useState<Exercise | null>(null);
  const [programQuery, setProgramQuery] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualGroup, setManualGroup] = useState<MuscleGroup>("Грудь");
  const [manualEquipment, setManualEquipment] = useState("Тренажёр");
  const [manualDescription, setManualDescription] = useState("");

  const catalog = useMemo(() => [...exercises.map((exercise) => exerciseImageOverrides[exercise.id] ? { ...exercise, image: exerciseImageOverrides[exercise.id], photoAngles: [{ id: "main" as const, label: "Моё изображение", url: exerciseImageOverrides[exercise.id] }] } : exercise), ...customExercises], [customExercises, exerciseImageOverrides]);
  const filtered = useMemo(() => catalog.filter((exercise) => (active === "Все" || exercise.group === active) && `${exercise.name} ${exercise.equipment}`.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"))), [active, catalog, query]);
  const availablePrograms = useMemo(() => sortProgramsByCreatedAt(programs.filter((program) => !program.archivedAt && `${program.name} ${program.description}`.toLocaleLowerCase("ru").includes(programQuery.trim().toLocaleLowerCase("ru"))), "newest"), [programQuery, programs]);
  const openProgramPicker = (exercise: Exercise) => { setProgramPickerExercise(exercise); setProgramQuery(""); };
  const chooseProgram = (programId: string) => {
    if (!programPickerExercise) return;
    const added = addExerciseToProgram(programId, programPickerExercise.id);
    const program = programs.find((item) => item.id === programId);
    Alert.alert(added ? "Упражнение добавлено" : "Уже в программе", added ? `«${programPickerExercise.name}» добавлено в «${program?.name ?? "программу"}».` : `«${programPickerExercise.name}» уже есть в «${program?.name ?? "программе"}».`);
    setProgramPickerExercise(null);
  };
  const saveManualExercise = () => {
    const exerciseId = addCustomExercise({ name: manualName, group: manualGroup, equipment: manualEquipment, description: manualDescription });
    if (!exerciseId) { Alert.alert("Не удалось добавить", manualName.trim() ? "Упражнение с таким названием уже есть в личном каталоге." : "Укажите название упражнения."); return; }
    const exercise = [...catalog, ...customExercises].find((item) => item.id === exerciseId);
    setShowManualForm(false); setManualName(""); setManualEquipment("Тренажёр"); setManualDescription("");
    Alert.alert("Упражнение создано", "Оно добавлено в личный каталог. Теперь выберите программу, куда его добавить.", [{ text: "Позже" }, { text: "Выбрать программу", onPress: () => { const created = exercise ?? { id: exerciseId, name: "Новое упражнение", group: manualGroup, equipment: manualEquipment, description: manualDescription, image: "", videoUrl: "", recordKg: 0, recordReps: 0 }; openProgramPicker(created); } }]);
  };

  const header = <View style={styles.headerBlock}>
    <View style={[styles.header, { borderBottomColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.primary, fontSize: 11 * fontScale }]}>База движений</Text><Text style={[styles.title, { color: colors.foreground, fontSize: 30 * fontScale }]}>Упражнения</Text><Text style={[styles.subtitle, { color: colors.muted, fontSize: 13 * fontScale }]}>Находите движения, создавайте свои и добавляйте их в планы.</Text></View><Pressable onPress={() => setShowManualForm(true)} style={({ pressed }) => [styles.createButton, { backgroundColor: colors.primary, ...shadows.card, opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.createButtonText, { color: colors.background }]}>＋</Text></Pressable></View>
    <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.searchMark, { color: colors.muted }]}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Поиск по названию или оборудованию" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, fontSize: 15 * fontScale }]} returnKeyType="search" /></View>
    <FlatList horizontal data={muscleGroups} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} renderItem={({ item }) => <Pressable onPress={() => setActive(item)} style={({ pressed }) => [styles.filter, { backgroundColor: active === item ? colors.primary : colors.surface, borderColor: active === item ? colors.primary : colors.border, opacity: pressed ? pressedOpacity : 1 }]}><Text style={{ color: active === item ? "#10150E" : colors.muted, fontSize: 13 * fontScale, fontWeight: "700" }}>{item}</Text></Pressable>} />
    <View style={[styles.catalogMeta, { borderTopColor: colors.border }]}><Text style={[styles.catalogMetaLabel, { color: colors.muted }]}>Найдено упражнений</Text><Text style={[styles.catalogMetaValue, { color: colors.primary, fontVariant: ["tabular-nums"] }]}>{filtered.length}</Text></View>
  </View>;

  return <ScreenContainer className="px-5" containerClassName="bg-background"><FlatList data={filtered} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { gap: 10 * spacingScale }]} ListHeaderComponent={header} renderItem={({ item, index }) => <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.card }]}><Pressable onPress={() => router.push({ pathname: "/exercise/[id]", params: { id: item.id } })} style={({ pressed }) => [styles.cardMain, pressed && { opacity: pressedOpacity, backgroundColor: `${colors.primary}08` }]}><Image source={item.image} contentFit="cover" cachePolicy="memory-disk" transition={200} style={[styles.image, { borderColor: colors.border }]} /><View style={styles.cardBody}><View style={styles.cardCopy}><Text style={[styles.cardTitle, { color: colors.foreground, fontSize: 15 * fontScale }]} numberOfLines={2}>{item.name}</Text><Text style={[styles.group, { color: colors.primary }]}>{item.group}{customExercises.some((custom) => custom.id === item.id) ? " · МОЁ" : ""}</Text><Text style={[styles.equipment, { color: colors.muted, fontSize: 12 * fontScale }]}>{item.equipment}</Text></View><Text style={[styles.cardArrow, { color: colors.muted }]}>›</Text></View></Pressable><Pressable onPress={() => openProgramPicker(item)} style={({ pressed }) => [styles.addToPlan, { borderTopColor: colors.border, opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.addToPlanText, { color: colors.primary }]}>В программу</Text><Text style={[styles.addToPlanArrow, { color: colors.primary }]}>→</Text></Pressable></View>} ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Ничего не найдено. Измените поиск или создайте упражнение вручную.</Text>} />
    <Modal visible={Boolean(programPickerExercise)} transparent animationType="slide" onRequestClose={() => setProgramPickerExercise(null)}><View style={styles.modalBackdrop}><View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: sheetBottomInset }]}><View style={[styles.sheetGrabber, { backgroundColor: colors.border }]} /><Text style={[styles.sheetEyebrow, { color: colors.primary }]}>Добавление в программу</Text><Text style={[styles.sheetTitle, { color: colors.foreground }]}>{programPickerExercise?.name}</Text><Text style={[styles.sheetHint, { color: colors.muted }]}>Выберите программу. Поиск работает по названию и описанию.</Text><TextInput value={programQuery} onChangeText={setProgramQuery} autoFocus placeholder="Найти программу" placeholderTextColor={colors.muted} style={[styles.sheetSearch, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.programList}>{availablePrograms.map((program, index) => <Pressable key={program.id} onPress={() => chooseProgram(program.id)} style={({ pressed }) => [styles.programOption, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.programNumber, { color: colors.muted, fontVariant: ["tabular-nums"] }]}>{String(index + 1).padStart(2, "0")}</Text><View style={{ flex: 1 }}><Text style={[styles.programOptionName, { color: colors.foreground }]}>{program.name}</Text><Text style={[styles.programOptionMeta, { color: colors.muted }]}>{program.exercises.length} упражнений · {program.description}</Text></View><Text style={[styles.programOptionArrow, { color: colors.muted }]}>→</Text></Pressable>)}</ScrollView><Pressable onPress={() => setProgramPickerExercise(null)} style={[styles.sheetCancel, { borderColor: colors.border }]}><Text style={[styles.sheetCancelText, { color: colors.foreground }]}>Отмена</Text></Pressable></View></View></Modal>
    <Modal visible={showManualForm} transparent animationType="slide" onRequestClose={() => setShowManualForm(false)}><View style={styles.modalBackdrop}><View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: sheetBottomInset }]}><View style={[styles.sheetGrabber, { backgroundColor: colors.border }]} /><Text style={[styles.sheetEyebrow, { color: colors.primary }]}>Личный каталог</Text><Text style={[styles.sheetTitle, { color: colors.foreground }]}>Новое упражнение</Text><TextInput value={manualName} onChangeText={setManualName} autoFocus placeholder="Название упражнения" placeholderTextColor={colors.muted} style={[styles.sheetSearch, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.formLabel, { color: colors.muted }]}>Группа мышц</Text><View style={styles.groupGrid}>{selectableGroups.map((group) => <Pressable key={group} onPress={() => setManualGroup(group)} style={({ pressed }) => [styles.groupChip, { borderColor: manualGroup === group ? colors.primary : colors.border, backgroundColor: manualGroup === group ? colors.primary : colors.background, opacity: pressed ? pressedOpacity : 1 }]}><Text style={{ color: manualGroup === group ? "#10150E" : colors.foreground, fontSize: 12, fontWeight: "700" }}>{group}</Text></Pressable>)}</View><TextInput value={manualEquipment} onChangeText={setManualEquipment} placeholder="Оборудование" placeholderTextColor={colors.muted} style={[styles.sheetSearch, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><TextInput value={manualDescription} onChangeText={setManualDescription} placeholder="Краткая подсказка по технике (необязательно)" placeholderTextColor={colors.muted} multiline style={[styles.descriptionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.formActions}><Pressable onPress={() => setShowManualForm(false)} style={[styles.sheetCancel, { flex: 1, borderColor: colors.border }]}><Text style={[styles.sheetCancelText, { color: colors.foreground }]}>Отмена</Text></Pressable><Pressable onPress={saveManualExercise} style={[styles.formSave, { backgroundColor: colors.primary, ...shadows.card }]}><Text style={[styles.formSaveText, { color: colors.background }]}>Создать</Text></Pressable></View></View></View></Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 6, paddingBottom: 30 },
  headerBlock: { marginBottom: 10 },
  header: { paddingTop: 14, paddingBottom: 13, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  eyebrow: { ...typeTokens.eyebrow },
  title: { ...typeTokens.title, fontSize: 26 },
  subtitle: { ...typeTokens.body, marginTop: 6, maxWidth: 290 },
  createButton: { width: 44, height: 44, borderRadius: radius.tile, alignItems: "center", justifyContent: "center" },
  createButtonText: { fontSize: 24, lineHeight: 26, fontWeight: "800" },
  search: { marginTop: 13, borderWidth: 1, borderRadius: radius.button, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, height: 46 },
  searchMark: { fontSize: 19, fontWeight: "700" },
  input: { flex: 1, fontWeight: "600", minHeight: minTouchTarget - 2 },
  filters: { gap: 8, paddingVertical: 12 },
  filter: { borderWidth: 1, borderRadius: radius.chip, paddingHorizontal: 15, minHeight: 36, alignItems: "center", justifyContent: "center" },
  catalogMeta: { minHeight: 38, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catalogMetaLabel: { ...typeTokens.meta },
  catalogMetaValue: { fontSize: 15, fontWeight: "800" },
  card: { borderWidth: 1, borderRadius: radius.card, overflow: "hidden", marginBottom: 10 },
  cardMain: { flexDirection: "row", alignItems: "center", minHeight: 96, padding: 12, gap: 12 },
  image: { width: 72, height: 72, borderRadius: radius.input, borderWidth: 1 },
  cardBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  cardCopy: { flex: 1 },
  cardTitle: { fontWeight: "700", lineHeight: 19 },
  group: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 5 },
  equipment: { marginTop: 4 },
  cardArrow: { fontSize: 20, fontWeight: "400", opacity: 0.7 },
  addToPlan: { minHeight: 40, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addToPlanText: { fontSize: 12, fontWeight: "800" },
  addToPlanArrow: { fontSize: 16, fontWeight: "700" },
  empty: { paddingVertical: 30, textAlign: "center", lineHeight: 19 },
  modalBackdrop: { flex: 1, backgroundColor: "#050806B8", justifyContent: "flex-end" },
  sheet: { maxHeight: "90%", borderWidth: 1, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: 18, gap: 10, position: "relative" },
  sheetGrabber: { alignSelf: "center", width: 44, height: 4, borderRadius: 2, marginTop: -4, marginBottom: 6 },
  sheetEyebrow: { ...typeTokens.eyebrow, marginTop: 2 },
  sheetTitle: { ...typeTokens.title },
  sheetHint: { fontSize: 12, lineHeight: 17 },
  sheetSearch: { minHeight: 48, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: 13, fontSize: 14, fontWeight: "600" },
  programList: { gap: 8, paddingTop: 2 },
  programOption: { minHeight: 60, borderWidth: 1, borderRadius: radius.tile, padding: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  programNumber: { width: 26, fontSize: 13, fontWeight: "800" },
  programOptionName: { fontSize: 14, fontWeight: "700" },
  programOptionMeta: { fontSize: 11, marginTop: 4 },
  programOptionArrow: { fontSize: 18, fontWeight: "700" },
  sheetCancel: { minHeight: minTouchTarget, borderWidth: 1, borderRadius: radius.button, alignItems: "center", justifyContent: "center", marginTop: 2 },
  sheetCancelText: { fontSize: 13, fontWeight: "800" },
  formLabel: { ...typeTokens.eyebrow, marginTop: 2 },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  groupChip: { minHeight: 36, borderWidth: 1, borderRadius: radius.chip, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  descriptionInput: { minHeight: 76, borderWidth: 1, borderRadius: radius.input, padding: 12, fontSize: 13, textAlignVertical: "top" },
  formActions: { flexDirection: "row", gap: 10 },
  formSave: { flex: 1, minHeight: minTouchTarget, borderRadius: radius.button, alignItems: "center", justifyContent: "center", marginTop: 2 },
  formSaveText: { fontSize: 13, fontWeight: "800" },
});
