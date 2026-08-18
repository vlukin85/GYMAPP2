import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Keyboard, KeyboardAvoidingView, LayoutAnimation, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, UIManager, View } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Circle } from "react-native-svg";
import { router, useLocalSearchParams } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MAX_DROP_SUBSETS, bestOneRepMax, getEffectiveSetWeight, getExercise, getExerciseHistory, getLoadZones, getSetVolumeWithDropSubsets, hasCompletedWorkoutSet, roundToWeightIncrement, type SetType } from "@/lib/workout-data";
import { getRemainingRestSeconds, getRestProgress } from "@/lib/rest-timer";
import { useWorkoutStore } from "@/lib/workout-store";
import { openReplacementPicker, subscribeToExerciseReplacement } from "@/lib/exercise-replacement-bus";

type DropDraft = { reps: string; weight: string };
type ActualSet = { reps: string; weight: string; type: SetType; dropSubsets?: DropDraft[] };
type HistorySet = { weight: number; reps: number; type?: string; drop?: DropDraft[] };

const REST_KEEP_AWAKE_TAG = "gym-training-diary-rest-timer";
const REST_CIRCLE_RADIUS = 54;
const REST_CIRCLE_SIZE = 132;
const REST_CIRCUMFERENCE = 2 * Math.PI * REST_CIRCLE_RADIUS;
const setTypes: { id: SetType; label: string }[] = [
  { id: "warmup", label: "Разм." },
  { id: "working", label: "Раб." },
  { id: "drop", label: "Дроп" },
  { id: "failure", label: "Отказ" },
];
const setTypeLabel: Record<SetType, string> = {
  warmup: "Разминка",
  working: "Рабочий",
  drop: "Дроп-сет",
  failure: "Отказной",
};

function setParts(set: ActualSet) {
  const subsets = set.type === "drop" && set.dropSubsets?.length ? set.dropSubsets : [{ reps: set.reps, weight: set.weight }];
  if (!hasCompletedWorkoutSet(set)) return [];
  return subsets
    .map((part) => ({ reps: Number(part.reps), weightKg: Number(part.weight) }))
    .filter((part) => part.reps > 0 && Number.isFinite(part.weightKg) && part.weightKg >= 0);
}

function RestTimerOverlay({
  colors,
  rest,
  totalRest,
  onAddTime,
  onSkip,
}: {
  colors: ReturnType<typeof useColors>;
  rest: number;
  totalRest: number;
  onAddTime: () => void;
  onSkip: () => void;
}) {
  if (rest <= 0 || totalRest <= 0) return null;
  const progress = getRestProgress(rest, totalRest);
  const dashOffset = REST_CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.restOverlay} pointerEvents="box-none">
      <View style={[styles.restOverlayCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
        <View style={styles.restCircleWrap}>
          <Svg width={REST_CIRCLE_SIZE} height={REST_CIRCLE_SIZE} viewBox={`0 0 ${REST_CIRCLE_SIZE} ${REST_CIRCLE_SIZE}`}>
            <Circle
              cx={REST_CIRCLE_SIZE / 2}
              cy={REST_CIRCLE_SIZE / 2}
              r={REST_CIRCLE_RADIUS}
              stroke={colors.border}
              strokeWidth={9}
              fill="none"
            />
            <Circle
              cx={REST_CIRCLE_SIZE / 2}
              cy={REST_CIRCLE_SIZE / 2}
              r={REST_CIRCLE_RADIUS}
              stroke={colors.primary}
              strokeWidth={9}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={REST_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${REST_CIRCLE_SIZE / 2} ${REST_CIRCLE_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.restCircleText} pointerEvents="none">
            <Text style={[styles.restCircleLabel, { color: colors.primary }]}>ОТДЫХ</Text>
            <Text style={[styles.restCircleValue, { color: colors.foreground }]}>
              {String(Math.floor(rest / 60)).padStart(2, "0")}:{String(rest % 60).padStart(2, "0")}
            </Text>
          </View>
        </View>
        <View style={styles.restCopy}>
          <Text style={[styles.restTitle, { color: colors.foreground }]}>Следующий подход — после сигнала</Text>
          <Text style={[styles.restHint, { color: colors.muted }]}>Отсчёт привязан ко времени и корректно продолжится после блокировки экрана.</Text>
          <View style={styles.restActions}>
            <Pressable onPress={onAddTime} style={({ pressed }) => [styles.restSecondaryAction, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
              <Text style={[styles.restSecondaryText, { color: colors.foreground }]}>+30 сек</Text>
            </Pressable>
            <Pressable onPress={onSkip} style={({ pressed }) => [styles.restSkipAction, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
              <Text style={styles.restSkipText}>Пропустить</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function WorkoutScreen() {
  const colors = useColors();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const store = useWorkoutStore();
  const {
    finishWorkout,
    completed,
    oneRmFormula,
    plateStepKg,
    programs,
    bodyWeightKg,
    bodyweightVolumePercent,
    restTimerSoundEnabled,
    restTimerVibrationEnabled,
    exercisePreferences,
    setExercisePreference,
  } = store;
  const program = programs.find((item) => item.id === (programId ?? "upper-strength"));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusedSetIndex, setFocusedSetIndex] = useState<number | null>(null);
  const [focusedSubsetIndex, setFocusedSubsetIndex] = useState<number | null>(null);
  const [setsByExercise, setSetsByExercise] = useState<Record<string, ActualSet[]>>({});
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const [removedExerciseIds, setRemovedExerciseIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<ActualSet[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [started] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [restEndAt, setRestEndAt] = useState<number | null>(null);
  const previousRestRef = useRef(0);
  const restEndRef = useRef<number | null>(null);
  const skippedRestRef = useRef(false);
  const restedSetSignatures = useRef<Record<string, string>>({});
  const modalScrollRef = useRef<ScrollView>(null);
  const restSignalPlayer = useAudioPlayer(require("@/assets/sounds/rest-complete.wav"));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [machineSetup, setMachineSetup] = useState("");
  const [note, setNote] = useState("");

  const syncRestTimer = useCallback(() => {
    if (!restEndRef.current) return;
    const remaining = getRemainingRestSeconds(restEndRef.current);
    setRest(remaining);
    if (remaining === 0) {
      restEndRef.current = null;
      setRestEndAt(null);
      setRestTotal(0);
    }
  }, []);

  const startRestTimer = useCallback((durationSeconds: number) => {
    const seconds = Math.max(0, Math.round(durationSeconds));
    if (!seconds) return;
    skippedRestRef.current = false;
    const endTimestamp = Date.now() + seconds * 1000;
    restEndRef.current = endTimestamp;
    setRestEndAt(endTimestamp);
    setRestTotal(seconds);
    setRest(seconds);
  }, []);

  const extendRestTimer = useCallback(() => {
    const currentEnd = restEndRef.current ?? Date.now();
    const updatedEnd = Math.max(currentEnd, Date.now()) + 30_000;
    restEndRef.current = updatedEnd;
    setRestEndAt(updatedEnd);
    setRestTotal((current) => Math.max(current, getRemainingRestSeconds(updatedEnd)));
    setRest(getRemainingRestSeconds(updatedEnd));
  }, []);

  const skipRest = useCallback(() => {
    skippedRestRef.current = true;
    restEndRef.current = null;
    setRestEndAt(null);
    setRestTotal(0);
    setRest(0);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (!restEndAt) return;
    syncRestTimer();
    const timer = setInterval(syncRestTimer, 300);
    return () => clearInterval(timer);
  }, [restEndAt, syncRestTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") syncRestTimer();
    });
    return () => subscription.remove();
  }, [syncRestTimer]);

  useEffect(() => {
    if (!restEndAt || Platform.OS === "web") return;
    activateKeepAwakeAsync(REST_KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(REST_KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [restEndAt]);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (previousRestRef.current > 0 && rest === 0 && !skippedRestRef.current) {
      if (restTimerSoundEnabled) {
        restSignalPlayer.seekTo(0);
        restSignalPlayer.play();
      }
      if (restTimerVibrationEnabled && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    if (rest === 0) skippedRestRef.current = false;
    previousRestRef.current = rest;
  }, [rest, restSignalPlayer, restTimerSoundEnabled, restTimerVibrationEnabled]);

  useEffect(() => {
    if (Platform.OS === "android") UIManager.setLayoutAnimationEnabledExperimental?.(true);
  }, []);

  useEffect(
    () => subscribeToExerciseReplacement(({ originalId, replacementId }) => {
      setReplacements((current) => ({ ...current, [originalId]: replacementId }));
    }),
    [],
  );

  if (!program) return null;

  const actualExerciseId = (originalId: string) => replacements[originalId] ?? originalId;
  const sessionExercises = useMemo(
    () => program.exercises.filter((item) => !removedExerciseIds.includes(item.exerciseId)),
    [program.exercises, removedExerciseIds],
  );
  const effectiveVolume = (set: ActualSet, equipment: string) =>
    setParts(set).reduce(
      (sum, part) => sum + getEffectiveSetWeight({ weightKg: part.weightKg, equipment, bodyWeightKg, bodyweightVolumePercent }) * part.reps,
      0,
    );
  const total = sessionExercises.reduce(
    (sum, item) =>
      sum +
      (setsByExercise[item.exerciseId] ?? []).reduce(
        (subtotal, set) => subtotal + effectiveVolume(set, getExercise(actualExerciseId(item.exerciseId))?.equipment ?? ""),
        0,
      ),
    0,
  );
  const activePlan = sessionExercises.find((item) => item.exerciseId === activeId);
  const activeExercise = activeId ? getExercise(actualExerciseId(activeId)) : undefined;
  const currentOneRm = bestOneRepMax(
    draft
      .filter((set) => set.type !== "warmup")
      .flatMap(setParts)
      .map((part) => ({ weight: part.weightKg, reps: part.reps })),
    oneRmFormula,
  );
  const localHistory: { id: string; date: string; sets: HistorySet[]; volume: number }[] = activeId
    ? getExerciseHistory(actualExerciseId(activeId)).map((entry, index) => ({
        id: `local-${index}`,
        date: entry.date,
        sets: entry.sets,
        volume: entry.volume,
      }))
    : [];
  const recordedHistory = useMemo(
    () =>
      activeId
        ? completed
            .filter((workout) => workout.sets?.some((set) => set.exerciseId === actualExerciseId(activeId)))
            .map((workout) => {
              const sets: HistorySet[] = (workout.sets ?? [])
                .filter((set) => set.exerciseId === actualExerciseId(activeId))
                .map((set) => ({ weight: set.weight, reps: set.reps }));
              return {
                id: `local-${workout.id}`,
                date: new Date(workout.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }).replace(".", ""),
                sets,
                volume: sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
              };
            })
        : [],
    [activeId, completed, replacements],
  );
  const history = (recordedHistory.length ? recordedHistory : localHistory).map((entry) => ({
    ...entry,
    oneRm: bestOneRepMax(
      entry.sets.flatMap((set) =>
        set.drop?.length
          ? set.drop.map((part) => ({ weight: Number(part.weight) || 0, reps: Number(part.reps) || 0 }))
          : [{ weight: set.weight, reps: set.reps }],
      ),
      oneRmFormula,
    ),
  }));

  const openExercise = (id: string) => {
    const plan = sessionExercises.find((item) => item.exerciseId === id);
    if (!plan) return;
    setDraft(
      setsByExercise[id]?.map((set) => ({ ...set, dropSubsets: set.dropSubsets?.map((part) => ({ ...part })) })) ??
        Array.from({ length: plan.sets }, () => ({
          reps: "",
          weight: "",
          type: plan.setType ?? "working",
        })),
    );
    const preference = exercisePreferences[actualExerciseId(id)] ?? {};
    setMachineSetup(preference.machineSetup ?? "");
    setNote(preference.note ?? "");
    setExpanded(null);
    setActiveId(id);
  };

  const updateSet = (index: number, update: (set: ActualSet) => ActualSet) =>
    setDraft((current) => current.map((set, position) => (position === index ? update(set) : set)));
  const animateDropLayout = () =>
    LayoutAnimation.configureNext({
      duration: 220,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
  const selectType = (index: number, type: SetType) => {
    animateDropLayout();
    updateSet(index, (set) =>
      type === "drop"
        ? { ...set, type, dropSubsets: set.dropSubsets?.length ? set.dropSubsets : [{ reps: set.reps, weight: set.weight }] }
        : { ...set, type, dropSubsets: undefined },
    );
  };
  const updateDropSubset = (setIndex: number, subsetIndex: number, field: keyof DropDraft, value: string) =>
    updateSet(setIndex, (set) => ({
      ...set,
      dropSubsets: (set.dropSubsets ?? []).map((part, position) => (position === subsetIndex ? { ...part, [field]: value } : part)),
    }));
  const addDropSubset = (setIndex: number) => {
    animateDropLayout();
    updateSet(setIndex, (set) => ({
      ...set,
      dropSubsets: [...(set.dropSubsets ?? []), { reps: set.reps, weight: set.weight }].slice(0, MAX_DROP_SUBSETS),
    }));
  };
  const removeDropSubset = (setIndex: number, subsetIndex: number) => {
    animateDropLayout();
    updateSet(setIndex, (set) => ({ ...set, dropSubsets: (set.dropSubsets ?? []).filter((_, position) => position !== subsetIndex) }));
  };
  const openSetEditor = (index: number, subsetIndex?: number) => {
    setFocusedSetIndex(index);
    setFocusedSubsetIndex(subsetIndex ?? null);
  };
  const closeSetEditor = () => {
    Keyboard.dismiss();
    setFocusedSetIndex(null);
    setFocusedSubsetIndex(null);
  };
  const startRestAfterSetInput = (setIndex: number) => {
    if (!activeId || !activePlan) return;
    const set = draft[setIndex];
    if (!set || !setParts(set).length) return;
    const key = `${activeId}:${setIndex}`;
    const signature = JSON.stringify(set);
    if (restedSetSignatures.current[key] === signature) return;
    restedSetSignatures.current[key] = signature;
    startRestTimer(activePlan.rest ?? 90);
  };
  const finishFocusedSet = () => {
    if (focusedSetIndex === null) return;
    startRestAfterSetInput(focusedSetIndex);
    closeSetEditor();
  };
  const focusedSet = focusedSetIndex === null ? undefined : draft[focusedSetIndex];
  const focusedPart = focusedSet && focusedSubsetIndex !== null ? focusedSet.dropSubsets?.[focusedSubsetIndex] : focusedSet;
  const updateFocusedPart = (field: keyof DropDraft, value: string) => {
    if (focusedSetIndex === null) return;
    if (focusedSubsetIndex === null) updateSet(focusedSetIndex, (item) => ({ ...item, [field]: value }));
    else updateDropSubset(focusedSetIndex, focusedSubsetIndex, field, value);
  };
  const saveExercise = () => {
    if (!activeId) return;
    setSetsByExercise((current) => ({ ...current, [activeId]: draft }));
    setDone((current) => ({ ...current, [activeId]: true }));
    setExercisePreference(actualExerciseId(activeId), { machineSetup, note });
    const index = sessionExercises.findIndex((item) => item.exerciseId === activeId);
    const currentPlan = sessionExercises[index];
    const nextPlan = sessionExercises[index + 1];
    const isSupersetTransition = currentPlan?.supersetGroup && nextPlan?.supersetGroup === currentPlan.supersetGroup && !done[nextPlan.exerciseId];
    if (!isSupersetTransition && restEndRef.current === null && draft.some((set) => setParts(set).length)) {
      startRestTimer(activePlan?.rest ?? 90);
    }
    setActiveId(null);
  };
  const removeExerciseFromSession = (exerciseId: string) => {
    const name = getExercise(actualExerciseId(exerciseId))?.name ?? "это упражнение";
    Alert.alert("Удалить упражнение?", `«${name}» будет удалено только из текущей тренировки. Исходная программа не изменится.`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => {
          setRemovedExerciseIds((current) => [...current, exerciseId]);
          setSetsByExercise((current) => {
            const next = { ...current };
            delete next[exerciseId];
            return next;
          });
          setDone((current) => {
            const next = { ...current };
            delete next[exerciseId];
            return next;
          });
          setReplacements((current) => {
            const next = { ...current };
            delete next[exerciseId];
            return next;
          });
          if (activeId === exerciseId) setActiveId(null);
        },
      },
    ]);
  };
  const completeWorkout = () => {
    const persisted = sessionExercises
      .filter((item) => done[item.exerciseId])
      .flatMap((item) =>
        (setsByExercise[item.exerciseId] ?? []).flatMap((set, index) => {
          const parts = setParts(set);
          if (!parts.length) return [];
          const primary = parts[0];
          return [
            {
              exerciseId: actualExerciseId(item.exerciseId),
              setNumber: index + 1,
              reps: primary.reps,
              weightKg: primary.weightKg,
              setType: set.type,
              supersetGroup: item.supersetGroup,
              dropSubsets: set.type === "drop" ? parts : undefined,
            },
          ];
        }),
      );
    if (!persisted.length) {
      return Alert.alert("Нет выполненных подходов", "Сначала сохраните хотя бы один реально выполненный подход. Незавершённые упражнения не будут записаны.");
    }
    const recordSets = persisted.flatMap((set) =>
      set.dropSubsets?.length
        ? set.dropSubsets.map((part) => ({ exerciseId: set.exerciseId, reps: part.reps, weight: part.weightKg }))
        : [{ exerciseId: set.exerciseId, reps: set.reps, weight: set.weightKg }],
    );
    const result = finishWorkout(program.id, total, recordSets);
    if (result.newRecordIds.length) {
      const progress = result.maxOneRmDelta > 0 ? ` · лучший прирост 1RM +${result.maxOneRmDelta.toFixed(1)} кг` : "";
      Alert.alert("Новый личный рекорд", `Обновлено рекордов: ${result.newRecordIds.length}${progress}`, [
        { text: "К статистике", onPress: () => router.replace("/(tabs)/stats") },
      ]);
    } else {
      router.replace("/(tabs)");
    }
  };

  const fieldStyle = (value: string) => [
    styles.input,
    {
      color: value.trim() ? colors.foreground : colors.muted,
      borderColor: value.trim() ? colors.primary : colors.border,
      backgroundColor: value.trim() ? colors.background : `${colors.muted}1A`,
    },
  ];
  const subsetFieldStyle = (value: string) => [
    styles.subsetInput,
    {
      color: value.trim() ? colors.foreground : colors.muted,
      borderColor: value.trim() ? colors.primary : colors.border,
      backgroundColor: value.trim() ? colors.background : `${colors.muted}1A`,
    },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={27} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>Активная тренировка</Text>
          <Text style={[styles.timer, { color: colors.primary }]}>
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{program.name}</Text>
        <Text style={[styles.helper, { color: colors.muted }]}>Сохраняйте только выполненные упражнения. Свайпните карточку влево, чтобы удалить её из этой тренировки.</Text>

        {sessionExercises.map((item, index) => {
          const exercise = getExercise(actualExerciseId(item.exerciseId));
          const filled = Boolean(done[item.exerciseId]);
          const previous = sessionExercises[index - 1];
          const supersetStart = item.supersetGroup && previous?.supersetGroup !== item.supersetGroup;
          return (
            <Swipeable
              key={item.exerciseId}
              overshootRight={false}
              renderRightActions={() => (
                <Pressable
                  onPress={() => removeExerciseFromSession(item.exerciseId)}
                  style={({ pressed }) => [styles.swipeDelete, { backgroundColor: colors.error, opacity: pressed ? 0.78 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Удалить ${exercise?.name ?? "упражнение"}`}
                >
                  <MaterialIcons name="delete-outline" size={26} color="#FFFFFF" />
                  <Text style={styles.swipeDeleteText}>Удалить</Text>
                </Pressable>
              )}
            >
              <View style={styles.exerciseWrap}>
                {supersetStart && <Text style={[styles.supersetFlag, { color: colors.primary }]}>СУПЕРСЕТ {item.supersetGroup}</Text>}
                <Pressable onPress={() => openExercise(item.exerciseId)} style={[styles.exercise, { backgroundColor: colors.surface, borderColor: filled ? colors.primary : colors.border }]}>
                  <View style={styles.exerciseRow}>
                    <View style={[styles.number, { backgroundColor: filled ? colors.primary : colors.background }]}>
                      <Text style={{ color: filled ? "#101412" : colors.muted, fontWeight: "800" }}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exerciseName, { color: colors.foreground }]}>{exercise?.name}</Text>
                      <Text style={[styles.plan, { color: colors.muted }]}>
                        {item.sets} × {item.reps} · {item.weight} кг · {setTypeLabel[item.setType ?? "working"]}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                  </View>
                </Pressable>
                <Pressable onPress={() => openReplacementPicker(item.exerciseId)} style={({ pressed }) => [styles.replaceButton, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "3D" }, pressed && { opacity: 0.72 }]}>
                  <Text style={[styles.replaceButtonText, { color: colors.primary }]}>⇄ Заменить упражнение</Text>
                </Pressable>
              </View>
            </Swipeable>
          );
        })}

        {!sessionExercises.length && (
          <View style={[styles.emptySession, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptySessionTitle, { color: colors.foreground }]}>В тренировке нет упражнений</Text>
            <Text style={[styles.emptySessionText, { color: colors.muted }]}>Вернитесь назад, чтобы выбрать другую программу, или завершите текущую тренировку после сохранения хотя бы одного подхода.</Text>
          </View>
        )}
        <View style={[styles.total, { backgroundColor: colors.surface }]}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>ТЕКУЩИЙ ОБЪЁМ</Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>{Math.round(total).toLocaleString("ru-RU")} кг</Text>
          <Text style={[styles.totalHint, { color: colors.muted }]}>При завершении в историю попадут только сохранённые подходы.</Text>
        </View>
        <Pressable onPress={completeWorkout} style={[styles.complete, { backgroundColor: colors.primary }]}>
          <Text style={styles.completeText}>Завершить и сохранить выполненное</Text>
        </Pressable>
      </ScrollView>

      {!activeId && <RestTimerOverlay colors={colors} rest={rest} totalRest={restTotal} onAddTime={extendRestTimer} onSkip={skipRest} />}

      <Modal visible={Boolean(activeId)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { closeSetEditor(); setActiveId(null); }}>
        <KeyboardAvoidingView
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => { closeSetEditor(); setActiveId(null); }}>
              <Text style={[styles.cancel, { color: colors.muted }]}>Отмена</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{activeExercise?.name ?? "Упражнение"}</Text>
            <Pressable onPress={saveExercise}>
              <Text style={[styles.save, { color: colors.primary }]}>Готово</Text>
            </Pressable>
          </View>
          <ScrollView
            ref={modalScrollRef}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={[styles.oneRm, { backgroundColor: colors.primary }]}>
              <View>
                <Text style={styles.oneRmLabel}>ПРЕДПОЛАГАЕМЫЙ 1RM</Text>
                <Text style={styles.oneRmHint}>{oneRmFormula === "epley" ? "Формула Эпли" : "Формула Бржицки"}</Text>
              </View>
              <Text style={styles.oneRmValue}>{currentOneRm.toFixed(1)} кг</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Целевые зоны нагрузки</Text>
            <View style={styles.zones}>
              {getLoadZones(currentOneRm).map((zone) => (
                <View key={zone.percent} style={[styles.zone, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.zonePercent, { color: colors.primary }]}>{zone.percent}%</Text>
                  <Text style={[styles.zoneWeight, { color: colors.foreground }]}>{roundToWeightIncrement(zone.weight, plateStepKg).toFixed(1)} кг</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Настройки и заметки</Text>
            <TextInput
              value={machineSetup}
              onChangeText={setMachineSetup}
              placeholder="Настройка тренажёра: сиденье, пин, спинка"
              placeholderTextColor={colors.muted}
              style={[styles.noteInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Личная заметка: хват, темп, техника"
              placeholderTextColor={colors.muted}
              multiline
              style={[styles.noteInput, styles.noteMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
            />

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Прошлые результаты</Text>
            {history.length ? (
              <View style={[styles.history, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {history.map((entry) => (
                  <View key={entry.id} style={[styles.historyEntry, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={() => setExpanded(expanded === entry.id ? null : entry.id)} style={styles.historyTop}>
                      <View>
                        <Text style={[styles.historyDate, { color: colors.foreground }]}>{entry.date}</Text>
                        <Text style={[styles.historyMeta, { color: colors.muted }]}> {entry.volume.toFixed(0)} кг · 1RM {entry.oneRm.toFixed(1)} кг</Text>
                      </View>
                      <IconSymbol name={expanded === entry.id ? "chevron.down" : "chevron.right"} size={18} color={colors.muted} />
                    </Pressable>
                    {expanded === entry.id &&
                      entry.sets.map((set, index) => (
                        <View key={`${entry.id}-${index}`} style={styles.historySet}>
                          <Text style={[styles.setDetail, { color: colors.muted }]}>{index + 1}</Text>
                          <Text style={[styles.setDetail, { color: colors.foreground }]}>{set.drop?.length ? `дроп: ${set.drop.map((part) => `${part.weight}×${part.reps}`).join(" → ")}` : `${set.reps} повт.`}</Text>
                          <Text style={[styles.setDetail, { color: colors.foreground }]}>{set.drop?.length ? "" : `${set.weight} кг`}</Text>
                        </View>
                      ))}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.empty, { color: colors.muted }]}>Это первое зафиксированное выполнение.</Text>
            )}

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Фактические подходы</Text>
            <Text style={[styles.fieldHint, { color: colors.muted }]}>Пустые поля выделены серым. После ввода повтора и веса таймер отдыха запускается автоматически.</Text>
            {draft.map((set, index) => (
              <View key={`draft-${index}`} style={[styles.setBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.setRow}>
                  <Text style={[styles.setIndex, { color: colors.primary }]}>{index + 1}</Text>
                  {set.type !== "drop" && (
                    <>
                      <TextInput
                        value={set.reps}
                        onChangeText={(value) => updateSet(index, (item) => ({ ...item, reps: value }))}
                        onFocus={() => openSetEditor(index)}
                        onEndEditing={() => startRestAfterSetInput(index)}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        placeholder={`план ${activePlan?.reps ?? "—"}`}
                        placeholderTextColor={colors.muted}
                        style={fieldStyle(set.reps)}
                      />
                      <TextInput
                        value={set.weight}
                        onChangeText={(value) => updateSet(index, (item) => ({ ...item, weight: value }))}
                        onFocus={() => openSetEditor(index)}
                        onEndEditing={() => startRestAfterSetInput(index)}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        placeholder={`план ${activePlan?.weight ?? "—"} кг`}
                        placeholderTextColor={colors.muted}
                        style={fieldStyle(set.weight)}
                      />
                    </>
                  )}
                </View>
                <View style={styles.typeChips}>
                  {setTypes.map((type) => (
                    <Pressable
                      key={type.id}
                      onPress={() => selectType(index, type.id)}
                      style={[
                        styles.typeChip,
                        {
                          borderColor: set.type === type.id ? colors.primary : colors.border,
                          backgroundColor: set.type === type.id ? `${colors.primary}18` : "transparent",
                        },
                      ]}
                    >
                      <Text style={[styles.typeChipText, { color: set.type === type.id ? colors.primary : colors.muted }]}>{type.label}</Text>
                    </Pressable>
                  ))}
                </View>
                {set.type === "drop" && (
                  <View style={[styles.dropPanel, { borderColor: colors.primary + "45", backgroundColor: colors.primary + "0D" }]}>
                    <View style={styles.dropHeader}>
                      <View>
                        <Text style={[styles.dropTitle, { color: colors.primary }]}>Подподходы дроп-сета</Text>
                        <Text style={[styles.dropHint, { color: colors.muted }]}>Укажи до {MAX_DROP_SUBSETS} последовательных снижений веса.</Text>
                      </View>
                      <Text style={[styles.dropCount, { color: colors.primary }]}>{set.dropSubsets?.length ?? 0}/{MAX_DROP_SUBSETS}</Text>
                    </View>
                    {(set.dropSubsets ?? []).map((part, subsetIndex) => (
                      <View key={`drop-${subsetIndex}`} style={styles.subsetRow}>
                        <Text style={[styles.subsetIndex, { color: colors.primary }]}>{subsetIndex + 1}</Text>
                        <TextInput
                          value={part.reps}
                          onChangeText={(value) => updateDropSubset(index, subsetIndex, "reps", value)}
                          onFocus={() => openSetEditor(index, subsetIndex)}
                          onEndEditing={() => startRestAfterSetInput(index)}
                          keyboardType="number-pad"
                          returnKeyType="done"
                          placeholder={`план ${activePlan?.reps ?? "—"}`}
                          placeholderTextColor={colors.muted}
                          style={subsetFieldStyle(part.reps)}
                        />
                        <TextInput
                          value={part.weight}
                          onChangeText={(value) => updateDropSubset(index, subsetIndex, "weight", value)}
                          onFocus={() => openSetEditor(index, subsetIndex)}
                          onEndEditing={() => startRestAfterSetInput(index)}
                          keyboardType="decimal-pad"
                          returnKeyType="done"
                          placeholder={`план ${activePlan?.weight ?? "—"} кг`}
                          placeholderTextColor={colors.muted}
                          style={subsetFieldStyle(part.weight)}
                        />
                        {(set.dropSubsets?.length ?? 0) > 1 && (
                          <Pressable onPress={() => removeDropSubset(index, subsetIndex)} style={styles.removeSubset}>
                            <Text style={[styles.removeSubsetText, { color: colors.error }]}>×</Text>
                          </Pressable>
                        )}
                      </View>
                    ))}
                    {(set.dropSubsets?.length ?? 0) < MAX_DROP_SUBSETS && (
                      <Pressable onPress={() => addDropSubset(index)} style={[styles.addSubset, { borderColor: colors.primary }]}>
                        <Text style={[styles.addSubsetText, { color: colors.primary }]}>＋ Добавить подподход</Text>
                      </Pressable>
                    )}
                    <Text style={[styles.dropVolume, { color: colors.muted }]}>
                      Объём дроп-сета: {Math.round(getSetVolumeWithDropSubsets({ weightKg: Number(set.weight) || 0, reps: Number(set.reps) || 0, setType: "drop", dropSubsets: setParts(set) })).toLocaleString("ru-RU")} кг
                    </Text>
                  </View>
                )}
              </View>
            ))}
            <Pressable
              onPress={() =>
                setDraft((current) => [
                  ...current,
                  {
                    reps: "",
                    weight: "",
                    type: activePlan?.setType ?? "working",
                  },
                ])
              }
              style={[styles.addSet, { borderColor: colors.primary }]}
            >
              <Text style={[styles.addSetText, { color: colors.primary }]}>＋ Добавить подход</Text>
            </Pressable>
            <Pressable onPress={saveExercise} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveButtonText}>Сохранить подходы</Text>
            </Pressable>
          </ScrollView>
          <RestTimerOverlay colors={colors} rest={rest} totalRest={restTotal} onAddTime={extendRestTimer} onSkip={skipRest} />
          <Modal visible={focusedSetIndex !== null} transparent animationType="fade" onRequestClose={closeSetEditor} statusBarTranslucent>
            <KeyboardAvoidingView style={styles.setEditorBackdrop} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}>
              {focusedSetIndex !== null && focusedSet && focusedPart && (
                <View style={[styles.setEditorSheet, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                  <View style={styles.setEditorHeader}>
                    <View>
                      <Text style={[styles.setEditorEyebrow, { color: colors.primary }]}>{focusedSubsetIndex === null ? `ФАКТИЧЕСКИЙ ПОДХОД ${focusedSetIndex + 1}` : `ДРОП-СЕТ ${focusedSetIndex + 1} · ПОДПОДХОД ${focusedSubsetIndex + 1}`}</Text>
                      <Text style={[styles.setEditorTitle, { color: colors.foreground }]}>Запишите результат</Text>
                    </View>
                    <Pressable onPress={closeSetEditor} style={[styles.setEditorClose, { backgroundColor: colors.surface }]} accessibilityLabel="Закрыть форму ввода">
                      <Text style={[styles.setEditorCloseText, { color: colors.foreground }]}>×</Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.setEditorHint, { color: colors.muted }]}>Форма находится поверх тренировки и остаётся выше клавиатуры.</Text>
                  <View style={styles.setEditorFields}>
                    <View style={styles.setEditorFieldWrap}>
                      <Text style={[styles.setEditorLabel, { color: colors.muted }]}>ПОВТОРЫ</Text>
                      <TextInput autoFocus value={focusedPart.reps} onChangeText={(value) => updateFocusedPart("reps", value)} onEndEditing={() => startRestAfterSetInput(focusedSetIndex)} keyboardType="number-pad" returnKeyType="done" placeholder={`план ${activePlan?.reps ?? "—"}`} placeholderTextColor={colors.muted} style={[styles.setEditorInput, { color: focusedPart.reps.trim() ? colors.foreground : colors.muted, backgroundColor: focusedPart.reps.trim() ? colors.surface : `${colors.muted}1A`, borderColor: focusedPart.reps.trim() ? colors.primary : colors.border }]} />
                    </View>
                    <View style={styles.setEditorFieldWrap}>
                      <Text style={[styles.setEditorLabel, { color: colors.muted }]}>ВЕС, КГ</Text>
                      <TextInput value={focusedPart.weight} onChangeText={(value) => updateFocusedPart("weight", value)} onEndEditing={() => startRestAfterSetInput(focusedSetIndex)} keyboardType="decimal-pad" returnKeyType="done" placeholder={`план ${activePlan?.weight ?? "—"}`} placeholderTextColor={colors.muted} style={[styles.setEditorInput, { color: focusedPart.weight.trim() ? colors.foreground : colors.muted, backgroundColor: focusedPart.weight.trim() ? colors.surface : `${colors.muted}1A`, borderColor: focusedPart.weight.trim() ? colors.primary : colors.border }]} />
                    </View>
                  </View>
                  <Pressable disabled={!setParts(focusedSet).length} onPress={finishFocusedSet} style={({ pressed }) => [styles.setEditorFinish, { backgroundColor: colors.primary, opacity: !setParts(focusedSet).length ? 0.45 : pressed ? 0.78 : 1 }]}>
                    <Text style={styles.setEditorFinishText}>Завершено</Text>
                  </Pressable>
                </View>
              )}
            </KeyboardAvoidingView>
          </Modal>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 32, gap: 13 },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  navTitle: { fontSize: 16, fontWeight: "800" },
  timer: { fontSize: 14, fontWeight: "800" },
  title: { fontSize: 23, fontWeight: "800", marginTop: 8 },
  helper: { fontSize: 12, lineHeight: 18 },
  exerciseWrap: { gap: 5 },
  swipeDelete: { width: 98, marginLeft: 8, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 3 },
  swipeDeleteText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  supersetFlag: { fontSize: 10, fontWeight: "900", letterSpacing: 1, marginLeft: 4 },
  exercise: { borderRadius: 17, borderWidth: 1, padding: 14 },
  exerciseRow: { flexDirection: "row", gap: 11, alignItems: "center" },
  number: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  exerciseName: { fontSize: 14, fontWeight: "800" },
  plan: { fontSize: 11, marginTop: 4 },
  replaceButton: { minHeight: 36, alignSelf: "flex-start", paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, justifyContent: "center" },
  replaceButtonText: { fontSize: 11, fontWeight: "900" },
  emptySession: { borderRadius: 17, borderWidth: 1, padding: 15, gap: 5 },
  emptySessionTitle: { fontSize: 14, fontWeight: "900" },
  emptySessionText: { fontSize: 11, lineHeight: 16 },
  total: { borderRadius: 17, padding: 15 },
  totalLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  totalValue: { fontSize: 25, fontWeight: "800", marginTop: 5 },
  totalHint: { fontSize: 10, marginTop: 4 },
  complete: { minHeight: 55, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  completeText: { color: "#101412", fontSize: 15, fontWeight: "800" },
  restOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30, justifyContent: "flex-end", padding: 18, paddingBottom: 26 },
  restOverlayCard: { borderWidth: 1, borderRadius: 23, padding: 13, flexDirection: "row", gap: 11, alignItems: "center", elevation: 12, shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
  restCircleWrap: { width: REST_CIRCLE_SIZE, height: REST_CIRCLE_SIZE, alignItems: "center", justifyContent: "center" },
  restCircleText: { position: "absolute", alignItems: "center" },
  restCircleLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  restCircleValue: { fontSize: 20, fontWeight: "900", marginTop: 3 },
  restCopy: { flex: 1, gap: 5 },
  restTitle: { fontSize: 13, fontWeight: "900", lineHeight: 18 },
  restHint: { fontSize: 10, lineHeight: 14 },
  restActions: { flexDirection: "row", gap: 7, marginTop: 3 },
  restSecondaryAction: { minHeight: 34, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  restSecondaryText: { fontSize: 11, fontWeight: "900" },
  restSkipAction: { minHeight: 34, paddingHorizontal: 10, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  restSkipText: { color: "#101412", fontSize: 11, fontWeight: "900" },
  setEditorBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#090611A8", padding: 14 },
  setEditorSheet: { borderWidth: 1, borderRadius: 25, padding: 17, gap: 13, elevation: 28, shadowColor: "#000000", shadowOpacity: 0.36, shadowRadius: 20, shadowOffset: { width: 0, height: 9 } },
  setEditorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  setEditorEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.9 },
  setEditorTitle: { fontSize: 20, fontWeight: "900", marginTop: 4 },
  setEditorClose: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  setEditorCloseText: { fontSize: 25, lineHeight: 28 },
  setEditorHint: { fontSize: 11, lineHeight: 16 },
  setEditorFields: { flexDirection: "row", gap: 10 },
  setEditorFieldWrap: { flex: 1, gap: 6 },
  setEditorLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.65 },
  setEditorInput: { height: 58, borderRadius: 15, borderWidth: 1, textAlign: "center", fontSize: 20, fontWeight: "900" },
  setEditorFinish: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 2 },
  setEditorFinishText: { color: "#101412", fontSize: 15, fontWeight: "900" },
  modalRoot: { flex: 1, paddingTop: 10 },
  modalHeader: { minHeight: 56, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cancel: { fontSize: 14 },
  modalTitle: { maxWidth: "58%", textAlign: "center", fontWeight: "800" },
  save: { fontSize: 14, fontWeight: "800" },
  modalContent: { padding: 18, gap: 12, paddingBottom: 178 },
  oneRm: { borderRadius: 17, padding: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  oneRmLabel: { color: "#101412", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  oneRmHint: { color: "#101412AA", fontSize: 11, marginTop: 4 },
  oneRmValue: { color: "#101412", fontSize: 24, fontWeight: "900" },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 4 },
  zones: { flexDirection: "row", gap: 8 },
  zone: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 11, alignItems: "center", gap: 4 },
  zonePercent: { fontSize: 13, fontWeight: "900" },
  zoneWeight: { fontSize: 13, fontWeight: "800" },
  noteInput: { minHeight: 46, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, fontSize: 12 },
  noteMulti: { minHeight: 68, paddingTop: 10, textAlignVertical: "top" },
  history: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 13 },
  historyEntry: { borderBottomWidth: 1 },
  historyTop: { minHeight: 58, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyDate: { fontSize: 13, fontWeight: "800" },
  historyMeta: { fontSize: 10, marginTop: 3 },
  historySet: { paddingVertical: 6, flexDirection: "row" },
  setDetail: { flex: 1, fontSize: 12, fontWeight: "700" },
  empty: { fontSize: 12 },
  fieldHint: { fontSize: 11, lineHeight: 16, marginTop: -4 },
  setBox: { borderRadius: 15, borderWidth: 1, padding: 8, gap: 8 },
  setRow: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 9 },
  setIndex: { width: 38, textAlign: "center", fontSize: 16, fontWeight: "900" },
  input: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1, textAlign: "center", fontSize: 15, fontWeight: "800" },
  typeChips: { flexDirection: "row", gap: 6, paddingLeft: 46 },
  typeChip: { flex: 1, minHeight: 30, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  typeChipText: { fontSize: 10, fontWeight: "800" },
  dropPanel: { borderRadius: 13, borderWidth: 1, padding: 10, gap: 8 },
  dropHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  dropTitle: { fontSize: 12, fontWeight: "900" },
  dropHint: { fontSize: 10, marginTop: 3, lineHeight: 14 },
  dropCount: { fontSize: 12, fontWeight: "900" },
  subsetRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  subsetIndex: { width: 22, textAlign: "center", fontSize: 12, fontWeight: "900" },
  subsetInput: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1, textAlign: "center", fontSize: 13, fontWeight: "800" },
  removeSubset: { width: 25, height: 30, alignItems: "center", justifyContent: "center" },
  removeSubsetText: { fontSize: 21, fontWeight: "700" },
  addSubset: { minHeight: 35, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  addSubsetText: { fontSize: 11, fontWeight: "800" },
  dropVolume: { fontSize: 10, textAlign: "right" },
  addSet: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  addSetText: { fontSize: 14, fontWeight: "800" },
  saveButton: { minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#101412", fontSize: 15, fontWeight: "800" },
});
