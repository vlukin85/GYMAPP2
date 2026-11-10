import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ESTIMATED_SECONDS_PER_REP, MAX_BETWEEN_SET_REST_SECONDS, MAX_PROGRAM_REST_BLOCK_SECONDS, MIN_BETWEEN_SET_REST_SECONDS, MIN_PROGRAM_REST_BLOCK_SECONDS, estimateProgramDurationSeconds, exercises, formatProgramDuration, muscleGroups, normalizeBetweenSetRestSeconds, normalizeProgramRestBlocks, type MuscleGroup, type ProgramExercise, type ProgramRestBlock, type SetType } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/i18n";
import { equipmentLabel, exerciseName, muscleGroupLabel } from "@/lib/i18n/exercise-labels";

const EMPTY_EXERCISE_SETTINGS = { sets: "", reps: "", weight: "", restBetweenSets: "" };

function ensureProgramRestBlocks(value: unknown, exerciseIds: string[]) {
  const validExerciseIds = new Set(exerciseIds);
  const existingByExerciseId = new Map<string, ProgramRestBlock>();
  if (Array.isArray(value)) {
    value.forEach((candidate) => {
      if (!candidate || typeof candidate !== "object") return;
      const block = candidate as Partial<ProgramRestBlock>;
      if (typeof block.afterExerciseId !== "string" || !validExerciseIds.has(block.afterExerciseId) || existingByExerciseId.has(block.afterExerciseId) || typeof block.durationSeconds !== "number" || !Number.isFinite(block.durationSeconds)) return;
      existingByExerciseId.set(block.afterExerciseId, {
        id: typeof block.id === "string" && block.id.trim() ? block.id : `rest-${block.afterExerciseId}`,
        afterExerciseId: block.afterExerciseId,
        durationSeconds: Math.max(0, Math.round(block.durationSeconds)),
      });
    });
  }
  return exerciseIds.slice(0, -1).map((exerciseId) => existingByExerciseId.get(exerciseId) ?? {
    id: `rest-${exerciseId}`,
    afterExerciseId: exerciseId,
    durationSeconds: 0,
  });
}

const types: { id: SetType }[] = [{ id: "warmup" }, { id: "working" }, { id: "drop" }, { id: "failure" }];

/** Ключи словаря для типов подходов: подпись выбирается по текущему языку. */
const setTypeLabelKeys = {
  warmup: "programs.builder.setType.warmup",
  working: "programs.builder.setType.working",
  drop: "programs.builder.setType.drop",
  failure: "programs.builder.setType.failure",
} as const;

export default function NewProgramScreen() {
  const colors = useColors();
  const { lang, t } = useLanguage();
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const params = useLocalSearchParams<{ exerciseId?: string; programId?: string }>();
  const { addProgram, updateProgram, programs, customExercises } = useWorkoutStore();
  const editingProgram = programs.find((program) => program.id === params.programId);
  const initialSelected = editingProgram?.exercises.map((item) => item.exerciseId) ?? (params.exerciseId ? [params.exerciseId] : []);
  const [name, setName] = useState(editingProgram?.name ?? t("programs.builder.defaultName"));
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState("");
  const [catalogGroup, setCatalogGroup] = useState<MuscleGroup | "Все">("Все");
  const [setType, setSetType] = useState<SetType>("working");
  const [supersetEnabled, setSupersetEnabled] = useState(false);
  const [restBlocks, setRestBlocks] = useState<ProgramRestBlock[]>(() => ensureProgramRestBlocks(editingProgram?.restBlocks, initialSelected));
  const [exerciseSettings, setExerciseSettings] = useState<Record<string, { sets: string; reps: string; weight: string; restBetweenSets: string }>>(() => Object.fromEntries(initialSelected.map((exerciseId) => {
    const existing = editingProgram?.exercises.find((item) => item.exerciseId === exerciseId);
    return [exerciseId, {
      sets: existing ? String(existing.sets) : "",
      reps: existing ? String(existing.reps) : "",
      weight: existing ? String(existing.weight) : "",
      restBetweenSets: existing ? String(existing.restBetweenSets ?? existing.rest ?? "") : "",
    }];
  })));

  const catalog = useMemo(() => [...exercises, ...customExercises], [customExercises]);
  const selectedIds = useMemo(() => new Set(selected), [selected]);
  const customExerciseIds = useMemo(() => new Set(customExercises.map((exercise) => exercise.id)), [customExercises]);
  const selectedExercises = useMemo(() => selected.flatMap((id) => {
    const exercise = catalog.find((item) => item.id === id);
    return exercise ? [exercise] : [];
  }), [catalog, selected]);
  const restBlockByExerciseId = useMemo(() => new Map(restBlocks.map((block) => [block.afterExerciseId, block])), [restBlocks]);
  const matchingExercises = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    return catalog.filter((exercise) => {
      const matchesSearch = `${exerciseName(exercise, lang)} ${exercise.name} ${muscleGroupLabel(exercise.group, lang)} ${exercise.group} ${equipmentLabel(exercise.equipment, lang)} ${exercise.equipment}`.toLocaleLowerCase(locale).includes(query);
      const matchesGroup = catalogGroup === "Все" || exercise.group === catalogGroup;
      return matchesSearch && matchesGroup && !selectedIds.has(exercise.id);
    });
  }, [catalog, catalogGroup, lang, locale, search, selectedIds]);

  const save = () => {
    if (!name.trim() || !selected.length) {
      Alert.alert(t("programs.builder.validationTitle"), t("programs.builder.validationMessage"));
      return;
    }
    const invalidExercise = selectedExercises.find((exercise) => {
      const settings = exerciseSettings[exercise.id] ?? { sets: "", reps: "", weight: "", restBetweenSets: "" };
      const setsValue = Number(settings.sets.replace(",", "."));
      const repsValue = Number(settings.reps.replace(",", "."));
      const weightValue = Number(settings.weight.replace(",", "."));
      const restValue = Number(settings.restBetweenSets.replace(",", "."));
      return !settings.sets.trim() || !Number.isInteger(setsValue) || setsValue < 1
        || !settings.reps.trim() || !Number.isInteger(repsValue) || repsValue < 1
        || !settings.weight.trim() || !Number.isFinite(weightValue) || weightValue < 0
        || !settings.restBetweenSets.trim() || !Number.isInteger(restValue) || restValue < MIN_BETWEEN_SET_REST_SECONDS || restValue > MAX_BETWEEN_SET_REST_SECONDS;
    });
    if (invalidExercise) {
      Alert.alert(t("programs.builder.paramsTitle"), t("programs.builder.paramsMessage", { name: exerciseName(invalidExercise, lang) }));
      return;
    }
    const missingTransitionRest = selectedExercises.slice(0, -1).find((exercise) => {
      const duration = restBlockByExerciseId.get(exercise.id)?.durationSeconds ?? 0;
      return !Number.isInteger(duration) || duration < MIN_PROGRAM_REST_BLOCK_SECONDS || duration > MAX_PROGRAM_REST_BLOCK_SECONDS;
    });
    if (missingTransitionRest) {
      Alert.alert(t("programs.builder.restTitle"), t("programs.builder.restMessage", { name: exerciseName(missingTransitionRest, lang) }));
      return;
    }
    const items: ProgramExercise[] = selected.map((id, index) => {
      const existing = editingProgram?.exercises.find((item) => item.exerciseId === id);
      const settings = exerciseSettings[id] ?? { sets: "", reps: "", weight: "", restBetweenSets: "" };
      const setsValue = Math.round(Number(settings.sets.replace(",", ".")));
      const repsValue = Math.round(Number(settings.reps.replace(",", ".")));
      const weightValue = Number(settings.weight.replace(",", "."));
      const restValue = Math.round(Number(settings.restBetweenSets.replace(",", ".")));
      return {
        ...(existing ?? {}),
        exerciseId: id,
        sets: setsValue,
        reps: repsValue,
        weight: weightValue,
        rest: restValue,
        restBetweenSets: normalizeBetweenSetRestSeconds(restValue),
        setType: existing?.setType ?? setType,
        supersetGroup: existing?.supersetGroup ?? (supersetEnabled && index < 2 ? "A" : undefined),
      };
    });
    const savedRestBlocks = normalizeProgramRestBlocks(restBlocks, selected).filter((block) => block.afterExerciseId !== selected[selected.length - 1]);
    const description = t("programs.builder.description", { count: selected.length, rest: savedRestBlocks.length ? t("programs.builder.descriptionRest", { count: savedRestBlocks.length }) : "", superset: supersetEnabled ? t("programs.builder.descriptionSuperset") : "" });
    if (editingProgram) updateProgram(editingProgram.id, { name, description, exercises: items, restBlocks: savedRestBlocks });
    else addProgram({ id: `custom-${Date.now()}`, name, description, exercises: items, restBlocks: savedRestBlocks });
    router.replace("/(tabs)/programs");
  };

  const removeExerciseFromProgram = (exerciseId: string) => {
    setSelected((current) => current.filter((id) => id !== exerciseId));
    setRestBlocks((current) => current.filter((block) => block.afterExerciseId !== exerciseId));
    setExerciseSettings((current) => {
      const next = { ...current };
      delete next[exerciseId];
      return next;
    });
  };
  const addExerciseToProgram = (exerciseId: string) => {
    const nextSelected = [...selected, exerciseId];
    setSelected(nextSelected);
    setExerciseSettings((current) => ({ ...current, [exerciseId]: current[exerciseId] ?? { ...EMPTY_EXERCISE_SETTINGS } }));
    setRestBlocks((current) => ensureProgramRestBlocks(current, nextSelected));
  };
  const updateExerciseSetting = (exerciseId: string, field: "sets" | "reps" | "weight" | "restBetweenSets", value: string) => {
    setExerciseSettings((current) => ({
      ...current,
      [exerciseId]: {
        ...(current[exerciseId] ?? EMPTY_EXERCISE_SETTINGS),
        [field]: value,
      },
    }));
  };
  const updateRestBlockDuration = (exerciseId: string, value: string) => {
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed)) return;
    const durationSeconds = value.trim() === "" ? 0 : Math.round(parsed);
    setRestBlocks((current) => current.map((block) => block.afterExerciseId === exerciseId ? { ...block, durationSeconds } : block));
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} accessibilityLabel={t("programs.builder.backA11y")}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>{editingProgram ? t("programs.builder.navEdit") : t("programs.builder.navNew")}</Text>
          <Pressable onPress={save}><Text style={[styles.saveTop, { color: colors.primary }]}>{t("programs.builder.saveTop")}</Text></Pressable>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{editingProgram ? t("programs.builder.titleEdit") : t("programs.builder.titleNew")}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t("programs.builder.subtitle")}</Text>

        <Text style={[styles.label, { color: colors.muted }]}>{t("programs.builder.nameLabel")}</Text>
        <TextInput value={name} onChangeText={setName} style={[styles.nameInput, { backgroundColor: colors.surface, color: colors.foreground }]} maxLength={60} returnKeyType="done" />

        <Text style={[styles.section, { color: colors.foreground }]}>{t("programs.builder.exercises", { count: selected.length })}</Text>
        {selectedExercises.length > 0 && (() => {
          const hasCompleteParameters = selectedExercises.every((exercise) => {
            const settings = exerciseSettings[exercise.id] ?? EMPTY_EXERCISE_SETTINGS;
            const setsValue = Number(settings.sets.replace(",", "."));
            const repsValue = Number(settings.reps.replace(",", "."));
            const weightValue = Number(settings.weight.replace(",", "."));
            const restValue = Number(settings.restBetweenSets.replace(",", "."));
            return settings.sets.trim() && Number.isInteger(setsValue) && setsValue > 0 && settings.reps.trim() && Number.isInteger(repsValue) && repsValue > 0 && settings.weight.trim() && Number.isFinite(weightValue) && weightValue >= 0 && settings.restBetweenSets.trim() && Number.isInteger(restValue) && restValue >= MIN_BETWEEN_SET_REST_SECONDS && restValue <= MAX_BETWEEN_SET_REST_SECONDS;
          });
          const hasCompleteTransitionRest = selectedExercises.slice(0, -1).every((exercise) => {
            const duration = restBlockByExerciseId.get(exercise.id)?.durationSeconds ?? 0;
            return Number.isInteger(duration) && duration >= MIN_PROGRAM_REST_BLOCK_SECONDS && duration <= MAX_PROGRAM_REST_BLOCK_SECONDS;
          });
          if (!hasCompleteParameters || !hasCompleteTransitionRest) return <View style={[styles.durationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.durationTitle, { color: colors.foreground }]}>{t("programs.builder.durationTitle")}</Text><Text style={[styles.durationHint, { color: colors.muted }]}>{t("programs.builder.durationIncomplete")}</Text></View>;
          const estimateItems = selectedExercises.map((exercise) => {
            const settings = exerciseSettings[exercise.id];
            return { sets: Number(settings.sets.replace(",", ".")), reps: Number(settings.reps.replace(",", ".")), rest: Number(settings.restBetweenSets.replace(",", ".")), restBetweenSets: Number(settings.restBetweenSets.replace(",", ".")) };
          });
          return <View style={[styles.durationCard, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}66` }]}><Text style={[styles.durationTitle, { color: colors.foreground }]}>{t("programs.builder.durationTitle")}</Text><Text style={[styles.durationValue, { color: colors.primary }]}>{formatProgramDuration(estimateProgramDurationSeconds(estimateItems, restBlocks), lang)}</Text><Text style={[styles.durationHint, { color: colors.muted }]}>{t("programs.builder.durationHint", { seconds: ESTIMATED_SECONDS_PER_REP })}</Text></View>;
        })()}
        {selectedExercises.length > 0 && (
          <View style={[styles.selectedPanel, { backgroundColor: `${colors.primary}0E`, borderColor: `${colors.primary}5C` }]}>
            <Text style={[styles.selectedHint, { color: colors.muted }]}>{t("programs.builder.selectedHint")}</Text>
            {selectedExercises.map((exercise, index) => {
                const settings = exerciseSettings[exercise.id] ?? { sets: "", reps: "", weight: "", restBetweenSets: "" };
              return <View key={exercise.id} style={styles.programSequenceItem}>
                <View style={[styles.exerciseSettingsRow, { backgroundColor: colors.background, borderColor: `${colors.primary}38` }]}>
                  <View style={styles.exerciseSettingsHeader}>
                    <View style={[styles.order, { backgroundColor: colors.primary }]}><Text style={styles.orderText}>{index + 1}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exerciseSettingsName, { color: colors.foreground }]} numberOfLines={1}>{exerciseName(exercise, lang)}{supersetEnabled && index < 2 ? t("programs.builder.supersetBadge") : ""}</Text>
                      <Text style={[styles.exerciseGroup, { color: colors.muted }]}>{muscleGroupLabel(exercise.group, lang)} · {equipmentLabel(exercise.equipment, lang)}{customExerciseIds.has(exercise.id) ? t("programs.builder.mine") : ""}</Text>
                    </View>
                    <Pressable onPress={() => removeExerciseFromProgram(exercise.id)} hitSlop={8}><Text style={[styles.restBlockRemove, { color: colors.error }]}>×</Text></Pressable>
                  </View>
                  <View style={styles.exerciseSettingsFields}>
                    {([
                      ["sets", t("programs.builder.sets"), settings.sets],
                      ["reps", t("programs.builder.reps"), settings.reps],
                      ["weight", t("programs.builder.weightKg"), settings.weight],
                      ["restBetweenSets", t("programs.builder.restSec"), settings.restBetweenSets],
                    ] as const).map(([field, label, value]) => <View key={field} style={styles.exerciseSettingField}>
                      <Text style={[styles.exerciseSettingLabel, { color: colors.muted }]}>{label}</Text>
                      <TextInput value={value} onChangeText={(nextValue) => updateExerciseSetting(exercise.id, field, nextValue)} keyboardType="decimal-pad" style={[styles.exerciseSettingInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
                    </View>)}
                  </View>
                </View>
                {index < selectedExercises.length - 1 && (() => {
                  const restBlock = restBlockByExerciseId.get(exercise.id);
                  if (!restBlock) return null;
                  return <View style={[styles.restBlock, { backgroundColor: colors.surface, borderColor: `${colors.primary}66` }]}>
                    <View style={styles.restBlockCopy}><Text style={[styles.restBlockTitle, { color: colors.foreground }]}>{t("programs.builder.restBetweenTitle")}</Text><Text style={[styles.restBlockHint, { color: colors.muted }]}>{t("programs.builder.restBetweenHint")}</Text></View>
                    <TextInput value={restBlock.durationSeconds > 0 ? String(restBlock.durationSeconds) : ""} placeholder={t("programs.builder.secPlaceholder")} placeholderTextColor={colors.muted} onChangeText={(value) => updateRestBlockDuration(exercise.id, value)} keyboardType="number-pad" returnKeyType="done" style={[styles.restBlockInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.restBlockUnit, { color: colors.muted }]}>{t("programs.builder.sec")}</Text>
                  </View>;
                })()}
              </View>;
            })}
          </View>
        )}

        {selected.length >= 2 && (
          <Pressable onPress={() => setSupersetEnabled((value) => !value)} style={[styles.supersetToggle, { borderColor: supersetEnabled ? colors.primary : colors.border, backgroundColor: supersetEnabled ? `${colors.primary}14` : colors.surface }]}>
            <View>
              <Text style={[styles.supersetTitle, { color: colors.foreground }]}>{supersetEnabled ? t("programs.builder.supersetOn") : t("programs.builder.supersetOff")}</Text>
              <Text style={[styles.supersetHint, { color: colors.muted }]}>{supersetEnabled ? t("programs.builder.supersetOnHint") : t("programs.builder.supersetOffHint")}</Text>
            </View>
            <IconSymbol name={supersetEnabled ? "checkmark" : "plus"} size={20} color={colors.primary} />
          </Pressable>
        )}

        <View style={styles.catalogHeader}>
          <Text style={[styles.catalogTitle, { color: colors.foreground }]}>{t("programs.builder.catalogTitle")}</Text>
          <Text style={[styles.catalogHint, { color: colors.muted }]}>{t("programs.builder.catalogHint")}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilters} keyboardShouldPersistTaps="handled">
          {muscleGroups.map((group) => (
            <Pressable key={group} onPress={() => setCatalogGroup(group)} style={({ pressed }) => [styles.groupFilter, { borderColor: catalogGroup === group ? colors.primary : colors.border, backgroundColor: catalogGroup === group ? colors.primary : colors.surface, opacity: pressed ? 0.75 : 1 }]}>
              <Text style={[styles.groupFilterText, { color: catalogGroup === group ? "#101412" : colors.foreground }]}>{muscleGroupLabel(group, lang)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, fontSize: 18 }}>⌕</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder={t("programs.builder.searchPlaceholder")} placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" />
        </View>
        {matchingExercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            onPress={() => addExerciseToProgram(exercise.id)}
            style={({ pressed }) => [styles.exercise, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.74 }]}
          >
            <View style={[styles.addMark, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="plus" size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.exerciseName, { color: colors.foreground }]}>{exerciseName(exercise, lang)}</Text>
              <Text style={[styles.exerciseGroup, { color: colors.muted }]}>{muscleGroupLabel(exercise.group, lang)} · {equipmentLabel(exercise.equipment, lang)}{customExerciseIds.has(exercise.id) ? t("programs.builder.mine") : ""}</Text>
            </View>
          </Pressable>
        ))}
        {!matchingExercises.length && <Text style={[styles.empty, { color: colors.muted }]}>{search.trim() ? t("programs.builder.emptySearch") : t("programs.builder.emptyAll")}</Text>}

        <Text style={[styles.label, { color: colors.muted }]}>{t("programs.builder.setTypeLabel")}</Text>
        <View style={styles.typeRow}>
          {types.map((type) => (
            <Pressable key={type.id} onPress={() => setSetType(type.id)} style={[styles.type, { borderColor: setType === type.id ? colors.primary : colors.border, backgroundColor: setType === type.id ? `${colors.primary}16` : colors.surface }]}>
              <Text style={[styles.typeText, { color: setType === type.id ? colors.primary : colors.muted }]}>{t(setTypeLabelKeys[type.id])}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={save} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>{editingProgram ? t("programs.builder.saveChanges") : t("programs.builder.saveProgram")}</Text></Pressable>
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
  programSequenceItem: { gap: 7 },
  selectedHint: { fontSize: 10, lineHeight: 14, marginBottom: 2 },
  restBlock: { minHeight: 58, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  restBlockCopy: { flex: 1 },
  restBlockTitle: { fontSize: 12, fontWeight: "900" },
  restBlockHint: { fontSize: 9, marginTop: 3 },
  restBlockInput: { width: 54, height: 34, borderRadius: 9, borderWidth: 1, textAlign: "center", fontSize: 13, fontWeight: "900", paddingHorizontal: 4 },
  restBlockUnit: { fontSize: 10, fontWeight: "800" },
  restBlockRemove: { fontSize: 24, lineHeight: 28, fontWeight: "400" },
  durationCard: { borderWidth: 1, borderRadius: 15, padding: 12, gap: 4 },
  durationTitle: { fontSize: 12, fontWeight: "900" },
  durationValue: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  durationHint: { fontSize: 10, lineHeight: 14 },
  exerciseSettingsRow: { borderWidth: 1, borderRadius: 13, padding: 10, gap: 9 },
  exerciseSettingsHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  exerciseSettingsName: { fontSize: 12, fontWeight: "900" },
  exerciseSettingsFields: { flexDirection: "row", gap: 6 },
  exerciseSettingField: { flex: 1, gap: 4 },
  exerciseSettingLabel: { fontSize: 9, fontWeight: "800" },
  exerciseSettingInput: { height: 38, borderWidth: 1, borderRadius: 9, paddingHorizontal: 5, textAlign: "center", fontSize: 13, fontWeight: "800" },
  order: { width: 25, height: 25, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  orderText: { color: "#101412", fontSize: 11, fontWeight: "900" },
  removeText: { fontSize: 10, fontWeight: "900" },
  catalogHeader: { marginTop: 3, gap: 2 },
  catalogTitle: { fontSize: 15, fontWeight: "900" },
  catalogHint: { fontSize: 10, lineHeight: 14 },
  groupFilters: { gap: 8, paddingVertical: 3, paddingRight: 8 },
  groupFilter: { minHeight: 35, paddingHorizontal: 13, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  groupFilterText: { fontSize: 11, fontWeight: "800" },
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
  typeRow: { flexWrap: "wrap", flexDirection: "row", gap: 7 },
  type: { borderRadius: 11, borderWidth: 1, paddingHorizontal: 11, minHeight: 37, alignItems: "center", justifyContent: "center" },
  typeText: { fontSize: 11, fontWeight: "800" },
  button: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 8 },
  buttonText: { color: "#101412", fontSize: 15, fontWeight: "800" },
});
