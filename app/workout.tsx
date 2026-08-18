import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, FlatList, Keyboard, KeyboardAvoidingView, LayoutAnimation, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, UIManager, View } from "react-native";
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
import { MAX_DROP_SUBSETS, bestOneRepMax, exercises, getEffectiveSetWeight, getExercise, getExerciseHistory, getLoadZones, getSetVolumeWithDropSubsets, hasCompletedWorkoutSet, muscleGroups, roundToWeightIncrement, type Exercise, type ProgramExercise, type SetType } from "@/lib/workout-data";
import { getRemainingRestSeconds, getRestProgress } from "@/lib/rest-timer";
import { getHistoricalQuickWeightOptions, getPreviousWorkingResult, prefillWorkingSet } from "@/lib/workout-set-entry";
import { filterActiveWorkoutCatalog, reorderActiveWorkoutExercises } from "@/lib/active-workout-utils";
import { useWorkoutStore } from "@/lib/workout-store";
import { openReplacementPicker, subscribeToExerciseReplacement } from "@/lib/exercise-replacement-bus";

type DropDraft = { reps: string; weight: string };
type ActualSet = { reps: string; weight: string; type: SetType; dropSubsets?: DropDraft[] };
type HistorySet = { weight: number; reps: number; type?: string; drop?: DropDraft[] };

const REST_KEEP_AWAKE_TAG = "gym-training-diary-rest-timer";
const REST_CIRCLE_RADIUS = 108;
const REST_CIRCLE_SIZE = 252;
const REST_CIRCUMFERENCE = 2 * Math.PI * REST_CIRCLE_RADIUS;
const DRAG_AUTOSCROLL_EDGE_PX = 86;
const DRAG_AUTOSCROLL_STEP_PX = 16;
const DRAG_AUTOSCROLL_INTERVAL_MS = 34;
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
    <Modal visible transparent animationType="fade" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onSkip}>
      <View style={[styles.restOverlay, { backgroundColor: colors.background }]}> 
        <Text style={[styles.restOverlayEyebrow, { color: colors.primary }]}>ТАЙМЕР ОТДЫХА</Text>
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
        </View>
        </View>
        <View style={styles.restActions}>
          <Pressable onPress={onAddTime} style={({ pressed }) => [styles.restSecondaryAction, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}> 
            <Text style={[styles.restSecondaryText, { color: colors.foreground }]}>+30 сек</Text>
          </Pressable>
          <Pressable onPress={onSkip} style={({ pressed }) => [styles.restSkipAction, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}> 
            <Text style={styles.restSkipText}>Пропустить отдых</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ExerciseDragHandle({
  index,
  total,
  colors,
  onDragStart,
  onDragTarget,
  onDragMove,
  onDragEnd,
  isDragging,
}: {
  index: number;
  total: number;
  colors: ReturnType<typeof useColors>;
  onDragStart: () => void;
  onDragTarget: (toIndex: number) => void;
  onDragMove: (pageY: number) => void;
  onDragEnd: (fallbackTarget: number) => void;
  isDragging: boolean;
}) {
  const latest = useRef({ index, total, onDragStart, onDragTarget, onDragMove, onDragEnd });
  const lastTarget = useRef(index);
  latest.current = { index, total, onDragStart, onDragTarget, onDragMove, onDragEnd };
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        const current = latest.current;
        lastTarget.current = current.index;
        current.onDragStart();
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gesture) => {
        const current = latest.current;
        const positionShift = Math.round(gesture.dy / 88);
        const toIndex = Math.max(0, Math.min(current.total - 1, current.index + positionShift));
        current.onDragMove(gesture.moveY);
        if (toIndex !== lastTarget.current) {
          lastTarget.current = toIndex;
          current.onDragTarget(toIndex);
          if (Platform.OS !== "web") Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const current = latest.current;
        const positionShift = Math.round(gesture.dy / 88);
        const toIndex = Math.max(0, Math.min(current.total - 1, current.index + positionShift));
        current.onDragEnd(toIndex);
      },
      onPanResponderTerminate: () => latest.current.onDragEnd(latest.current.index),
    }),
  ).current;

  return (
    <View {...panResponder.panHandlers} style={[styles.dragHandle, isDragging && [styles.dragHandleActive, { backgroundColor: colors.primary, borderColor: colors.primary }], !isDragging && { backgroundColor: colors.background, borderColor: colors.border }]} accessibilityLabel="Перетащите для изменения порядка">
      <MaterialIcons name="drag-handle" size={21} color={isDragging ? "#101412" : colors.muted} />
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
  const [addedSessionExercises, setAddedSessionExercises] = useState<ProgramExercise[]>([]);
  const [catalogVisible, setCatalogVisible] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogGroup, setCatalogGroup] = useState("Все");
  const [sessionOrder, setSessionOrder] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{ sourceId: string; sourceIndex: number; targetIndex: number | null } | null>(null);
  const dragStateRef = useRef<{ sourceId: string; sourceIndex: number; targetIndex: number | null } | null>(null);
  const workoutScrollRef = useRef<ScrollView>(null);
  const scrollMetricsRef = useRef({ offsetY: 0, viewportTop: 0, viewportHeight: 0, contentHeight: 0 });
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoScrollDirectionRef = useRef<-1 | 0 | 1>(0);
  const autoScrollTickRef = useRef(0);

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

  useEffect(() => () => {
    if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
  }, []);

  useEffect(
    () => subscribeToExerciseReplacement(({ originalId, replacementId }) => {
      setReplacements((current) => ({ ...current, [originalId]: replacementId }));
    }),
    [],
  );

  if (!program) return null;

  const actualExerciseId = (originalId: string) => replacements[originalId] ?? originalId;
  const sessionExercises = useMemo(() => {
    const source = [...program.exercises, ...addedSessionExercises].filter((item) => !removedExerciseIds.includes(item.exerciseId));
    const sourceById = new Map(source.map((item) => [item.exerciseId, item]));
    const ordered = sessionOrder.flatMap((id) => {
      const item = sourceById.get(id);
      return item ? [item] : [];
    });
    const orderedIds = new Set(ordered.map((item) => item.exerciseId));
    return [...ordered, ...source.filter((item) => !orderedIds.has(item.exerciseId))];
  }, [program.exercises, addedSessionExercises, removedExerciseIds, sessionOrder]);
  const renderedSessionExercises = useMemo(() => {
    if (!dragState || dragState.targetIndex === null) return sessionExercises;
    return reorderActiveWorkoutExercises(sessionExercises, dragState.sourceIndex, dragState.targetIndex);
  }, [dragState, sessionExercises]);
  const filteredCatalog = useMemo(
    () => filterActiveWorkoutCatalog(exercises, catalogGroup, catalogSearch),
    [catalogGroup, catalogSearch],
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
    if (subsetIndex === undefined) {
      setDraft((current) => prefillWorkingSet(current, index, {
        reps: String(activePlan?.reps ?? ""),
        weight: String(activePlan?.weight ?? ""),
      }));
    }
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
  const previousWorkingResult = focusedSetIndex === null ? null : getPreviousWorkingResult(draft, focusedSetIndex);
  const quickWeightOptions = focusedPart
    ? getHistoricalQuickWeightOptions(history.flatMap((entry) => entry.sets), previousWorkingResult?.weight ?? String(activePlan?.weight ?? ""), plateStepKg)
    : [];
  const hasHistoricalWeights = history.some((entry) => entry.sets.some((set) => set.weight > 0 || set.drop?.some((part) => Number(part.weight) > 0)));
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
  const addExerciseToSession = (exercise: Exercise) => {
    if (sessionExercises.some((item) => item.exerciseId === exercise.id)) {
      Alert.alert("Упражнение уже в тренировке", `«${exercise.name}» уже добавлено в эту активную тренировку.`);
      return;
    }
    setAddedSessionExercises((current) => [
      ...current,
      { exerciseId: exercise.id, sets: 3, reps: 10, weight: 0, rest: 90, setType: "working" },
    ]);
    setCatalogVisible(false);
    setCatalogSearch("");
  };
  const moveSessionExercise = (fromIndex: number, toIndex: number) => {
    const reordered = reorderActiveWorkoutExercises(sessionExercises, fromIndex, toIndex);
    if (reordered !== sessionExercises) setSessionOrder(reordered.map((item) => item.exerciseId));
  };
  const animateDragLayout = () => LayoutAnimation.configureNext({
    duration: 210,
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
  });
  const setDragPreview = (next: { sourceId: string; sourceIndex: number; targetIndex: number | null } | null) => {
    animateDragLayout();
    dragStateRef.current = next;
    setDragState(next);
  };
  const stopDragAutoScroll = () => {
    if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    autoScrollTimerRef.current = null;
    autoScrollDirectionRef.current = 0;
    autoScrollTickRef.current = 0;
  };
  const moveDragTarget = (targetIndex: number) => {
    const current = dragStateRef.current;
    if (!current) return;
    const safeTarget = Math.max(0, Math.min(sessionExercises.length - 1, targetIndex));
    if (current.targetIndex === safeTarget) return;
    setDragPreview({ ...current, targetIndex: safeTarget === current.sourceIndex ? null : safeTarget });
  };
  const updateDragAutoScroll = (pageY: number) => {
    const metrics = scrollMetricsRef.current;
    if (!metrics.viewportHeight) return;
    const nearTop = pageY < metrics.viewportTop + DRAG_AUTOSCROLL_EDGE_PX;
    const nearBottom = pageY > metrics.viewportTop + metrics.viewportHeight - DRAG_AUTOSCROLL_EDGE_PX;
    const direction: -1 | 0 | 1 = nearTop ? -1 : nearBottom ? 1 : 0;
    if (!direction) {
      stopDragAutoScroll();
      return;
    }
    if (autoScrollDirectionRef.current === direction && autoScrollTimerRef.current) return;
    stopDragAutoScroll();
    autoScrollDirectionRef.current = direction;
    autoScrollTimerRef.current = setInterval(() => {
      const active = dragStateRef.current;
      if (!active) return stopDragAutoScroll();
      const currentMetrics = scrollMetricsRef.current;
      const maxOffset = Math.max(0, currentMetrics.contentHeight - currentMetrics.viewportHeight);
      const nextOffset = Math.max(0, Math.min(maxOffset, currentMetrics.offsetY + direction * DRAG_AUTOSCROLL_STEP_PX));
      if (nextOffset === currentMetrics.offsetY) return stopDragAutoScroll();
      currentMetrics.offsetY = nextOffset;
      workoutScrollRef.current?.scrollTo({ y: nextOffset, animated: false });
      autoScrollTickRef.current += 1;
      if (autoScrollTickRef.current % 4 === 0) moveDragTarget((active.targetIndex ?? active.sourceIndex) + direction);
    }, DRAG_AUTOSCROLL_INTERVAL_MS);
  };
  const startExerciseDrag = (sourceId: string, sourceIndex: number) => {
    stopDragAutoScroll();
    setDragPreview({ sourceId, sourceIndex, targetIndex: null });
  };
  const finishExerciseDrag = (fallbackTarget: number) => {
    const current = dragStateRef.current;
    stopDragAutoScroll();
    const target = current?.targetIndex ?? fallbackTarget;
    if (current && target !== current.sourceIndex) moveSessionExercise(current.sourceIndex, target);
    setDragPreview(null);
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
      <ScrollView
        ref={workoutScrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(event) => { scrollMetricsRef.current.viewportHeight = event.nativeEvent.layout.height; scrollMetricsRef.current.viewportTop = event.nativeEvent.layout.y; }}
        onContentSizeChange={(_width, height) => { scrollMetricsRef.current.contentHeight = height; }}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          scrollMetricsRef.current.offsetY = contentOffset.y;
          scrollMetricsRef.current.contentHeight = contentSize.height;
          scrollMetricsRef.current.viewportHeight = layoutMeasurement.height;
        }}
      >
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
        <Text style={[styles.helper, { color: colors.muted }]}>Сохраняйте только выполненные упражнения. Свайпните карточку влево для удаления, перетащите маркер ⠿ для смены порядка.</Text>

        {renderedSessionExercises.map((item, index) => {
          const exercise = getExercise(actualExerciseId(item.exerciseId));
          const filled = Boolean(done[item.exerciseId]);
          const previous = sessionExercises[index - 1];
          const supersetStart = item.supersetGroup && previous?.supersetGroup !== item.supersetGroup;
          const sourceIndex = sessionExercises.findIndex((candidate) => candidate.exerciseId === item.exerciseId);
          const isDragging = dragState?.sourceId === item.exerciseId;
          const isDropTarget = dragState?.targetIndex === sourceIndex && !isDragging;
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
              <View style={[styles.exerciseWrap, isDragging && styles.exerciseWrapDragging]}>
                {isDropTarget && <View pointerEvents="none" style={[styles.dropIndicator, { backgroundColor: colors.primary }]}><MaterialIcons name="south" size={16} color="#101412" /><Text style={styles.dropIndicatorText}>Отпустите здесь</Text></View>}
                {supersetStart && <Text style={[styles.supersetFlag, { color: colors.primary }]}>СУПЕРСЕТ {item.supersetGroup}</Text>}
                <Pressable onPress={() => openExercise(item.exerciseId)} style={[styles.exercise, isDragging && styles.exerciseDragging, { backgroundColor: colors.surface, borderColor: isDragging || filled ? colors.primary : colors.border }]}>
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
                    <ExerciseDragHandle
                      index={sourceIndex}
                      total={sessionExercises.length}
                      colors={colors}
                      isDragging={isDragging}
                      onDragStart={() => startExerciseDrag(item.exerciseId, sourceIndex)}
                      onDragTarget={moveDragTarget}
                      onDragMove={updateDragAutoScroll}
                      onDragEnd={finishExerciseDrag}
                    />
                    <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                  </View>
                  {isDragging && <View style={[styles.draggingLabel, { backgroundColor: colors.primary + "18" }]}><MaterialIcons name="open-with" size={15} color={colors.primary} /><Text style={[styles.draggingLabelText, { color: colors.primary }]}>ПЕРЕМЕЩЕНИЕ УПРАЖНЕНИЯ</Text></View>}
                </Pressable>
                <Pressable onPress={() => openReplacementPicker(item.exerciseId)} style={({ pressed }) => [styles.replaceButton, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "3D" }, pressed && { opacity: 0.72 }]}>
                  <Text style={[styles.replaceButtonText, { color: colors.primary }]}>⇄ Заменить упражнение</Text>
                </Pressable>
              </View>
            </Swipeable>
          );
        })}

        <Pressable onPress={() => setCatalogVisible(true)} style={({ pressed }) => [styles.addExercise, { borderColor: colors.primary, backgroundColor: colors.primary + "10", opacity: pressed ? 0.72 : 1 }]}>
          <MaterialIcons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.addExerciseText, { color: colors.primary }]}>Добавить упражнение</Text>
        </Pressable>

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

      <Modal visible={catalogVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCatalogVisible(false)}>
        <View style={[styles.catalogModal, { backgroundColor: colors.background }]}>
          <View style={styles.catalogHeader}>
            <Pressable onPress={() => setCatalogVisible(false)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={[styles.catalogCancel, { color: colors.muted }]}>Отмена</Text>
            </Pressable>
            <Text style={[styles.catalogTitle, { color: colors.foreground }]}>Добавить упражнение</Text>
            <View style={styles.catalogHeaderSpacer} />
          </View>
          <TextInput value={catalogSearch} onChangeText={setCatalogSearch} placeholder="Поиск по названию" placeholderTextColor={colors.muted} style={[styles.catalogSearch, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} returnKeyType="search" />
          <View style={styles.catalogFilterSummary}>
            <Text style={[styles.catalogFilterTitle, { color: colors.muted }]}>ГРУППА МЫШЦ</Text>
            <Text style={[styles.catalogFilterCount, { color: colors.primary }]}>{filteredCatalog.length}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupFilters} keyboardShouldPersistTaps="handled">
            {muscleGroups.map((group) => (
              <Pressable key={group} onPress={() => setCatalogGroup(group)} style={({ pressed }) => [styles.groupFilter, { borderColor: catalogGroup === group ? colors.primary : colors.border, backgroundColor: catalogGroup === group ? colors.primary : colors.surface, opacity: pressed ? 0.75 : 1 }]}>
                <Text style={[styles.groupFilterText, { color: catalogGroup === group ? "#101412" : colors.foreground }]}>{group}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <FlatList
            data={filteredCatalog}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.catalogList}
            ListEmptyComponent={<Text style={[styles.catalogEmpty, { color: colors.muted }]}>Ничего не найдено. Измените поиск или группу мышц.</Text>}
            renderItem={({ item }) => (
              <Pressable onPress={() => addExerciseToSession(item)} style={({ pressed }) => [styles.catalogItem, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.72 : 1 }]}>
                <View style={[styles.catalogItemBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[styles.catalogItemBadgeText, { color: colors.primary }]}>{item.group.slice(0, 1)}</Text>
                </View>
                <View style={styles.catalogItemCopy}>
                  <Text style={[styles.catalogItemName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.catalogItemMeta, { color: colors.muted }]}>{item.group} · {item.equipment}</Text>
                </View>
                <MaterialIcons name="add-circle" size={24} color={colors.primary} />
              </Pressable>
            )}
          />
        </View>
      </Modal>

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
              <Text style={styles.saveButtonText}>Завершить упражнение</Text>
            </Pressable>
          </ScrollView>
          <RestTimerOverlay colors={colors} rest={rest} totalRest={restTotal} onAddTime={extendRestTimer} onSkip={skipRest} />
          <Modal visible={focusedSetIndex !== null} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeSetEditor} statusBarTranslucent>
            <KeyboardAvoidingView style={[styles.setEditorBackdrop, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}>
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
                  <View style={styles.setEditorCenter}>
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
                    {quickWeightOptions.length > 0 && (
                      <View style={styles.quickWeightGroup}>
                        <Text style={[styles.quickWeightLabel, { color: colors.muted }]}>{hasHistoricalWeights ? "ВЕС ИЗ ПРОШЛЫХ ТРЕНИРОВОК" : "БЫСТРЫЙ ВЫБОР ВЕСА"}</Text>
                        <View style={styles.quickWeightRow}>
                          {quickWeightOptions.map((weight) => (
                            <Pressable key={weight} onPress={() => updateFocusedPart("weight", weight)} style={({ pressed }) => [styles.quickWeightButton, { borderColor: focusedPart.weight === weight ? colors.primary : colors.border, backgroundColor: focusedPart.weight === weight ? colors.primary + "18" : colors.surface, opacity: pressed ? 0.7 : 1 }]}>
                              <Text style={[styles.quickWeightText, { color: focusedPart.weight === weight ? colors.primary : colors.foreground }]}>{weight} кг</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                    <Pressable disabled={!setParts(focusedSet).length} onPress={finishFocusedSet} style={({ pressed }) => [styles.setEditorFinish, { backgroundColor: colors.primary, opacity: !setParts(focusedSet).length ? 0.45 : pressed ? 0.78 : 1 }]}>
                      <Text style={styles.setEditorFinishText}>Завершить подход</Text>
                    </Pressable>
                  </View>
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
  exerciseWrap: { gap: 5, position: "relative" },
  exerciseWrapDragging: { zIndex: 5 },
  dropIndicator: { position: "absolute", left: 14, right: 14, top: -9, height: 26, borderRadius: 9, zIndex: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, elevation: 8, shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  dropIndicatorText: { color: "#101412", fontSize: 10, fontWeight: "900" },
  swipeDelete: { width: 98, marginLeft: 8, borderRadius: 17, alignItems: "center", justifyContent: "center", gap: 3 },
  swipeDeleteText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  supersetFlag: { fontSize: 10, fontWeight: "900", letterSpacing: 1, marginLeft: 4 },
  exercise: { borderRadius: 17, borderWidth: 1, padding: 14 },
  exerciseDragging: { transform: [{ scale: 1.018 }], elevation: 12, shadowColor: "#160E24", shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
  exerciseRow: { flexDirection: "row", gap: 11, alignItems: "center" },
  dragHandle: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dragHandleActive: { transform: [{ scale: 1.08 }], elevation: 5, shadowColor: "#160E24", shadowOpacity: 0.22, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } },
  number: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  exerciseName: { fontSize: 14, fontWeight: "800" },
  plan: { fontSize: 11, marginTop: 4 },
  draggingLabel: { marginTop: 11, borderRadius: 9, minHeight: 28, paddingHorizontal: 9, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5 },
  draggingLabelText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.55 },
  replaceButton: { minHeight: 36, alignSelf: "flex-start", paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, justifyContent: "center" },
  replaceButtonText: { fontSize: 11, fontWeight: "900" },
  addExercise: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  addExerciseText: { fontSize: 14, fontWeight: "900" },
  catalogModal: { flex: 1, paddingTop: 40 },
  catalogHeader: { minHeight: 56, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catalogCancel: { fontSize: 14, fontWeight: "700" },
  catalogTitle: { fontSize: 16, fontWeight: "900" },
  catalogHeaderSpacer: { width: 52 },
  catalogSearch: { height: 48, marginHorizontal: 20, marginTop: 6, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  catalogFilterSummary: { marginTop: 18, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catalogFilterTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 0.85 },
  catalogFilterCount: { fontSize: 12, fontWeight: "900" },
  groupFilters: { gap: 8, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 14 },
  groupFilter: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  groupFilterText: { fontSize: 12, fontWeight: "800" },
  catalogList: { paddingHorizontal: 20, paddingBottom: 32, gap: 9 },
  catalogItem: { minHeight: 72, borderRadius: 17, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12 },
  catalogItemBadge: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  catalogItemBadgeText: { fontSize: 16, fontWeight: "900" },
  catalogItemCopy: { flex: 1, gap: 3 },
  catalogItemName: { fontSize: 14, fontWeight: "900" },
  catalogItemMeta: { fontSize: 11 },
  catalogEmpty: { textAlign: "center", marginTop: 56, fontSize: 13 },
  emptySession: { borderRadius: 17, borderWidth: 1, padding: 15, gap: 5 },
  emptySessionTitle: { fontSize: 14, fontWeight: "900" },
  emptySessionText: { fontSize: 11, lineHeight: 16 },
  total: { borderRadius: 17, padding: 15 },
  totalLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  totalValue: { fontSize: 25, fontWeight: "800", marginTop: 5 },
  totalHint: { fontSize: 10, marginTop: 4 },
  complete: { minHeight: 55, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  completeText: { color: "#101412", fontSize: 15, fontWeight: "800" },
  restOverlay: { flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32, justifyContent: "space-between", alignItems: "stretch" },
  restOverlayEyebrow: { textAlign: "center", fontSize: 12, fontWeight: "900", letterSpacing: 1.4 },
  restOverlayCard: { flex: 1, borderWidth: 1, borderRadius: 30, padding: 24, justifyContent: "center", alignItems: "center", gap: 28, elevation: 12, shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, marginVertical: 22 },
  restCircleWrap: { width: REST_CIRCLE_SIZE, height: REST_CIRCLE_SIZE, alignItems: "center", justifyContent: "center" },
  restCircleText: { position: "absolute", alignItems: "center" },
  restCircleLabel: { fontSize: 13, fontWeight: "900", letterSpacing: 1.2 },
  restCircleValue: { fontSize: 40, fontWeight: "900", marginTop: 4 },
  restCopy: { alignItems: "center", gap: 8, maxWidth: 280 },
  restTitle: { textAlign: "center", fontSize: 20, fontWeight: "900", lineHeight: 27 },
  restHint: { textAlign: "center", fontSize: 13, lineHeight: 19 },
  restActions: { flexDirection: "row", gap: 10 },
  restSecondaryAction: { flex: 1, minHeight: 54, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  restSecondaryText: { fontSize: 14, fontWeight: "900" },
  restSkipAction: { flex: 1.55, minHeight: 54, paddingHorizontal: 12, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  restSkipText: { color: "#101412", fontSize: 14, fontWeight: "900" },
  setEditorBackdrop: { flex: 1 },
  setEditorSheet: { flex: 1, padding: 24, paddingTop: 42 },
  setEditorHeader: { position: "absolute", top: 42, left: 24, right: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  setEditorEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.9 },
  setEditorTitle: { fontSize: 28, fontWeight: "900", marginTop: 5 },
  setEditorClose: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  setEditorCloseText: { fontSize: 25, lineHeight: 28 },
  setEditorCenter: { flex: 1, width: "100%", maxWidth: 360, alignSelf: "center", justifyContent: "center", gap: 22 },
  setEditorFields: { flexDirection: "row", gap: 14 },
  setEditorFieldWrap: { flex: 1, gap: 9 },
  setEditorLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 0.75 },
  setEditorInput: { height: 86, borderRadius: 20, borderWidth: 1, textAlign: "center", fontSize: 30, fontWeight: "900" },
  quickWeightGroup: { gap: 8 },
  quickWeightLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.65, textAlign: "center" },
  quickWeightRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  quickWeightButton: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  quickWeightText: { fontSize: 12, fontWeight: "900" },
  setEditorFinish: { minHeight: 62, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 2 },
  setEditorFinishText: { color: "#101412", fontSize: 17, fontWeight: "900" },
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
