import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { exercises, type ProgramExercise, type SetType } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";
import { useColors } from "@/hooks/use-colors";

const types: { id: SetType; label: string }[] = [
  { id: "warmup", label: "Разминка" },
  { id: "working", label: "Рабочий" },
  { id: "drop", label: "Дроп-сет" },
  { id: "failure", label: "Отказной" },
];

export default function NewProgramScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ exerciseId?: string; programId?: string }>();
  const { addProgram, updateProgram, programs, customExercises } = useWorkoutStore();
  const editingProgram = programs.find((program) => program.id === params.programId);
  const initialSelected = editingProgram?.exercises.map((item) => item.exerciseId) ?? (params.exerciseId ? [params.exerciseId] : ["bench-press", "barbell-row", "squat"]);
  const [name, setName] = useState(editingProgram?.name ?? "Моя тренировка");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8");
  const [weight, setWeight] = useState("40");
  const [rest, setRest] = useState("90");
  const [setType, setSetType] = useState<SetType>("working");
  const [supersetEnabled, setSupersetEnabled] = useState(false);

  const catalog = useMemo(() => [...exercises, ...customExercises], [customExercises]);
  const selectedIds = useMemo(() => new Set(selected), [selected]);
  const customExerciseIds = useMemo(() => new Set(customExercises.map((exercise) => exercise.id)), [customExercises]);
  const selectedExercises = useMemo(() => selected.flatMap((id) => {
    const exercise = catalog.find((item) => item.id === id);
    return exercise ? [exercise] : [];
  }), [catalog, selected]);
  const matchingExercises = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    return catalog.filter((exercise) => {
      const matchesSearch = `${exercise.name} ${exercise.group} ${exercise.equipment}`.toLocaleLowerCase("ru").includes(query);
      return matchesSearch && !selectedIds.has(exercise.id);
    });
  }, [catalog, search, selectedIds]);

  const save = () => {
    if (!name.trim() || !selected.length) {
      Alert.alert("Проверьте программу", "Укажите название и добавьте хотя бы одно упражнение.");
      return;
    }
    const items: ProgramExercise[] = selected.map((id, index) => {
      const existing = editingProgram?.exercises.find((item) => item.exerciseId === id);
      return existing ?? {
        exerciseId: id,
        sets: Number(sets) || 3,
        reps: Number(reps) || 8,
        weight: Number(weight) || 0,
        rest: Number(rest) || 90,
        setType,
        supersetGroup: supersetEnabled && index < 2 ? "A" : undefined,
      };
    });
    const description = `${selected.length} упражнения · ${supersetEnabled ? "1 суперсет · " : ""}собственный план`;
    if (editingProgram) updateProgram(editingProgram.id, { name, description, exercises: items });
    else addProgram({ id: `custom-${Date.now()}`, name, description, exercises: items });
    router.replace("/(tabs)/programs");
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>{editingProgram ? "Редактирование" : "Новая программа"}</Text>
          <Pressable onPress={save}><Text style={[styles.saveTop, { color: colors.primary }]}>Сохранить</Text></Pressable>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{editingProgram ? "Настрой программу" : "Собери свой план"}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Выбранные упражнения собраны сверху. Используйте каталог ниже, чтобы добавить новые движения.</Text>

        <Text style={[styles.label, { color: colors.muted }]}>НАЗВАНИЕ</Text>
        <TextInput value={name} onChangeText={setName} style={[styles.nameInput, { backgroundColor: colors.surface, color: colors.foreground }]} maxLength={60} returnKeyType="done" />

        <Text style={[styles.section, { color: colors.foreground }]}>Упражнения · {selected.length}</Text>
        {selectedExercises.length > 0 && (
          <View style={[styles.selectedPanel, { backgroundColor: `${colors.primary}0E`, borderColor: `${colors.primary}5C` }]}>
            <View style={styles.selectedPanelHeader}>
              <View>
                <Text style={[styles.selectedEyebrow, { color: colors.primary }]}>В ПРОГРАММЕ · {selectedExercises.length}</Text>
                <Text style={[styles.selectedHint, { color: colors.muted }]}>Нажмите упражнение, чтобы убрать его из плана.</Text>
              </View>
              <View style={[styles.selectedCount, { backgroundColor: colors.primary }]}><Text style={styles.selectedCountText}>{selectedExercises.length}</Text></View>
            </View>
            {selectedExercises.map((exercise, index) => (
              <Pressable
                key={exercise.id}
                onPress={() => setSelected((current) => current.filter((id) => id !== exercise.id))}
                style={({ pressed }) => [styles.selectedExercise, { backgroundColor: colors.background, borderColor: `${colors.primary}38`, opacity: pressed ? 0.72 : 1 }]}
              >
                <View style={[styles.order, { backgroundColor: colors.primary }]}><Text style={styles.orderText}>{index + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseName, { color: colors.foreground }]}>{exercise.name}{supersetEnabled && index < 2 ? " · SS A" : ""}</Text>
                  <Text style={[styles.exerciseGroup, { color: colors.muted }]}>{exercise.group} · {exercise.equipment}{customExerciseIds.has(exercise.id) ? " · Моё" : ""}</Text>
                </View>
                <Text style={[styles.removeText, { color: colors.error }]}>Убрать</Text>
              </Pressable>
            ))}
          </View>
        )}

        {selected.length >= 2 && (
          <Pressable onPress={() => setSupersetEnabled((value) => !value)} style={[styles.supersetToggle, { borderColor: supersetEnabled ? colors.primary : colors.border, backgroundColor: supersetEnabled ? `${colors.primary}14` : colors.surface }]}>
            <View>
              <Text style={[styles.supersetTitle, { color: colors.foreground }]}>{supersetEnabled ? "Суперсет A включён" : "Объединить первые два упражнения"}</Text>
              <Text style={[styles.supersetHint, { color: colors.muted }]}>{supersetEnabled ? "Они выполняются подряд без отдыха между ними." : "Нажмите, чтобы создать суперсет A."}</Text>
            </View>
            <IconSymbol name={supersetEnabled ? "checkmark" : "plus"} size={20} color={colors.primary} />
          </Pressable>
        )}

        <View style={styles.catalogHeader}>
          <Text style={[styles.catalogTitle, { color: colors.foreground }]}>Добавить из каталога</Text>
          <Text style={[styles.catalogHint, { color: colors.muted }]}>В списке только ещё не выбранные упражнения.</Text>
        </View>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, fontSize: 18 }}>⌕</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="Поиск упражнения" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" />
        </View>
        {matchingExercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            onPress={() => setSelected((current) => [...current, exercise.id])}
            style={({ pressed }) => [styles.exercise, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.74 }]}
          >
            <View style={[styles.addMark, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="plus" size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.exerciseName, { color: colors.foreground }]}>{exercise.name}</Text>
              <Text style={[styles.exerciseGroup, { color: colors.muted }]}>{exercise.group} · {exercise.equipment}{customExerciseIds.has(exercise.id) ? " · Моё" : ""}</Text>
            </View>
          </Pressable>
        ))}
        {!matchingExercises.length && <Text style={[styles.empty, { color: colors.muted }]}>{search.trim() ? "Ничего не найдено. Измените запрос или добавьте упражнение в каталоге." : "Все доступные упражнения уже добавлены в программу."}</Text>}

        <Text style={[styles.section, { color: colors.foreground, marginTop: 5 }]}>План по умолчанию</Text>
        <View style={styles.fields}>
          {([
            { label: "Подходы", value: sets, setter: setSets },
            { label: "Повторы", value: reps, setter: setReps },
            { label: "Вес, кг", value: weight, setter: setWeight },
            { label: "Отдых, сек", value: rest, setter: setRest },
          ]).map((field) => (
            <View key={field.label} style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{field.label}</Text>
              <TextInput keyboardType="decimal-pad" value={field.value} onChangeText={field.setter} style={[styles.field, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]} />
            </View>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>ТИП НОВЫХ ПОДХОДОВ</Text>
        <View style={styles.typeRow}>
          {types.map((type) => (
            <Pressable key={type.id} onPress={() => setSetType(type.id)} style={[styles.type, { borderColor: setType === type.id ? colors.primary : colors.border, backgroundColor: setType === type.id ? `${colors.primary}16` : colors.surface }]}>
              <Text style={[styles.typeText, { color: setType === type.id ? colors.primary : colors.muted }]}>{type.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={save} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>{editingProgram ? "Сохранить изменения" : "Сохранить программу"}</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 32, gap: 12 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navTitle: { fontWeight: "800", fontSize: 16 },
  saveTop: { fontSize: 13, fontWeight: "800" },
  title: { fontSize: 28, fontWeight: "800", marginTop: 7 },
  subtitle: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 8 },
  nameInput: { height: 51, borderRadius: 14, paddingHorizontal: 14, fontSize: 15, fontWeight: "700" },
  section: { fontSize: 19, fontWeight: "800", marginTop: 8 },
  selectedPanel: { borderWidth: 1, borderRadius: 18, padding: 11, gap: 8 },
  selectedPanelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingHorizontal: 2, paddingBottom: 2 },
  selectedEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  selectedHint: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  selectedCount: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  selectedCountText: { color: "#101412", fontSize: 12, fontWeight: "900" },
  selectedExercise: { minHeight: 58, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 9 },
  order: { width: 25, height: 25, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  orderText: { color: "#101412", fontSize: 11, fontWeight: "900" },
  removeText: { fontSize: 10, fontWeight: "900" },
  catalogHeader: { marginTop: 3, gap: 2 },
  catalogTitle: { fontSize: 15, fontWeight: "900" },
  catalogHint: { fontSize: 10, lineHeight: 14 },
  search: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, alignItems: "center", flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  supersetToggle: { minHeight: 64, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  supersetTitle: { fontSize: 13, fontWeight: "800" },
  supersetHint: { fontSize: 10, marginTop: 4 },
  exercise: { minHeight: 62, borderRadius: 16, borderWidth: 1, padding: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  addMark: { width: 27, height: 27, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  exerciseName: { fontSize: 13, fontWeight: "800" },
  exerciseGroup: { fontSize: 11, marginTop: 4 },
  empty: { fontSize: 12, paddingVertical: 8 },
  fields: { flexDirection: "row", gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: "700", marginBottom: 5 },
  field: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, fontSize: 15, fontWeight: "800" },
  typeRow: { flexWrap: "wrap", flexDirection: "row", gap: 7 },
  type: { borderRadius: 11, borderWidth: 1, paddingHorizontal: 11, minHeight: 37, alignItems: "center", justifyContent: "center" },
  typeText: { fontSize: 11, fontWeight: "800" },
  button: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 8 },
  buttonText: { color: "#101412", fontSize: 15, fontWeight: "800" },
});
