import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useBottomActionInset } from "@/lib/use-bottom-inset";
import { minTouchTarget, pressedOpacity, radius, shadows, type as typeTokens } from "@/lib/design-tokens";
import { getExercise, getMonthCalendarDays, shiftCalendarMonth } from "@/lib/workout-data";
import { filterWorkoutsByStatsFilter, getLatestPersonalRecordsByFilter, type StatsFilterMode } from "@/lib/stats-period";
import { loadStatsPreferences, saveStatsPreferences } from "@/lib/stats-filter-storage";
import { useWorkoutStore } from "@/lib/workout-store";
import { useHomeWidgets } from "@/lib/home-widgets";
import {
  DEFAULT_STATS_WIDGETS,
  STATS_WIDGETS,
  loadStatsWidgets,
  saveStatsWidgets,
  type StatsWidgetId,
  type StatsWidgetPreferences,
} from "@/lib/stats-widgets-storage";
import { ProgressOverview } from "@/components/progress-overview";
import { getExercisePersonalRecordHistory, type PersonalRecordHistoryPoint } from "@/lib/record-history";
import { getPercentageChange, getStatsMetrics, getStatsPeriodComparison } from "@/lib/stats-comparison";
import { getWeeklyCardioMinutes } from "@/lib/cardio-metrics";
import type { DailyActivityReading } from "@/lib/health-connect";
import { getActivityStatus, getActivityToday, getActivityWeek, type ActivityProviderStatus } from "@/lib/activity-provider";
import type { ActivityWeekDay } from "@/lib/health-connect-activity";

const periodOptions: { id: StatsFilterMode; label: string }[] = [
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "date", label: "Дата" },
  { id: "custom", label: "Диапазон" },
  { id: "last30", label: "30 дней" },
  { id: "last90", label: "90 дней" },
];
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const formatPickerDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

export default function StatsScreen() {
  const colors = useColors();
  const sheetBottomInset = useBottomActionInset(20);
  const { completed, personalRecords, oneRmFormula } = useWorkoutStore();
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<StatsFilterMode>("month");
  const [selectedDate, setSelectedDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [filterLoaded, setFilterLoaded] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"date" | "start" | "end">("date");
  const [calendarCursor, setCalendarCursor] = useState(new Date());
  const filter = useMemo(() => ({ mode: period, date: selectedDate, start: rangeStart, end: rangeEnd }), [period, rangeEnd, rangeStart, selectedDate]);
  const periodWorkouts = useMemo(() => filterWorkoutsByStatsFilter(completed, filter), [completed, filter]);
  const exerciseOptions = useMemo(() => Array.from(new Set(completed.flatMap((workout) => (workout.sets ?? []).map((set) => set.exerciseId)))).map((id) => ({ id, name: getExercise(id)?.name ?? id })).sort((a, b) => a.name.localeCompare(b.name, "ru")), [completed]);
  const visibleExerciseOptions = useMemo(() => { const query = exerciseQuery.trim().toLocaleLowerCase("ru"); return query ? exerciseOptions.filter((exercise) => exercise.name.toLocaleLowerCase("ru").includes(query)) : exerciseOptions; }, [exerciseOptions, exerciseQuery]);
  const selectedExercise = selectedExerciseId ? exerciseOptions.find((exercise) => exercise.id === selectedExerciseId) : undefined;
  const filteredWorkouts = useMemo(() => selectedExerciseId ? periodWorkouts.filter((workout) => (workout.sets ?? []).some((set) => set.exerciseId === selectedExerciseId)) : periodWorkouts, [periodWorkouts, selectedExerciseId]);
  const recentRecords = useMemo(() => getLatestPersonalRecordsByFilter(personalRecords, filter).filter((record) => !selectedExerciseId || record.exerciseId === selectedExerciseId), [filter, personalRecords, selectedExerciseId]);
  const metrics = useMemo(() => getStatsMetrics(completed, filter, selectedExerciseId), [completed, filter, selectedExerciseId]);
  const periodComparison = useMemo(() => getStatsPeriodComparison(completed, filter, selectedExerciseId), [completed, filter, selectedExerciseId]);
  const oneRmHistory = useMemo(() => selectedExerciseId ? getExercisePersonalRecordHistory(completed, selectedExerciseId, oneRmFormula) : [], [completed, oneRmFormula, selectedExerciseId]);
  const weeklyCardio = useMemo(() => getWeeklyCardioMinutes(completed), [completed]);
  // Виджет «Активность»: данные читаются провайдером (Google Fit — основной,
  // Health Connect — резерв) один раз при маунте, ошибки не блокируют экран.
  const [activityStatus, setActivityStatus] = useState<ActivityProviderStatus | null>(null);
  const [activityDay, setActivityDay] = useState<DailyActivityReading | null>(null);
  const [activityWeek, setActivityWeek] = useState<ActivityWeekDay[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const status = await getActivityStatus();
        if (!mounted) return;
        setActivityStatus(status);
        if (status.connected) {
          const [day, week] = await Promise.all([getActivityToday(), getActivityWeek()]);
          if (!mounted) return;
          setActivityDay(day);
          setActivityWeek(week);
        }
      } catch {
        // Тихо: виджет остаётся с подсказкой «не подключено».
      } finally {
        if (mounted) setActivityLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const periodLabel = period === "date" ? selectedDate : period === "custom" ? `${rangeStart} — ${rangeEnd}` : periodOptions.find((option) => option.id === period)?.label.toLocaleLowerCase("ru") ?? "месяц";
  const calendarDays = useMemo(() => getMonthCalendarDays(calendarCursor.getFullYear(), calendarCursor.getMonth()), [calendarCursor]);
  useEffect(() => { let mounted = true; loadStatsPreferences({ filter, exerciseId: null }).then((saved) => { if (!mounted) return; setPeriod(saved.filter.mode); setSelectedDate(saved.filter.date ?? today); setRangeStart(saved.filter.start ?? today); setRangeEnd(saved.filter.end ?? today); setSelectedExerciseId(saved.exerciseId); setFilterLoaded(true); }); return () => { mounted = false; }; }, []);
  useEffect(() => { if (filterLoaded) void saveStatsPreferences({ filter, exerciseId: selectedExerciseId }); }, [filter, filterLoaded, selectedExerciseId]);
  const openCalendar = (target: "date" | "start" | "end") => { const value = target === "date" ? selectedDate : target === "start" ? rangeStart : rangeEnd; setPickerTarget(target); setCalendarCursor(new Date(`${value}T12:00:00`)); setCalendarOpen(true); };
  const selectCalendarDate = (value: string) => { if (pickerTarget === "date") setSelectedDate(value); if (pickerTarget === "start") setRangeStart(value); if (pickerTarget === "end") setRangeEnd(value); setCalendarOpen(false); };

  // Виджеты статистики: порядок и скрытие по образцу главного экрана.
  const homeWidgetsPrefs = useHomeWidgets();
  const [widgetPrefs, setWidgetPrefs] = useState<StatsWidgetPreferences>(DEFAULT_STATS_WIDGETS);
  const [widgetsLoaded, setWidgetsLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState<StatsWidgetId | null>(null);
  const [dragTarget, setDragTarget] = useState<number | null>(null);
  const [previewOrder, setPreviewOrder] = useState<StatsWidgetId[] | null>(null);
  useEffect(() => { let mounted = true; loadStatsWidgets(DEFAULT_STATS_WIDGETS).then((saved) => { if (!mounted) return; setWidgetPrefs(saved); setWidgetsLoaded(true); }); return () => { mounted = false; }; }, []);
  useEffect(() => { if (widgetsLoaded) void saveStatsWidgets(widgetPrefs); }, [widgetPrefs, widgetsLoaded]);
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental)
      UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);
  const animateStatsLayout = () =>
    LayoutAnimation.configureNext({
      duration: 300,
      update: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
  const isStatsWidgetAvailable = (id: StatsWidgetId) =>
    id === "comparison" ? Boolean(periodComparison) : id === "oneRm" ? Boolean(selectedExerciseId && selectedExercise) : true;
  const visibleWidgetIds = useMemo(
    () => widgetPrefs.order.filter((id) => !widgetPrefs.hidden.includes(id)),
    [widgetPrefs],
  );
  const placeableWidgetIds = useMemo(
    () => visibleWidgetIds.filter(isStatsWidgetAvailable),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleWidgetIds, periodComparison, selectedExercise, selectedExerciseId],
  );
  const displayedWidgetIds = previewOrder ? previewOrder.filter(isStatsWidgetAvailable) : placeableWidgetIds;
  const previewStatsWidgetMove = (id: StatsWidgetId, target: number) => {
    setDragTarget(target);
    setPreviewOrder((current) => {
      const order = current ?? visibleWidgetIds;
      const source = order.indexOf(id);
      if (source < 0 || source === target) return order;
      animateStatsLayout();
      const next = [...order];
      next.splice(source, 1);
      next.splice(target, 0, id);
      return next;
    });
  };
  const finishStatsWidgetDrag = (id: StatsWidgetId, target: number) => {
    const destinationId = placeableWidgetIds[target];
    const destination = destinationId
      ? widgetPrefs.order.indexOf(destinationId)
      : widgetPrefs.order.length - 1;
    animateStatsLayout();
    setWidgetPrefs((current) => {
      const from = current.order.indexOf(id);
      if (from === -1) return current;
      const order = current.order.filter((item) => item !== id);
      order.splice(Math.max(0, Math.min(order.length, destination)), 0, id);
      return { ...current, order };
    });
    setDraggingId(null);
    setDragTarget(null);
    setPreviewOrder(null);
  };
  const hideStatsWidget = (id: StatsWidgetId) => {
    animateStatsLayout();
    setWidgetPrefs((current) => current.hidden.includes(id) ? current : { ...current, hidden: [...current.hidden, id] });
  };
  const restoreStatsWidget = (id: StatsWidgetId) => {
    animateStatsLayout();
    setWidgetPrefs((current) => current.hidden.includes(id) ? { ...current, hidden: current.hidden.filter((item) => item !== id) } : current);
  };
  const dismissStatsDragHint = () => setWidgetPrefs((current) => current.dragHintSeen ? current : { ...current, dragHintSeen: true });
  const triggerStatsGrabFeedback = () => {
    if (!homeWidgetsPrefs.dragHapticsEnabled) return;
    if (Platform.OS === "android") {
      void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Drag_Start).catch(() => undefined);
      return;
    }
    if (Platform.OS !== "web")
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const renderStatsWidget = (id: StatsWidgetId) => {
    if (id === "summary")
      return <View style={styles.bigStats}><Metric icon="dumbbell.fill" iconColor={colors.primary} value={String(metrics.workoutCount)} label={selectedExerciseId ? "сессий" : "тренировок"} colors={colors} /><Metric icon="chart.bar.fill" iconColor={colors.warning} value={`${(metrics.volume / 1000).toFixed(1)}т`} label={selectedExerciseId ? "объём упражнения" : "общий объём"} colors={colors} /><Metric icon="timer" iconColor={colors.success} value={String(metrics.minutes)} label="минут" colors={colors} /></View>;
    if (id === "comparison")
      return periodComparison ? <PeriodComparison comparison={periodComparison} period={period} colors={colors} /> : null;
    if (id === "oneRm")
      return selectedExerciseId && selectedExercise ? <OneRmHistoryChart exerciseName={selectedExercise.name} points={oneRmHistory} colors={colors} /> : null;
    if (id === "cardio")
      return <WeeklyCardioChart points={weeklyCardio} colors={colors} />;
    if (id === "activity")
      return <ActivityTodayCard status={activityStatus} day={activityDay} week={activityWeek} loaded={activityLoaded} colors={colors} />;
    if (id === "progress")
      return <ProgressOverview completed={completed} />;
    if (id === "records")
      return <View><View style={styles.sectionRow}><View><Text style={[styles.section, { color: colors.foreground }]}>Личные рекорды</Text><Text style={[styles.hint, { color: colors.muted }]}>Последние зафиксированные или обновлённые за {periodLabel}.</Text></View><Text style={[styles.count, { color: colors.muted, fontVariant: ["tabular-nums"] }]}>{recentRecords.length}</Text></View>{recentRecords.length ? recentRecords.map((record) => {
      const exercise = getExercise(record.exerciseId);
      const date = new Date(record.achievedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      return <View key={record.exerciseId} style={[styles.record, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.recordIcon, { backgroundColor: colors.primary + "20" }]}><IconSymbol name="trophy" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.recordName, { color: colors.foreground }]}>{exercise?.name ?? record.exerciseId}</Text><Text style={[styles.recordGroup, { color: colors.muted }]}>{exercise?.group ?? "Упражнение"} · обновлён {date}</Text></View><View style={styles.recordValueWrap}><Text style={[styles.recordValue, { color: colors.foreground, fontVariant: ["tabular-nums"] }]}>{record.weight} кг × {record.reps}</Text><Text style={[styles.oneRm, { color: colors.primary, fontVariant: ["tabular-nums"] }]}>1RM {record.estimatedOneRepMax.toFixed(1)} кг</Text></View></View>;
    }) : <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="trophy" size={22} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Нет обновлений за этот период</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Завершите тренировку с новым результатом, и он появится здесь.</Text></View>}</View>;
    return null;
  };

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={[styles.topRow, { borderBottomColor: colors.border }]}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>Анализ прогресса</Text><Text style={[styles.title, { color: colors.foreground }]}>Статистика</Text></View><View style={styles.headerActions}><Pressable onPress={() => setEditMode((current) => !current)} accessibilityRole="button" accessibilityLabel={editMode ? "Завершить редактирование виджетов" : "Редактировать виджеты статистики"} style={({ pressed }) => [styles.editButton, { borderColor: editMode ? colors.primary : colors.border, backgroundColor: editMode ? `${colors.primary}18` : colors.surface, opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.editButtonText, { color: editMode ? colors.primary : colors.foreground }]}>{editMode ? "Готово" : "Редактировать"}</Text></Pressable><Pressable onPress={() => router.push("/(tabs)/settings")} style={({ pressed }) => [styles.settingsButton, { backgroundColor: colors.surface, opacity: pressed ? pressedOpacity : 1 }]}><IconSymbol name="gearshape" size={21} color={colors.foreground} /></Pressable></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filters, { backgroundColor: colors.surface, borderColor: colors.border }]}>{periodOptions.map((option) => <Pressable key={option.id} onPress={() => setPeriod(option.id)} style={({ pressed }) => [styles.filter, { minWidth: option.id === "custom" ? 92 : option.id.startsWith("last") ? 86 : 73, backgroundColor: period === option.id ? colors.primary : "transparent", opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.filterText, { color: period === option.id ? colors.background : colors.muted }]}>{option.label}</Text></Pressable>)}</ScrollView>
    <View style={[styles.exerciseFilterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.exerciseFilterLabel, { color: colors.muted }]}>УПРАЖНЕНИЕ</Text><Text style={[styles.exerciseFilterValue, { color: colors.foreground }]}>{selectedExercise?.name ?? "Все упражнения"}</Text></View><Pressable onPress={() => { setExerciseQuery(""); setExercisePickerOpen(true); }} style={({ pressed }) => [styles.exerciseFilterButton, { borderColor: colors.primary, opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.exerciseFilterButtonText, { color: colors.primary }]}>Выбрать</Text></Pressable>{selectedExerciseId && <Pressable onPress={() => setSelectedExerciseId(null)} style={({ pressed }) => [styles.clearExercise, { opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.clearExerciseText, { color: colors.error }]}>Сбросить</Text></Pressable>}</View>
    {period === "date" && <View style={[styles.dateForm, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.dateLabel, { color: colors.muted }]}>КОНКРЕТНАЯ ДАТА</Text><Pressable onPress={() => openCalendar("date")} style={({ pressed }) => [styles.calendarField, { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? pressedOpacity : 1 }]}><IconSymbol name="calendar" size={17} color={colors.primary} /><Text style={[styles.calendarFieldText, { color: colors.foreground }]}>{formatPickerDate(selectedDate)}</Text><IconSymbol name="chevron.right" size={16} color={colors.muted} /></Pressable></View>}
    {period === "custom" && <View style={[styles.dateForm, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.dateLabel, { color: colors.muted }]}>ПОЛЬЗОВАТЕЛЬСКИЙ ДИАПАЗОН</Text><View style={styles.rangeCalendarFields}><Pressable onPress={() => openCalendar("start")} style={({ pressed }) => [styles.rangeCalendarField, { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.rangeFieldCaption, { color: colors.muted }]}>ОТ</Text><Text style={[styles.rangeFieldValue, { color: colors.foreground }]}>{formatPickerDate(rangeStart)}</Text></Pressable><Pressable onPress={() => openCalendar("end")} style={({ pressed }) => [styles.rangeCalendarField, { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.rangeFieldCaption, { color: colors.muted }]}>ДО</Text><Text style={[styles.rangeFieldValue, { color: colors.foreground }]}>{formatPickerDate(rangeEnd)}</Text></Pressable></View><Text style={[styles.rangeHint, { color: colors.muted }]}>Нажмите дату, чтобы выбрать её в календаре.</Text></View>}
    {widgetsLoaded && editMode && !widgetPrefs.dragHintSeen && <StatsDragHint colors={colors} onDismiss={dismissStatsDragHint} />}
    {displayedWidgetIds.map((id, index) => {
      const content = renderStatsWidget(id);
      if (!content) return null;
      return (
        <DraggableStatsWidget
          key={id}
          id={id}
          index={index}
          total={placeableWidgetIds.length}
          dragging={draggingId === id}
          editing={editMode}
          colors={colors}
          onDragStart={() => {
            triggerStatsGrabFeedback();
            setDraggingId(id);
            setDragTarget(index);
            setPreviewOrder(visibleWidgetIds);
          }}
          onDragMove={(next) => previewStatsWidgetMove(id, next)}
          onDragEnd={(target) => finishStatsWidgetDrag(id, target)}
          onHide={() => hideStatsWidget(id)}
        >
          {content}
        </DraggableStatsWidget>
      );
    })}
    {editMode && <View style={[styles.hiddenWidgetsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.hiddenWidgetsTitle, { color: colors.foreground }]}>Скрытые виджеты</Text><Text style={[styles.hiddenWidgetsHint, { color: colors.muted }]}>Скрытые блоки не показываются на экране, вернуть можно в любой момент.</Text>{widgetPrefs.hidden.length ? widgetPrefs.hidden.map((id) => { const meta = STATS_WIDGETS.find((widget) => widget.id === id); return <View key={id} style={[styles.hiddenWidgetRow, { borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.hiddenWidgetTitle, { color: colors.foreground }]}>{meta?.title ?? id}</Text><Text style={[styles.hiddenWidgetDescription, { color: colors.muted }]}>{meta?.description}</Text></View><Pressable onPress={() => restoreStatsWidget(id)} accessibilityRole="button" accessibilityLabel={`Вернуть виджет «${meta?.title ?? id}»`} style={({ pressed }) => [styles.restoreButton, { borderColor: colors.primary, opacity: pressed ? pressedOpacity : 1 }]}><Text style={[styles.restoreButtonText, { color: colors.primary }]}>Вернуть</Text></Pressable></View>; }) : <Text style={[styles.hiddenWidgetEmpty, { color: colors.muted }]}>Скрытых виджетов нет — все блоки на месте.</Text>}</View>}
  <Modal visible={exercisePickerOpen} transparent animationType="slide" onRequestClose={() => setExercisePickerOpen(false)}><View style={styles.backdrop}><View style={[styles.exerciseSheet, { backgroundColor: colors.background, paddingBottom: sheetBottomInset }]}><View style={styles.pickerHeader}><View><Text style={[styles.pickerTitle, { color: colors.foreground }]}>Фильтр упражнения</Text><Text style={[styles.pickerSubtitle, { color: colors.muted }]}>Показывает объём и рекорды выбранного движения.</Text></View><Pressable onPress={() => setExercisePickerOpen(false)} style={[styles.pickerClose, { backgroundColor: colors.surface }]}><Text style={[styles.pickerCloseText, { color: colors.foreground }]}>×</Text></Pressable></View><View style={[styles.exerciseSearch, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="magnifyingglass" size={18} color={colors.muted} /><TextInput value={exerciseQuery} onChangeText={setExerciseQuery} placeholder="Поиск упражнения" placeholderTextColor={colors.muted} autoFocus style={[styles.exerciseSearchInput, { color: colors.foreground }]} /></View><ScrollView contentContainerStyle={styles.exerciseOptions}>{visibleExerciseOptions.map((exercise) => { const selected = exercise.id === selectedExerciseId; return <Pressable key={exercise.id} onPress={() => { setSelectedExerciseId(exercise.id); setExercisePickerOpen(false); }} style={[styles.exerciseOption, { backgroundColor: selected ? `${colors.primary}18` : colors.surface, borderColor: selected ? colors.primary : colors.border }]}><Text style={[styles.exerciseOptionText, { color: colors.foreground }]}>{exercise.name}</Text>{selected && <IconSymbol name="checkmark" size={18} color={colors.primary} />}</Pressable>; })}</ScrollView><Pressable onPress={() => { setSelectedExerciseId(null); setExercisePickerOpen(false); }} style={[styles.clearAllExercises, { borderColor: colors.border }]}><Text style={[styles.clearAllExercisesText, { color: colors.foreground }]}>Показать все упражнения</Text></Pressable></View></View></Modal>
  <Modal visible={calendarOpen} transparent animationType="slide" onRequestClose={() => setCalendarOpen(false)}><View style={styles.backdrop}><View style={[styles.calendarSheet, { backgroundColor: colors.background, paddingBottom: sheetBottomInset }]}><View style={styles.pickerHeader}><View><Text style={[styles.pickerTitle, { color: colors.foreground }]}>{pickerTarget === "date" ? "Выберите дату" : pickerTarget === "start" ? "Начало диапазона" : "Конец диапазона"}</Text><Text style={[styles.pickerSubtitle, { color: colors.muted }]}>Статистика будет пересчитана автоматически</Text></View><Pressable onPress={() => setCalendarOpen(false)} style={[styles.pickerClose, { backgroundColor: colors.surface }]}><Text style={[styles.pickerCloseText, { color: colors.foreground }]}>×</Text></Pressable></View><View style={styles.pickerMonth}><Pressable onPress={() => setCalendarCursor((current) => shiftCalendarMonth(current, -1))}><IconSymbol name="chevron.left" size={22} color={colors.foreground} /></Pressable><Text style={[styles.pickerMonthText, { color: colors.foreground }]}>{calendarCursor.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</Text><Pressable onPress={() => setCalendarCursor((current) => shiftCalendarMonth(current, 1))}><IconSymbol name="chevron.right" size={22} color={colors.foreground} /></Pressable></View><View style={styles.weekdays}>{weekDays.map((day) => <Text key={day} style={[styles.weekday, { color: colors.muted }]}>{day}</Text>)}</View><View style={styles.calendarGrid}>{calendarDays.map((day) => { const key = dateKey(day); const active = pickerTarget === "date" ? key === selectedDate : pickerTarget === "start" ? key === rangeStart : key === rangeEnd; const inMonth = day.getMonth() === calendarCursor.getMonth(); return <Pressable key={key} onPress={() => selectCalendarDate(key)} style={[styles.calendarDay, active && { backgroundColor: colors.primary }]}><Text style={{ color: active ? "#101412" : inMonth ? colors.foreground : colors.muted, fontWeight: active ? "900" : "700" }}>{day.getDate()}</Text></Pressable>; })}</View></View></View></Modal>
  </ScrollView></ScreenContainer>;
}

function DraggableStatsWidget({ id, index, total, dragging, editing, colors, onDragStart, onDragMove, onDragEnd, onHide, children }: { id: StatsWidgetId; index: number; total: number; dragging: boolean; editing: boolean; colors: any; onDragStart: () => void; onDragMove: (index: number) => void; onDragEnd: (index: number) => void; onHide: () => void; children: React.ReactNode }) {
  const currentTargetRef = useMemo(() => ({ value: index }), [index]);
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(lift, {
      toValue: dragging ? 1 : 0,
      duration: dragging ? 210 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dragging, lift]);
  const trackedPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          currentTargetRef.value = index;
          onDragStart();
        },
        onPanResponderMove: (_event, gesture) => {
          const next = Math.max(0, Math.min(total - 1, index + Math.round(gesture.dy / 96)));
          currentTargetRef.value = next;
          onDragMove(next);
        },
        onPanResponderRelease: () => onDragEnd(currentTargetRef.value),
        onPanResponderTerminate: () => onDragEnd(index),
      }),
    [currentTargetRef, index, onDragEnd, onDragMove, onDragStart, total],
  );
  return (
    <Animated.View
      style={[
        styles.widgetShell,
        {
          zIndex: dragging ? 20 : 1,
          elevation: dragging ? 8 : 0,
          opacity: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }),
          transform: [
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
            { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) },
          ],
        },
      ]}
    >
      <View pointerEvents={editing ? "none" : "box-none"}>{children}</View>
      {editing && <Pressable onPress={onHide} accessibilityRole="button" accessibilityLabel={`Скрыть виджет «${STATS_WIDGETS.find((widget) => widget.id === id)?.title ?? id}»`} style={[styles.widgetHideButton, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.widgetHideText, { color: colors.muted }]}>×</Text></Pressable>}
      {editing && (
        <View
          pointerEvents="box-only"
          accessibilityRole="adjustable"
          accessibilityLabel="Перетащить виджет"
          style={[
            styles.widgetHandle,
            {
              backgroundColor: dragging ? colors.primary : colors.background,
              borderColor: dragging ? colors.primary : colors.border,
            },
          ]}
          {...trackedPanResponder.panHandlers}
        >
          <Text style={[styles.widgetHandleText, { color: dragging ? "#FFFFFF" : colors.muted }]}>⠿</Text>
        </View>
      )}
    </Animated.View>
  );
}

function StatsDragHint({ colors, onDismiss }: { colors: any; onDismiss: () => void }) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View style={styles.hintBackdrop}>
        <View style={[styles.hintCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <Text style={[styles.hintEyebrow, { color: colors.primary }]}>НАСТРОЙТЕ СТАТИСТИКУ ПОД СЕБЯ</Text>
          <Text style={[styles.hintTitle, { color: colors.foreground }]}>Перемещайте виджеты</Text>
          <Text style={[styles.hintText, { color: colors.muted }]}>Зажмите маркер ⠿ на карточке и потяните её вверх или вниз. Кнопка × скрывает ненужный блок — вернуть его можно в списке «Скрытые виджеты». Новый порядок сохранится автоматически.</Text>
          <Pressable onPress={onDismiss} style={({ pressed }) => [styles.hintButton, { backgroundColor: colors.primary, opacity: pressed ? pressedOpacity : 1 }]}>
            <Text style={[styles.hintButtonText, { color: colors.background }]}>ПОНЯТНО</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Metric({ icon, iconColor, value, label, colors }: { icon: any; iconColor: string; value: string; label: string; colors: any }) { return <View style={[styles.bigCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: iconColor, borderLeftWidth: 3, borderRadius: radius.card }, shadows.card]}><IconSymbol name={icon} size={20} color={iconColor} /><Text style={[styles.bigValue, { color: colors.foreground, fontVariant: ["tabular-nums"] }]}>{value}</Text><Text style={[styles.bigLabel, { color: colors.muted }]}>{label}</Text></View>; }

function WeeklyCardioChart({ points, colors }: { points: ReturnType<typeof getWeeklyCardioMinutes>; colors: any }) {
  const max = Math.max(1, ...points.map((point) => point.minutes));
  const total = points.reduce((sum, point) => sum + point.minutes, 0);
  return <View style={[styles.cardioChart, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.cardioChartHeader}><View><Text style={[styles.cardioChartTitle, { color: colors.foreground }]}>КАРДИО · 7 ДНЕЙ</Text><Text style={[styles.cardioChartHint, { color: colors.muted }]}>Время кардио по дням недели</Text></View><Text style={[styles.cardioChartTotal, { color: colors.primary }]}>{total} МИН</Text></View><Svg width="100%" height={132} viewBox="0 0 328 132"><Line x1="18" x2="316" y1="103" y2="103" stroke={colors.border} strokeWidth="1" />{points.map((point, index) => { const height = point.minutes ? Math.max(5, (point.minutes / max) * 76) : 2; const x = 25 + index * 43; return <Fragment key={point.date}><Rect x={x} y={103 - height} width="25" height={height} fill={point.minutes ? colors.primary : colors.border} /><SvgText x={x + 12} y="121" textAnchor="middle" fill={colors.muted} fontSize="9" fontWeight="800">{point.label}</SvgText>{point.minutes > 0 && <SvgText x={x + 12} y={96 - height} textAnchor="middle" fill={colors.foreground} fontSize="9" fontWeight="900">{point.minutes}</SvgText>}</Fragment>; })}</Svg></View>;
}

function ActivityTodayCard({ status, day, week, loaded, colors }: { status: ActivityProviderStatus | null; day: DailyActivityReading | null; week: ActivityWeekDay[]; loaded: boolean; colors: any }) {
  const fromGoogleFit = status?.source === "google-fit";
  const sourceLabel = fromGoogleFit ? "Google Fit" : "Health Connect";
  const connected = Boolean(status?.connected);
  const hasDayData = Boolean(day && (day.steps !== undefined || day.activeKcal !== undefined || day.distanceKm !== undefined || day.heartRate));
  const heartRate = day?.heartRate;
  const maxSteps = Math.max(1, ...week.map((entry) => entry.steps));
  const todayISO = week.at(-1)?.dateISO;
  const formatCount = (value: number) => Math.round(value).toLocaleString("ru-RU");
  const weekLabel = (dateISO: string) => new Date(`${dateISO}T12:00:00`).toLocaleDateString("ru-RU", { weekday: "short" }).replace(/^./, (char) => char.toLocaleUpperCase("ru"));
  return (
    <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.activityHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.activityTitle, { color: colors.foreground }]}>Активность · сегодня</Text>
          <Text style={[styles.activityHint, { color: colors.muted }]}>Шаги, калории и пульс из {sourceLabel}</Text>
        </View>
        <View style={[styles.activityBadge, { backgroundColor: `${colors.primary}18` }]}><Text style={[styles.activityBadgeText, { color: colors.primary }]}>{fromGoogleFit ? "GF" : "HC"}</Text></View>
      </View>
      {!loaded ? (
        <View style={[styles.activityEmpty, { borderColor: colors.border }]}><Text style={[styles.activityEmptyText, { color: colors.muted }]}>Загружаем данные {sourceLabel}…</Text></View>
      ) : !connected ? (
        <View style={[styles.activityEmpty, { borderColor: colors.border }]}>
          <Text style={[styles.activityEmptyTitle, { color: colors.foreground }]}>{sourceLabel} не подключён</Text>
          {fromGoogleFit ? (
            <>
              <Text style={[styles.activityEmptyText, { color: colors.muted }]}>Подключите Google Fit в настройках — он основной источник данных, Health Connect остаётся резервом.</Text>
              <Pressable onPress={() => router.push("/(tabs)/settings")} accessibilityRole="button" accessibilityLabel="Подключить Google Fit в настройках" style={({ pressed }) => [styles.activityConnectButton, { borderColor: colors.primary, opacity: pressed ? pressedOpacity : 1 }]}>
                <Text style={[styles.activityConnectButtonText, { color: colors.primary }]}>Подключить Google Fit</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.activityEmptyText, { color: colors.muted }]}>Разрешите IronRise читать активность и пульс — данные приходят из приложения «Здоровье».</Text>
              <Pressable onPress={() => router.push("/(tabs)/settings")} accessibilityRole="button" accessibilityLabel="Настроить Health Connect в настройках" style={({ pressed }) => [styles.activityConnectButton, { borderColor: colors.primary, opacity: pressed ? pressedOpacity : 1 }]}>
                <Text style={[styles.activityConnectButtonText, { color: colors.primary }]}>Настроить Health Connect</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : !hasDayData ? (
        <View style={[styles.activityEmpty, { borderColor: colors.border }]}>
          <Text style={[styles.activityEmptyTitle, { color: colors.foreground }]}>Нет данных за сегодня</Text>
          <Text style={[styles.activityEmptyText, { color: colors.muted }]}>{fromGoogleFit ? "Откройте приложение Google Fit, чтобы оно синхронизировало шаги, калории и пульс." : "Откройте приложение «Здоровье», чтобы оно синхронизировало шаги, калории и пульс в Health Connect."}</Text>
        </View>
      ) : (
        <>
          <View style={styles.activityMetrics}>
            <ActivityMetric label="Шаги" value={formatCount(day?.steps ?? 0)} colors={colors} />
            <ActivityMetric label="Активные ккал" value={formatCount(day?.activeKcal ?? 0)} colors={colors} />
            <ActivityMetric label="Дистанция" value={`${(day?.distanceKm ?? 0).toFixed(1)} км`} colors={colors} />
          </View>
          {heartRate && <Text style={[styles.activityHeartRate, { color: colors.muted }]}>Пульс: сейчас {heartRate.currentBpm ?? "—"} · среднее {heartRate.averageBpm ?? "—"} · пик {heartRate.peakBpm ?? "—"}</Text>}
          <View style={styles.activityWeek}>{week.map((entry) => {
            const isToday = entry.dateISO === todayISO;
            const height = entry.steps ? Math.max(6, (entry.steps / maxSteps) * 62) : 3;
            return (
              <View key={entry.dateISO} style={styles.activityWeekColumn}>
                <Text style={[styles.activityWeekValue, { color: isToday ? colors.primary : colors.muted }]}>{entry.steps ? formatCount(entry.steps) : " "}</Text>
                <View style={[styles.activityWeekBar, { height, backgroundColor: entry.steps ? (isToday ? colors.primary : `${colors.primary}55`) : colors.border }]} />
                <Text style={[styles.activityWeekLabel, { color: isToday ? colors.primary : colors.muted }]}>{weekLabel(entry.dateISO)}</Text>
              </View>
            );
          })}</View>
        </>
      )}
    </View>
  );
}

function ActivityMetric({ label, value, colors }: { label: string; value: string; colors: any }) {
  return <View style={[styles.activityMetric, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.activityMetricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.activityMetricLabel, { color: colors.muted }]}>{label}</Text></View>;
}

function PeriodComparison({ comparison, period, colors }: { comparison: NonNullable<ReturnType<typeof getStatsPeriodComparison>>; period: StatsFilterMode; colors: any }) {
  const periodName = period === "week" ? "прошлой неделей" : "прошлым месяцем";
  return <View style={[styles.comparisonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.comparisonHeader}><View><Text style={[styles.comparisonTitle, { color: colors.foreground }]}>Сравнение с {periodName}</Text><Text style={[styles.comparisonHint, { color: colors.muted }]}>Текущий период и предыдущий на одном экране</Text></View><View style={[styles.comparisonBadge, { backgroundColor: `${colors.primary}18` }]}><Text style={[styles.comparisonBadgeText, { color: colors.primary }]}>{period === "week" ? "НЕДЕЛЯ" : "МЕСЯЦ"}</Text></View></View><View style={styles.comparisonMetrics}><ComparisonMetric label={"Тренировки"} current={comparison.current.workoutCount} previous={comparison.previous.workoutCount} colors={colors} /><ComparisonMetric label={"Объём"} current={comparison.current.volume / 1000} previous={comparison.previous.volume / 1000} suffix=" т" decimals={1} colors={colors} /><ComparisonMetric label={"Время"} current={comparison.current.minutes} previous={comparison.previous.minutes} suffix=" мин" colors={colors} /></View></View>;
}

function ComparisonMetric({ label, current, previous, suffix = "", decimals = 0, colors }: { label: string; current: number; previous: number; suffix?: string; decimals?: number; colors: any }) {
  const change = getPercentageChange(current, previous);
  const trend = change === null ? "new" : change > 0 ? "up" : change < 0 ? "down" : "same";
  const trendColor = trend === "up" ? colors.success : trend === "down" ? colors.error : colors.muted;
  const trendText = change === null ? "Новые" : change === 0 ? "Без изменений" : `${change > 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(0)}%`;
  const format = (value: number) => `${value.toFixed(decimals)}${suffix}`;
  return <View style={[styles.comparisonMetric, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.comparisonMetricLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.comparisonCurrent, { color: colors.foreground }]}>{format(current)}</Text><Text style={[styles.comparisonPrevious, { color: colors.muted }]}>было {format(previous)}</Text><Text style={[styles.comparisonTrend, { color: trendColor }]}>{trendText}</Text></View>;
}

function OneRmHistoryChart({ exerciseName, points, colors }: { exerciseName: string; points: PersonalRecordHistoryPoint[]; colors: any }) {
  const width = 328; const height = 168; const paddingLeft = 37; const paddingRight = 15; const paddingTop = 24; const baseline = 126;
  const values = points.map((point) => point.estimatedOneRepMax); const minValue = values.length ? Math.min(...values) : 0; const maxValue = values.length ? Math.max(...values) : 0; const paddedMin = Math.max(0, minValue - Math.max(1, (maxValue - minValue) * 0.14)); const paddedMax = maxValue + Math.max(1, (maxValue - minValue) * 0.14); const range = Math.max(1, paddedMax - paddedMin);
  const chartWidth = width - paddingLeft - paddingRight;
  const coordinates = points.map((point, index) => ({ x: points.length === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (index / (points.length - 1)) * chartWidth, y: baseline - ((point.estimatedOneRepMax - paddedMin) / range) * (baseline - paddingTop), point }));
  const pointString = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const formatDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const latest = points.at(-1);
  return <View style={[styles.oneRmChartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.oneRmChartHeader}><View style={{ flex: 1 }}><Text style={[styles.oneRmChartTitle, { color: colors.foreground }]}>Динамика 1RM</Text><Text style={[styles.oneRmChartHint, { color: colors.muted }]}>{exerciseName} · точки — новые личные рекорды</Text></View>{latest && <View style={[styles.oneRmLatest, { backgroundColor: `${colors.primary}18` }]}><Text style={[styles.oneRmLatestLabel, { color: colors.primary }]}>ТЕКУЩИЙ</Text><Text style={[styles.oneRmLatestValue, { color: colors.foreground }]}>{latest.estimatedOneRepMax.toFixed(1)} кг</Text></View>}</View>{points.length ? <><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Line x1={paddingLeft} x2={width - paddingRight} y1={paddingTop} y2={paddingTop} stroke={colors.border} strokeWidth="1" strokeDasharray="4 4" /><Line x1={paddingLeft} x2={width - paddingRight} y1={baseline} y2={baseline} stroke={colors.border} strokeWidth="1" /><SvgText x="2" y={paddingTop + 4} fill={colors.muted} fontSize="9" fontWeight="800">{paddedMax.toFixed(1)}</SvgText><SvgText x="2" y={baseline + 3} fill={colors.muted} fontSize="9" fontWeight="800">{paddedMin.toFixed(1)}</SvgText><Polyline points={pointString} fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{coordinates.map(({ x, y, point }) => <Circle key={point.workoutId} cx={x} cy={y} r="6" fill={colors.background} stroke={colors.primary} strokeWidth="3" onPress={() => router.push({ pathname: "/workout-history/[id]" as never, params: { id: point.workoutId, edit: "1" } })} />)}</Svg><View style={styles.oneRmAxis}><Text style={[styles.oneRmAxisLabel, { color: colors.muted }]}>{formatDate(points[0].date)}</Text><Text style={[styles.oneRmAxisLabel, { color: colors.muted }]}>Нажмите точку, чтобы редактировать</Text><Text style={[styles.oneRmAxisLabel, { color: colors.muted }]}>{formatDate(points[points.length - 1].date)}</Text></View></> : <View style={styles.oneRmEmpty}><IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.muted} /><Text style={[styles.oneRmEmptyTitle, { color: colors.foreground }]}>Пока нет личного рекорда</Text><Text style={[styles.oneRmEmptyText, { color: colors.muted }]}>Завершите подход с улучшением 1RM — точка появится на графике.</Text></View>}</View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 32, gap: 13 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 12 }, settingsButton: { width: 42, height: 42, borderRadius: radius.tile, alignItems: "center", justifyContent: "center" }, eyebrow: { ...typeTokens.eyebrow }, title: { ...typeTokens.title, fontSize: 26, marginTop: 5 }, filters: { flexDirection: "row", borderRadius: radius.chip, borderWidth: 1, padding: 4, gap: 3 }, filter: { minHeight: 36, borderRadius: radius.chip, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, filterText: { fontSize: 12, fontWeight: "700" }, dateForm: { borderWidth: 1, borderRadius: radius.card, padding: 12, gap: 8 }, dateLabel: { ...typeTokens.eyebrow }, calendarField: { minHeight: 46, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9 }, calendarFieldText: { flex: 1, fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] }, rangeCalendarFields: { flexDirection: "row", gap: 8 }, rangeCalendarField: { flex: 1, minHeight: 52, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: 10, justifyContent: "center" }, rangeFieldCaption: { ...typeTokens.eyebrow, fontSize: 9 }, rangeFieldValue: { fontSize: 12, fontWeight: "700", marginTop: 4, fontVariant: ["tabular-nums"] }, rangeHint: { fontSize: 11, lineHeight: 15 }, bigStats: { flexDirection: "row", gap: 8, marginTop: 4 }, bigCard: { flex: 1, minHeight: 109, borderWidth: 1, borderLeftWidth: 3, borderRadius: radius.card, padding: 13, justifyContent: "space-between" }, bigValue: { fontSize: 24, fontWeight: "900", fontVariant: ["tabular-nums"] }, bigLabel: { fontSize: 11 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 7 }, section: { ...typeTokens.heading, fontSize: 19 }, hint: { fontSize: 12, lineHeight: 18, marginTop: 3, maxWidth: 270 }, count: { fontSize: 16, fontWeight: "800", marginTop: 4 }, record: { minHeight: 69, borderRadius: radius.tile, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }, recordIcon: { width: 38, height: 38, borderRadius: radius.input, alignItems: "center", justifyContent: "center" }, recordName: { fontSize: 13, fontWeight: "700" }, recordGroup: { fontSize: 11, marginTop: 4 }, recordValueWrap: { alignItems: "flex-end", maxWidth: 104 }, recordValue: { textAlign: "right", fontSize: 12, fontWeight: "800" }, oneRm: { fontSize: 10, fontWeight: "800", marginTop: 4 }, empty: { borderWidth: 1, borderRadius: radius.card, padding: 20, alignItems: "center", gap: 8 }, emptyTitle: { fontSize: 14, fontWeight: "800", marginTop: 2 }, emptyText: { fontSize: 12, lineHeight: 17, textAlign: "center" }, backdrop: { flex: 1, backgroundColor: "#050806B8", justifyContent: "flex-end" }, calendarSheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: 20, gap: 13 }, pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, pickerTitle: { ...typeTokens.title, fontSize: 20 }, pickerSubtitle: { fontSize: 11, marginTop: 4 }, pickerClose: { width: 38, height: 38, borderRadius: radius.chip, justifyContent: "center", alignItems: "center" }, pickerCloseText: { fontSize: 24, lineHeight: 27 }, pickerMonth: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }, pickerMonthText: { fontSize: 16, fontWeight: "800", textTransform: "capitalize" }, weekdays: { flexDirection: "row" }, weekday: { width: "14.285%", textAlign: "center", fontSize: 10, fontWeight: "700" }, calendarGrid: { flexDirection: "row", flexWrap: "wrap" }, calendarDay: { width: "14.285%", height: 43, borderRadius: radius.input, alignItems: "center", justifyContent: "center" },
  exerciseFilterCard: { minHeight: 61, borderWidth: 1, borderRadius: radius.card, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseFilterLabel: { ...typeTokens.eyebrow, fontSize: 9 },
  exerciseFilterValue: { fontSize: 13, fontWeight: "700", marginTop: 3 },
  exerciseFilterButton: { borderWidth: 1, borderRadius: radius.button, minHeight: 36, paddingHorizontal: 12, justifyContent: "center" },
  exerciseFilterButtonText: { fontSize: 11, fontWeight: "800" },
  clearExercise: { paddingHorizontal: 4, paddingVertical: 8 },
  clearExerciseText: { fontSize: 10, fontWeight: "800" },
  exerciseSheet: { maxHeight: "84%", borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: 20, gap: 12 },
  exerciseSearch: { minHeight: 46, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseSearchInput: { flex: 1, minHeight: 40, fontSize: 13, fontWeight: "600" },
  exerciseOptions: { gap: 8, paddingBottom: 4 },
  exerciseOption: { minHeight: 52, borderWidth: 1, borderRadius: radius.tile, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exerciseOptionText: { fontSize: 13, fontWeight: "700", flex: 1 },
  clearAllExercises: { minHeight: minTouchTarget, borderWidth: 1, borderRadius: radius.button, justifyContent: "center", alignItems: "center" },
  clearAllExercisesText: { fontSize: 12, fontWeight: "800" },
  comparisonCard: { borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 11 },
  comparisonHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
  comparisonTitle: { ...typeTokens.heading, fontSize: 14 },
  comparisonHint: { fontSize: 10, marginTop: 3 },
  comparisonBadge: { borderRadius: radius.chip, paddingHorizontal: 9, paddingVertical: 5 },
  comparisonBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  comparisonMetrics: { flexDirection: "row", gap: 7 },
  comparisonMetric: { flex: 1, minHeight: 92, borderWidth: 1, borderRadius: radius.tile, padding: 10, justifyContent: "space-between" },
  comparisonMetricLabel: { fontSize: 9, fontWeight: "700" },
  comparisonCurrent: { fontSize: 15, fontWeight: "800", marginTop: 3, fontVariant: ["tabular-nums"] },
  comparisonPrevious: { fontSize: 9, marginTop: 1 },
  comparisonTrend: { fontSize: 10, fontWeight: "800", marginTop: 5 },
  oneRmChartCard: { borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 7 },
  oneRmChartHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  oneRmChartTitle: { ...typeTokens.heading, fontSize: 15 },
  oneRmChartHint: { fontSize: 10, marginTop: 4, lineHeight: 14 },
  oneRmLatest: { borderRadius: radius.tile, minWidth: 80, paddingHorizontal: 9, paddingVertical: 7, alignItems: "flex-end" },
  oneRmLatestLabel: { ...typeTokens.eyebrow, fontSize: 8 },
  oneRmLatestValue: { fontSize: 12, fontWeight: "800", marginTop: 2, fontVariant: ["tabular-nums"] },
  oneRmAxis: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  oneRmAxisLabel: { fontSize: 9, fontWeight: "600", maxWidth: 95, textAlign: "center" },
  oneRmEmpty: { minHeight: 112, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, gap: 6 },
  oneRmEmptyTitle: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  oneRmEmptyText: { fontSize: 11, lineHeight: 16, textAlign: "center" }, cardioChart: { borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 7 }, cardioChartHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }, cardioChartTitle: { ...typeTokens.heading, fontSize: 15 }, cardioChartHint: { fontSize: 10, marginTop: 4 }, cardioChartTotal: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5, fontVariant: ["tabular-nums"] },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  activityCard: { borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 11 },
  activityHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  activityTitle: { ...typeTokens.heading, fontSize: 15 },
  activityHint: { fontSize: 10, marginTop: 4 },
  activityBadge: { borderRadius: radius.chip, paddingHorizontal: 9, paddingVertical: 5 },
  activityBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  activityMetrics: { flexDirection: "row", gap: 7 },
  activityMetric: { flex: 1, minHeight: 74, borderWidth: 1, borderRadius: radius.tile, padding: 10, justifyContent: "flex-end", gap: 2 },
  activityMetricValue: { fontSize: 17, fontWeight: "900", fontVariant: ["tabular-nums"] },
  activityMetricLabel: { fontSize: 9, fontWeight: "700" },
  activityHeartRate: { fontSize: 11, fontWeight: "600", fontVariant: ["tabular-nums"] },
  activityWeek: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 2 },
  activityWeekColumn: { flex: 1, alignItems: "center", gap: 4 },
  activityWeekBar: { width: "62%", borderRadius: 4 },
  activityWeekValue: { fontSize: 8, fontWeight: "800", fontVariant: ["tabular-nums"], minHeight: 11 },
  activityWeekLabel: { fontSize: 9, fontWeight: "700" },
  activityEmpty: { borderWidth: 1, borderStyle: "dashed", borderRadius: radius.tile, padding: 12, gap: 6 },
  activityEmptyTitle: { fontSize: 13, fontWeight: "800" },
  activityEmptyText: { fontSize: 11, lineHeight: 16 },
  activityConnectButton: { minHeight: minTouchTarget - 6, borderRadius: radius.button, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 4 },
  activityConnectButtonText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  editButton: { minHeight: 36, borderRadius: radius.chip, borderWidth: 1, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  editButtonText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  widgetShell: { position: "relative" },
  widgetHandle: { position: "absolute", right: 5, top: 5, width: 29, height: 29, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.chip, justifyContent: "center", alignItems: "center", zIndex: 12 },
  widgetHandleText: { fontSize: 19, lineHeight: 21, fontWeight: "800" },
  widgetHideButton: { position: "absolute", right: 40, top: 5, width: 29, height: 29, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.chip, justifyContent: "center", alignItems: "center", zIndex: 12 },
  widgetHideText: { fontSize: 17, lineHeight: 19, fontWeight: "800" },
  hiddenWidgetsCard: { borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 10 },
  hiddenWidgetsTitle: { ...typeTokens.heading, fontSize: 15 },
  hiddenWidgetsHint: { fontSize: 11, lineHeight: 16 },
  hiddenWidgetRow: { borderWidth: 1, borderRadius: radius.tile, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  hiddenWidgetTitle: { fontSize: 13, fontWeight: "700" },
  hiddenWidgetDescription: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  restoreButton: { minHeight: minTouchTarget - 8, borderRadius: radius.button, borderWidth: 1, paddingHorizontal: 12, justifyContent: "center" },
  restoreButtonText: { fontSize: 11, fontWeight: "800" },
  hiddenWidgetEmpty: { fontSize: 11, lineHeight: 16 },
  hintBackdrop: { flex: 1, backgroundColor: "#050806B8", alignItems: "center", justifyContent: "center", padding: 24 },
  hintCard: { width: "100%", maxWidth: 360, borderWidth: 1, borderRadius: radius.card, padding: 22, gap: 12 },
  hintEyebrow: { ...typeTokens.eyebrow, fontSize: 9 },
  hintTitle: { ...typeTokens.title, fontSize: 24, lineHeight: 28 },
  hintText: { fontSize: 13, lineHeight: 20, fontWeight: "500" },
  hintButton: { minHeight: minTouchTarget, borderRadius: radius.button, alignItems: "center", justifyContent: "center", marginTop: 4 },
  hintButtonText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.7 },
});
