import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { generateLocalProgram } from "@/lib/ai-program";
import { clearGroqApiKey, getGroqApiKey, saveGroqApiKey } from "@/lib/groq-settings";
import { generateGroqProgram } from "@/lib/groq-program";
import { exercises, type ProgramExercise, type SetType, type WorkoutProgram } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";

type DraftProgram = Omit<WorkoutProgram, "id">;
type NumberField = "sets" | "reps" | "weight" | "rest";
type GenerationMode = "groq" | "local";

const experienceOptions = [{ id: "beginner", label: "Новичок" }, { id: "intermediate", label: "Средний" }, { id: "advanced", label: "Продвинутый" }] as const;
const equipmentOptions = [{ id: "full-gym", label: "Весь зал" }, { id: "machines", label: "Тренажёры" }, { id: "free-weights", label: "Свободные веса" }, { id: "home", label: "Дом" }] as const;
const setTypes: { id: SetType; label: string }[] = [{ id: "working", label: "Раб." }, { id: "warmup", label: "Разм." }, { id: "drop", label: "Дроп" }, { id: "failure", label: "Отказ" }];
const bounds: Record<NumberField, [number, number, number]> = { sets: [1, 8, 1], reps: [1, 30, 1], weight: [0, 500, 2.5], rest: [30, 300, 15] };

export default function AiProgramScreen() {
  const colors = useColors();
  const { addProgram } = useWorkoutStore();
  const [prompt, setPrompt] = useState("Хочу программу для роста силы и мышц всего тела без перегрузки, с акцентом на базовые упражнения.");
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [equipment, setEquipment] = useState<"full-gym" | "machines" | "free-weights" | "home">("full-gym");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [limitations, setLimitations] = useState("");
  const [draft, setDraft] = useState<DraftProgram | null>(null);
  const [picker, setPicker] = useState<{ mode: "replace" | "add"; index?: number } | null>(null);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<GenerationMode>("groq");
  const [hasGroqKey, setHasGroqKey] = useState(false);
  const [keySheetVisible, setKeySheetVisible] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    void getGroqApiKey().then((key) => setHasGroqKey(Boolean(key))).catch(() => setHasGroqKey(false));
  }, []);

  const pickerOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");
    return exercises.filter((exercise) => !query || `${exercise.name} ${exercise.group} ${exercise.equipment}`.toLocaleLowerCase("ru-RU").includes(query)).slice(0, 45);
  }, [search]);

  const parameters = { prompt, experience, equipment, daysPerWeek, sessionMinutes, limitations: limitations.trim() || undefined };
  const openKeySheet = () => { setKeyDraft(""); setKeySheetVisible(true); };
  const saveKey = async () => {
    setSavingKey(true);
    try {
      await saveGroqApiKey(keyDraft);
      setHasGroqKey(true);
      setKeyDraft("");
      setKeySheetVisible(false);
    } catch (error) {
      Alert.alert("Не удалось сохранить ключ", error instanceof Error ? error.message : "Повтори попытку.");
    } finally {
      setSavingKey(false);
    }
  };
  const deleteKey = () => Alert.alert("Удалить личный ключ?", "После удаления режим Groq будет недоступен, пока ключ не добавлен снова.", [
    { text: "Отмена", style: "cancel" },
    { text: "Удалить", style: "destructive", onPress: () => { void clearGroqApiKey().then(() => setHasGroqKey(false)); } },
  ]);
  const generate = async () => {
    if (prompt.trim().length < 12 || generating) return;
    if (mode === "local") {
      setDraft(generateLocalProgram(parameters, exercises));
      return;
    }
    const key = await getGroqApiKey();
    if (!key) {
      openKeySheet();
      Alert.alert("Нужен личный ключ Groq", "Добавь ключ, чтобы сгенерировать программу через Groq. Он хранится только на этом устройстве.");
      return;
    }
    setGenerating(true);
    try {
      setDraft(await generateGroqProgram(parameters, exercises, key));
    } catch (error) {
      Alert.alert("Не удалось сформировать программу", error instanceof Error ? error.message : "Повтори попытку или выбери локальный режим.");
    } finally {
      setGenerating(false);
    }
  };
  const patchDraft = (patch: Partial<DraftProgram>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const updateExercise = (index: number, patch: Partial<ProgramExercise>) => setDraft((current) => current ? { ...current, exercises: current.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } : current);
  const updateNumber = (index: number, field: NumberField, value: string) => {
    const [min, max] = bounds[field];
    const parsed = Number(value.replace(",", "."));
    updateExercise(index, { [field]: Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : min } as Partial<ProgramExercise>);
  };
  const adjust = (index: number, field: NumberField, direction: -1 | 1) => {
    const [min, max, step] = bounds[field];
    const item = draft?.exercises[index];
    if (item) updateExercise(index, { [field]: Math.min(max, Math.max(min, item[field] + direction * step)) } as Partial<ProgramExercise>);
  };
  const openPicker = (next: { mode: "replace" | "add"; index?: number }) => { setSearch(""); setPicker(next); };
  const chooseExercise = (exerciseId: string) => {
    if (!picker) return;
    if (picker.mode === "replace" && picker.index !== undefined) updateExercise(picker.index, { exerciseId });
    else setDraft((current) => current ? { ...current, exercises: [...current.exercises, { exerciseId, sets: 3, reps: 10, weight: 0, rest: 90, setType: "working" }] } : current);
    setPicker(null);
  };
  const removeExercise = (index: number) => {
    if (!draft || draft.exercises.length <= 2) return Alert.alert("Оставь минимум два упражнения", "Так программа останется полноценной тренировкой.");
    patchDraft({ exercises: draft.exercises.filter((_, itemIndex) => itemIndex !== index) });
  };
  const save = () => {
    if (!draft) return;
    addProgram({ ...draft, id: `ai-${Date.now()}` });
    router.replace("/(tabs)/programs");
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.nav}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.navTitle, { color: colors.foreground }]}>Конструктор программ</Text><View style={styles.navStub} /></View>
          <View style={[styles.hero, { backgroundColor: colors.primary }]}><Text style={styles.heroEyebrow}>GROQ + ЛОКАЛЬНЫЙ РЕЖИМ</Text><Text style={styles.heroTitle}>Программа под твой запрос</Text><Text style={styles.heroText}>Groq создаёт черновик по твоему описанию, а локальный конструктор работает без сети. Перед сохранением можно отредактировать каждое упражнение.</Text></View>

          <View style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modeHeader}><View><Text style={[styles.modeTitle, { color: colors.foreground }]}>Режим генерации</Text><Text style={[styles.modeHint, { color: colors.muted }]}>{mode === "groq" ? (hasGroqKey ? "Личный ключ сохранён на устройстве" : "Добавь личный ключ, чтобы использовать Groq") : "Работает полностью на устройстве"}</Text></View><Text style={[styles.modeBadge, { color: mode === "groq" ? colors.primary : colors.muted, backgroundColor: mode === "groq" ? colors.primary + "18" : colors.border }]}>{mode === "groq" ? "GROQ" : "ОФЛАЙН"}</Text></View>
            <View style={styles.modeButtons}>{(["groq", "local"] as GenerationMode[]).map((item) => <Pressable key={item} onPress={() => setMode(item)} style={[styles.modeButton, { backgroundColor: mode === item ? colors.primary : colors.background, borderColor: mode === item ? colors.primary : colors.border }]}><Text style={[styles.modeButtonText, { color: mode === item ? "#101412" : colors.foreground }]}>{item === "groq" ? "Groq AI" : "Локально"}</Text></Pressable>)}</View>
            {mode === "groq" && <View style={styles.keyRow}><Text style={[styles.keyText, { color: colors.muted }]}>{Platform.OS === "web" ? "В веб-просмотре ключ хранится только для тестирования." : "Ключ шифруется в защищённом хранилище Android."}</Text><View style={styles.keyActions}><Pressable onPress={openKeySheet}><Text style={[styles.keyAction, { color: colors.primary }]}>{hasGroqKey ? "Изменить" : "Добавить"}</Text></Pressable>{hasGroqKey && <Pressable onPress={deleteKey}><Text style={[styles.keyAction, { color: colors.error }]}>Удалить</Text></Pressable>}</View></View>}
          </View>

          <Text style={[styles.section, { color: colors.foreground }]}>Твой запрос</Text>
          <TextInput value={prompt} onChangeText={setPrompt} multiline textAlignVertical="top" placeholder="Например: 3 тренировки в неделю для силы, без тяжёлой осевой нагрузки" placeholderTextColor={colors.muted} style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} />
          <Text style={[styles.label, { color: colors.muted }]}>УРОВЕНЬ</Text><View style={styles.chips}>{experienceOptions.map((option) => <Pressable key={option.id} onPress={() => setExperience(option.id)} style={[styles.chip, { backgroundColor: experience === option.id ? colors.primary + "16" : colors.surface, borderColor: experience === option.id ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: experience === option.id ? colors.primary : colors.muted }]}>{option.label}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.muted }]}>ОБОРУДОВАНИЕ</Text><View style={styles.chips}>{equipmentOptions.map((option) => <Pressable key={option.id} onPress={() => setEquipment(option.id)} style={[styles.chip, { backgroundColor: equipment === option.id ? colors.primary + "16" : colors.surface, borderColor: equipment === option.id ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: equipment === option.id ? colors.primary : colors.muted }]}>{option.label}</Text></Pressable>)}</View>
          <View style={styles.parameterRow}><View style={{ flex: 1 }}><Text style={[styles.label, { color: colors.muted }]}>ДНЕЙ В НЕДЕЛЮ</Text><View style={styles.stepper}>{[2, 3, 4, 5].map((day) => <Pressable key={day} onPress={() => setDaysPerWeek(day)} style={[styles.stepperOption, { backgroundColor: daysPerWeek === day ? colors.primary : colors.surface, borderColor: daysPerWeek === day ? colors.primary : colors.border }]}><Text style={[styles.stepperText, { color: daysPerWeek === day ? "#101412" : colors.foreground }]}>{day}</Text></Pressable>)}</View></View><View style={{ flex: 1 }}><Text style={[styles.label, { color: colors.muted }]}>ДЛИТЕЛЬНОСТЬ</Text><View style={styles.stepper}>{[45, 60, 75, 90].map((minutes) => <Pressable key={minutes} onPress={() => setSessionMinutes(minutes)} style={[styles.stepperOption, { backgroundColor: sessionMinutes === minutes ? colors.primary : colors.surface, borderColor: sessionMinutes === minutes ? colors.primary : colors.border }]}><Text style={[styles.stepperText, { color: sessionMinutes === minutes ? "#101412" : colors.foreground }]}>{minutes}</Text></Pressable>)}</View></View></View>
          <Text style={[styles.label, { color: colors.muted }]}>ОГРАНИЧЕНИЯ И ПОЖЕЛАНИЯ</Text><TextInput value={limitations} onChangeText={setLimitations} multiline placeholder="Например: не включать бег, предпочитаю тренажёры" placeholderTextColor={colors.muted} style={[styles.limitations, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} />
          <View style={[styles.safety, { backgroundColor: colors.warning + "14", borderColor: colors.warning + "55" }]}><Text style={[styles.safetyTitle, { color: colors.foreground }]}>Проверяй план перед тренировкой</Text><Text style={[styles.safetyText, { color: colors.muted }]}>Конструктор формирует редактируемый шаблон, а не медицинское назначение. При боли, травме или заболевании согласуй нагрузку со специалистом.</Text></View>
          <Pressable disabled={prompt.trim().length < 12 || generating} onPress={generate} style={[styles.generate, { backgroundColor: colors.primary, opacity: prompt.trim().length < 12 || generating ? 0.55 : 1 }]}><Text style={styles.generateText}>{generating ? "Groq формирует программу…" : mode === "groq" ? "Сгенерировать через Groq" : "Собрать программу на устройстве"}</Text></Pressable>

          {draft && <View style={styles.builder}><View style={styles.builderHeader}><View><Text style={[styles.section, { color: colors.foreground }]}>Умный конструктор</Text><Text style={[styles.builderHint, { color: colors.muted }]}>Настрой детали до сохранения.</Text></View><Text style={[styles.readyBadge, { color: colors.primary, backgroundColor: colors.primary + "16" }]}>ЧЕРНОВИК</Text></View><Text style={[styles.label, { color: colors.muted }]}>НАЗВАНИЕ ПРОГРАММЫ</Text><TextInput value={draft.name} onChangeText={(name) => patchDraft({ name })} style={[styles.titleInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} /><TextInput value={draft.description} onChangeText={(description) => patchDraft({ description })} multiline style={[styles.descriptionInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} />{draft.exercises.map((item, index) => { const exercise = exercises.find((candidate) => candidate.id === item.exerciseId); return <View key={`${item.exerciseId}-${index}`} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.exerciseHeader}><View style={[styles.exerciseNumber, { backgroundColor: colors.primary + "17" }]}><Text style={[styles.exerciseNumberText, { color: colors.primary }]}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={[styles.exerciseName, { color: colors.foreground }]}>{exercise?.name ?? "Упражнение"}</Text><Text style={[styles.exerciseMeta, { color: colors.muted }]}>{exercise?.group} · {exercise?.equipment}</Text></View><Pressable onPress={() => removeExercise(index)} style={styles.remove}><Text style={[styles.removeText, { color: colors.error }]}>Удалить</Text></Pressable></View><View style={styles.exerciseActions}><Pressable onPress={() => openPicker({ mode: "replace", index })} style={[styles.outlineButton, { borderColor: colors.primary }]}><Text style={[styles.outlineText, { color: colors.primary }]}>Заменить</Text></Pressable><View style={styles.typeChips}>{setTypes.map((type) => <Pressable key={type.id} onPress={() => updateExercise(index, { setType: type.id })} style={[styles.typeChip, { borderColor: item.setType === type.id ? colors.primary : colors.border, backgroundColor: item.setType === type.id ? colors.primary + "14" : "transparent" }]}><Text style={[styles.typeChipText, { color: item.setType === type.id ? colors.primary : colors.muted }]}>{type.label}</Text></Pressable>)}</View></View><View style={styles.fields}>{([{ field: "sets", label: "Подходы" }, { field: "reps", label: "Повторы" }, { field: "weight", label: "Вес, кг" }, { field: "rest", label: "Отдых, сек" }] as { field: NumberField; label: string }[]).map(({ field, label }) => <View key={field} style={styles.fieldWrap}><Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text><View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}><Pressable onPress={() => adjust(index, field, -1)} style={styles.fieldAction}><Text style={[styles.fieldActionText, { color: colors.primary }]}>−</Text></Pressable><TextInput value={String(item[field])} onChangeText={(value) => updateNumber(index, field, value)} keyboardType="decimal-pad" style={[styles.fieldInput, { color: colors.foreground }]} /><Pressable onPress={() => adjust(index, field, 1)} style={styles.fieldAction}><Text style={[styles.fieldActionText, { color: colors.primary }]}>＋</Text></Pressable></View></View>)}</View></View>; })}<Pressable onPress={() => openPicker({ mode: "add" })} style={[styles.addExercise, { borderColor: colors.primary }]}><Text style={[styles.addExerciseText, { color: colors.primary }]}>＋ Добавить упражнение</Text></Pressable><Pressable onPress={save} style={[styles.save, { backgroundColor: colors.primary }]}><Text style={styles.saveText}>Сохранить программу</Text></Pressable></View>}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={keySheetVisible} transparent animationType="slide" onRequestClose={() => setKeySheetVisible(false)}><View style={styles.backdrop}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetKeyboard}><View style={[styles.sheet, { backgroundColor: colors.background }]}><View style={styles.sheetHeader}><View><Text style={[styles.sheetTitle, { color: colors.foreground }]}>Личный ключ Groq</Text><Text style={[styles.sheetHint, { color: colors.muted }]}>Он нужен только для ИИ-режима генерации.</Text></View><Pressable onPress={() => setKeySheetVisible(false)} style={[styles.close, { backgroundColor: colors.surface }]}><Text style={[styles.closeText, { color: colors.foreground }]}>×</Text></Pressable></View><TextInput value={keyDraft} onChangeText={setKeyDraft} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="gsk_…" placeholderTextColor={colors.muted} style={[styles.keyInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.keyPrivacy, { color: colors.muted }]}>{Platform.OS === "web" ? "В Android-сборке ключ хранится в зашифрованном системном хранилище. В веб-просмотре не вводи рабочий ключ." : "Ключ не добавляется в APK, не отправляется в данные тренировок и хранится в зашифрованном системном хранилище Android."}</Text><Pressable disabled={savingKey} onPress={saveKey} style={[styles.saveKey, { backgroundColor: colors.primary, opacity: savingKey ? 0.6 : 1 }]}><Text style={styles.saveKeyText}>{savingKey ? "Сохраняем…" : "Сохранить ключ на устройстве"}</Text></Pressable></View></KeyboardAvoidingView></View></Modal>

      <Modal visible={Boolean(picker)} transparent animationType="slide" onRequestClose={() => setPicker(null)}><View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.background }]}><View style={styles.sheetHeader}><View><Text style={[styles.sheetTitle, { color: colors.foreground }]}>{picker?.mode === "add" ? "Добавить упражнение" : "Заменить упражнение"}</Text><Text style={[styles.sheetHint, { color: colors.muted }]}>Выбери движение из каталога</Text></View><Pressable onPress={() => setPicker(null)} style={[styles.close, { backgroundColor: colors.surface }]}><Text style={[styles.closeText, { color: colors.foreground }]}>×</Text></Pressable></View><TextInput value={search} onChangeText={setSearch} autoFocus placeholder="Название, группа или оборудование" placeholderTextColor={colors.muted} style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} /><ScrollView contentContainerStyle={styles.pickerList} keyboardShouldPersistTaps="handled">{pickerOptions.map((exercise) => <Pressable key={exercise.id} onPress={() => chooseExercise(exercise.id)} style={[styles.pickerItem, { borderColor: colors.border, backgroundColor: colors.surface }]}><View style={[styles.pickerInitial, { backgroundColor: colors.primary + "16" }]}><Text style={[styles.pickerInitialText, { color: colors.primary }]}>{exercise.group.slice(0, 1)}</Text></View><View style={{ flex: 1 }}><Text style={[styles.pickerName, { color: colors.foreground }]}>{exercise.name}</Text><Text style={[styles.pickerMeta, { color: colors.muted }]}>{exercise.group} · {exercise.equipment}</Text></View><Text style={[styles.choose, { color: colors.primary }]}>Выбрать</Text></Pressable>)}</ScrollView></View></View></Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 38, gap: 13 }, nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, navTitle: { fontSize: 16, fontWeight: "900" }, navStub: { width: 27 }, hero: { borderRadius: 21, padding: 18, gap: 6 }, heroEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1, color: "#101412AA" }, heroTitle: { fontSize: 23, fontWeight: "900", color: "#101412" }, heroText: { fontSize: 12, lineHeight: 18, color: "#101412CC" }, modeCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 11 }, modeHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }, modeTitle: { fontSize: 14, fontWeight: "900" }, modeHint: { fontSize: 11, lineHeight: 16, marginTop: 3, maxWidth: 235 }, modeBadge: { paddingHorizontal: 8, paddingVertical: 5, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, borderRadius: 8, overflow: "hidden" }, modeButtons: { flexDirection: "row", gap: 8 }, modeButton: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" }, modeButtonText: { fontSize: 12, fontWeight: "900" }, keyRow: { flexDirection: "row", gap: 10, alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DDD6E7", paddingTop: 10 }, keyText: { flex: 1, fontSize: 10, lineHeight: 14 }, keyActions: { gap: 8, flexDirection: "row" }, keyAction: { fontSize: 11, fontWeight: "900" }, section: { fontSize: 19, fontWeight: "900", marginTop: 2 }, label: { fontSize: 10, fontWeight: "900", letterSpacing: 0.9, marginTop: 2 }, prompt: { minHeight: 112, borderWidth: 1, borderRadius: 16, padding: 13, fontSize: 14, lineHeight: 19 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { minHeight: 36, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, alignItems: "center", justifyContent: "center" }, chipText: { fontSize: 11, fontWeight: "800" }, parameterRow: { flexDirection: "row", gap: 10 }, stepper: { flexDirection: "row", gap: 4 }, stepperOption: { flex: 1, height: 37, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" }, stepperText: { fontSize: 12, fontWeight: "900" }, limitations: { minHeight: 62, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 12, textAlignVertical: "top" }, safety: { borderWidth: 1, borderRadius: 15, padding: 12, gap: 4 }, safetyTitle: { fontSize: 12, fontWeight: "900" }, safetyText: { fontSize: 11, lineHeight: 16 }, generate: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" }, generateText: { color: "#101412", fontSize: 15, fontWeight: "900" }, builder: { gap: 11, marginTop: 7 }, builderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, builderHint: { fontSize: 11, marginTop: 3 }, readyBadge: { paddingHorizontal: 9, paddingVertical: 6, fontSize: 9, fontWeight: "900", borderRadius: 8, overflow: "hidden" }, titleInput: { height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, fontSize: 14, fontWeight: "800" }, descriptionInput: { minHeight: 60, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 12, textAlignVertical: "top" }, exerciseCard: { borderWidth: 1, borderRadius: 17, padding: 12, gap: 10 }, exerciseHeader: { flexDirection: "row", alignItems: "center", gap: 9 }, exerciseNumber: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" }, exerciseNumberText: { fontSize: 13, fontWeight: "900" }, exerciseName: { fontSize: 13, fontWeight: "900" }, exerciseMeta: { fontSize: 10, marginTop: 3 }, remove: { paddingVertical: 6 }, removeText: { fontSize: 10, fontWeight: "800" }, exerciseActions: { flexDirection: "row", alignItems: "center", gap: 8 }, outlineButton: { minHeight: 33, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" }, outlineText: { fontSize: 10, fontWeight: "900" }, typeChips: { flexDirection: "row", gap: 4, flex: 1 }, typeChip: { flex: 1, minHeight: 31, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" }, typeChipText: { fontSize: 9, fontWeight: "900" }, fields: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, fieldWrap: { width: "48%" }, fieldLabel: { fontSize: 9, fontWeight: "800", marginBottom: 4 }, field: { height: 39, borderWidth: 1, borderRadius: 10, flexDirection: "row", alignItems: "center" }, fieldAction: { width: 31, height: "100%", alignItems: "center", justifyContent: "center" }, fieldActionText: { fontSize: 16, fontWeight: "900" }, fieldInput: { flex: 1, height: "100%", textAlign: "center", fontSize: 13, fontWeight: "900", padding: 0 }, addExercise: { minHeight: 46, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, alignItems: "center", justifyContent: "center" }, addExerciseText: { fontSize: 13, fontWeight: "900" }, save: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" }, saveText: { color: "#101412", fontSize: 15, fontWeight: "900" }, backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#090611B8" }, sheetKeyboard: { width: "100%" }, sheet: { maxHeight: "85%", padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 12 }, sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, sheetTitle: { fontSize: 19, fontWeight: "900" }, sheetHint: { fontSize: 11, marginTop: 3 }, close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }, closeText: { fontSize: 23, lineHeight: 25 }, keyInput: { height: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14, fontWeight: "700" }, keyPrivacy: { fontSize: 11, lineHeight: 16 }, saveKey: { minHeight: 52, borderRadius: 15, alignItems: "center", justifyContent: "center" }, saveKeyText: { color: "#101412", fontSize: 13, fontWeight: "900" }, search: { height: 47, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 12 }, pickerList: { gap: 7, paddingBottom: 12 }, pickerItem: { minHeight: 63, borderWidth: 1, borderRadius: 14, padding: 10, flexDirection: "row", gap: 9, alignItems: "center" }, pickerInitial: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" }, pickerInitialText: { fontSize: 13, fontWeight: "900" }, pickerName: { fontSize: 12, fontWeight: "900" }, pickerMeta: { fontSize: 10, marginTop: 3 }, choose: { fontSize: 10, fontWeight: "900" },
});
