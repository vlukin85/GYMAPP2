import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Dimensions, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { WorkoutShareCard } from "@/components/workout-share-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useWorkoutStore } from "@/lib/workout-store";
import { cancelWorkoutReminder, scheduleWorkoutReminder } from "@/lib/workout-notifications";
import { getCompletedWorkoutForDate, getExercise, getMonthCalendarDays, isFutureScheduleDate, isScheduledWorkoutCompleted, shiftCalendarMonth } from "@/lib/workout-data";
import { formatWorkoutSocialTemplate, getWorkoutRecordAchievements } from "@/lib/workout-achievements";

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const reminderOptions = [15, 30, 60, 120];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const readableDate = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

export default function CalendarScreen() {
  const colors = useColors();
  const { programs, scheduled, completed, personalRecords, scheduleProgram, removeSchedule, startWorkout, deleteCompletedWorkout } = useWorkoutStore();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [programId, setProgramId] = useState("");
  const [draftProgramId, setDraftProgramId] = useState("");
  const [time, setTime] = useState("18:30");
  const [reminderMinutes, setReminderMinutes] = useState(60);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTemplate, setShareTemplate] = useState<"telegram" | "instagram">("telegram");
  const [draggedDate, setDraggedDate] = useState<string | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);
  const [isDragging, setDragging] = useState(false);
  const gridRef = useRef<View>(null);
  const draggedDateRef = useRef<string | null>(null);
  const dropDateRef = useRef<string | null>(null);
  const gridPageYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const shareCardRef = useRef<any>(null);
  const days = useMemo(() => getMonthCalendarDays(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const activeSchedule = scheduled[selectedDate];
  const selectedProgram = programs.find((item) => item.id === programId);
  const draftProgram = programs.find((item) => item.id === draftProgramId);
  const selectedCompletedWorkout = useMemo(() => getCompletedWorkoutForDate(completed, selectedDate), [completed, selectedDate]);
  const completedProgram = selectedCompletedWorkout ? programs.find((item) => item.id === selectedCompletedWorkout.programId) : undefined;
  const workoutAchievements = useMemo(() => selectedCompletedWorkout ? getWorkoutRecordAchievements(selectedCompletedWorkout, personalRecords) : [], [personalRecords, selectedCompletedWorkout]);
  const shareRecords = useMemo(() => workoutAchievements.map((record) => ({ ...record, name: getExercise(record.exerciseId)?.name ?? record.exerciseId })), [workoutAchievements]);
  const shareText = useMemo(() => selectedCompletedWorkout ? formatWorkoutSocialTemplate(shareTemplate, { workout: selectedCompletedWorkout, programName: completedProgram?.name ?? "Тренировка", records: shareRecords }) : "", [completedProgram?.name, selectedCompletedWorkout, shareRecords, shareTemplate]);
  const hasCompletedResult = Boolean(selectedCompletedWorkout);
  const futureSchedule = Boolean(activeSchedule && isFutureScheduleDate(selectedDate));
  const completedDates = useMemo(() => new Set(completed.map((workout) => workout.date.slice(0, 10))), [completed]);

  const changeMonth = useCallback((offset: number) => {
    if (!isDraggingRef.current) setCursor((current) => shiftCalendarMonth(current, offset));
  }, []);
  const selectDate = (date: Date) => {
    if (isDragging) return;
    const key = dateKey(date);
    const entry = scheduled[key];
    const nextProgramId = entry?.programId ?? programs[0]?.id ?? "";
    setSelectedDate(key);
    setProgramId(nextProgramId);
    setDraftProgramId(nextProgramId);
    setTime(entry?.time ?? "18:30");
    setReminderMinutes(entry?.reminderMinutes ?? 60);
  };
  const openPicker = () => {
    const nextProgramId = programId || programs[0]?.id || "";
    setDraftProgramId(nextProgramId);
    setPickerOpen(true);
  };
  const persistPlan = async (chosenProgramId: string) => {
    const program = programs.find((item) => item.id === chosenProgramId);
    if (!program) return;
    try {
      await cancelWorkoutReminder(scheduled[selectedDate]?.notificationId);
      const notificationId = await scheduleWorkoutReminder({ date: selectedDate, time, reminderMinutes, programName: program.name });
      scheduleProgram(selectedDate, { programId: chosenProgramId, time, reminderMinutes, notificationId });
      setProgramId(chosenProgramId);
      setPickerOpen(false);
      Alert.alert("Тренировка запланирована", `${program.name} · ${readableDate(selectedDate)} в ${time}`);
    } catch {
      Alert.alert("Не удалось запланировать", "Проверь разрешение на уведомления.");
    }
  };
  const deletePlan = async () => {
    if (!activeSchedule) return;
    await cancelWorkoutReminder(activeSchedule.notificationId);
    removeSchedule(selectedDate);
    Alert.alert("Тренировка удалена", "Напоминание также отменено.");
  };
  const deleteCompletedResult = () => {
    if (!selectedCompletedWorkout) return;
    Alert.alert(
      "Удалить выполненную тренировку?",
      "Результат будет удалён из истории, личные рекорды пересчитаются, а зелёная галочка исчезнет из календаря. После этого дату можно снова запланировать.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить из расписания",
          style: "destructive",
          onPress: () => {
            deleteCompletedWorkout(selectedCompletedWorkout.id);
            setResultOpen(false);
          },
        },
      ],
    );
  };
  const beginDrag = (sourceDate: string) => {
    const schedule = scheduled[sourceDate];
    if (!schedule) return;
    if (isScheduledWorkoutCompleted(completed, sourceDate, schedule.programId)) {
      Alert.alert("Тренировка уже выполнена", "Выполненную тренировку нельзя переносить. Создайте новую запись в расписании.");
      return;
    }
    gridRef.current?.measure((_x, _y, _width, _height, _pageX, pageY) => { gridPageYRef.current = pageY; });
    draggedDateRef.current = sourceDate;
    dropDateRef.current = null;
    isDraggingRef.current = true;
    setDraggedDate(sourceDate);
    setDropDate(null);
    setDragging(true);
  };
  const updateDropTarget = (pageX: number, pageY: number) => {
    if (!isDraggingRef.current || !draggedDateRef.current) return;
    const cellWidth = (Dimensions.get("window").width - 40) / 7;
    const col = Math.max(0, Math.min(6, Math.floor((pageX - 20) / cellWidth)));
    const row = Math.max(0, Math.min(5, Math.floor((pageY - gridPageYRef.current) / 47)));
    const date = days[row * 7 + col];
    if (date) {
      const target = dateKey(date);
      dropDateRef.current = target;
      setDropDate(target);
    }
  };
  const finishDrag = async () => {
    const from = draggedDateRef.current;
    const to = dropDateRef.current;
    draggedDateRef.current = null;
    dropDateRef.current = null;
    isDraggingRef.current = false;
    setDragging(false);
    setDraggedDate(null);
    setDropDate(null);
    if (!from || !to || from === to) return;
    const schedule = scheduled[from];
    if (!schedule) return;
    if (scheduled[to]) {
      Alert.alert("Дата занята", "Выберите свободный день для переноса тренировки.");
      return;
    }
    const program = programs.find((item) => item.id === schedule.programId);
    try {
      await cancelWorkoutReminder(schedule.notificationId);
      const notificationId = program ? await scheduleWorkoutReminder({ date: to, time: schedule.time, reminderMinutes: schedule.reminderMinutes, programName: program.name }) : undefined;
      scheduleProgram(to, { ...schedule, notificationId });
      removeSchedule(from);
      setSelectedDate(to);
      setProgramId(schedule.programId);
      setDraftProgramId(schedule.programId);
      setTime(schedule.time);
      setReminderMinutes(schedule.reminderMinutes);
      Alert.alert("Тренировка перенесена", `${program?.name ?? "Тренировка"} перенесена на ${readableDate(to)}.`);
    } catch {
      Alert.alert("Не удалось перенести", "Проверь подключение и разрешения для уведомлений.");
    }
  };
  const monthSwipeGesture = Gesture.Pan().activeOffsetX([-28, 28]).failOffsetY([-18, 18]).onEnd((event) => {
    if (Math.abs(event.translationX) >= 58) runOnJS(changeMonth)(event.translationX > 0 ? -1 : 1);
  });
  const shareCompletedWorkout = async () => {
    if (!selectedCompletedWorkout || !shareText) return;
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && "share" in navigator) {
          await navigator.share({ title: `IronRise · ${completedProgram?.name ?? "Тренировка"}`, text: shareText });
          return;
        }
        Alert.alert("Достижения готовы", shareText);
        return;
      }
      await Share.share({ title: `IronRise · ${completedProgram?.name ?? "Тренировка"}`, message: shareText });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      Alert.alert("Не удалось поделиться", "Попробуйте ещё раз — результаты тренировки сохранены.");
    }
  };
  const shareVisualCard = async () => {
    if (!selectedCompletedWorkout) return;
    try {
      if (Platform.OS === "web") {
        await shareCompletedWorkout();
        return;
      }
      if (!(await Sharing.isAvailableAsync()) || !shareCardRef.current) {
        Alert.alert("Обмен недоступен", "На этом устройстве не удалось открыть системное меню обмена.");
        return;
      }
      const uri = await shareCardRef.current.capture();
      await Sharing.shareAsync(uri, { dialogTitle: "Поделиться карточкой IronRise", mimeType: "image/png" });
    } catch {
      Alert.alert("Не удалось подготовить карточку", "Попробуйте поделиться текстовым шаблоном.");
    }
  };

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
    <ScrollView contentContainerStyle={styles.content} scrollEnabled={!isDragging}>
      <View style={styles.header}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>Планер тренировок</Text><Pressable onPress={() => setCursor(new Date())}><Text style={[styles.today, { color: colors.primary }]}>Сегодня</Text></Pressable></View>
      <View style={styles.monthHeader}><Pressable onPress={() => changeMonth(-1)} style={[styles.arrow, { backgroundColor: colors.surface }]}><IconSymbol name="chevron.left" size={20} color={colors.foreground} /></Pressable><View><Text style={[styles.month, { color: colors.foreground }]}>{cursor.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</Text><Text style={[styles.monthSub, { color: colors.muted }]}>{Object.keys(scheduled).filter((key) => key.startsWith(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`)).length} запланировано · {Array.from(completedDates).filter((key) => key.startsWith(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`)).length} выполнено</Text></View><Pressable onPress={() => changeMonth(1)} style={[styles.arrow, { backgroundColor: colors.surface }]}><IconSymbol name="chevron.right" size={20} color={colors.foreground} /></Pressable></View>
      <Text style={[styles.dragHint, { color: colors.muted }]}>Свайпайте календарь влево или вправо для смены месяца. Для переноса удерживайте только запланированную тренировку и ведите вертикально.</Text>
      <View style={styles.weekdays}>{weekDays.map((day) => <Text key={day} style={[styles.weekday, { color: colors.muted }]}>{day}</Text>)}</View>
      <GestureDetector gesture={monthSwipeGesture}><View ref={gridRef} style={styles.grid}>{days.map((date) => {
        const key = dateKey(date);
        const isSelected = key === selectedDate;
        const isCurrent = date.getMonth() === cursor.getMonth();
        const hasPlan = Boolean(scheduled[key]);
        const isCompleted = completedDates.has(key);
        const isTarget = key === dropDate;
        const dragGesture = Gesture.Pan().activateAfterLongPress(260).activeOffsetY([-5, 5]).failOffsetX([-18, 18]).onStart(() => runOnJS(beginDrag)(key)).onUpdate((event) => runOnJS(updateDropTarget)(event.absoluteX, event.absoluteY)).onEnd(() => runOnJS(finishDrag)());
        return <GestureDetector key={key} gesture={dragGesture}><View style={styles.dayHitbox}><Pressable onPress={() => selectDate(date)} style={[styles.day, isSelected && { backgroundColor: colors.primary }, key === draggedDate && styles.dragSource, isTarget && { backgroundColor: colors.success + "22", borderColor: colors.success, borderWidth: 2 }]}><Text style={{ color: isSelected ? "#111217" : isCurrent ? colors.foreground : colors.muted, fontWeight: isSelected ? "900" : "700" }}>{date.getDate()}</Text>{isCompleted ? <View style={[styles.completedMark, { backgroundColor: isSelected ? "#111217" : colors.success }]}><Text style={{ color: isSelected ? colors.success : "#FFFFFF", fontSize: 8, fontWeight: "900" }}>✓</Text></View> : hasPlan && <View style={[styles.dot, { backgroundColor: isSelected ? "#111217" : colors.primary }]} />}{isTarget && <Text style={[styles.dropLabel, { color: colors.success }]}>сюда</Text>}</Pressable></View></GestureDetector>;
      })}</View></GestureDetector>

      <View style={[styles.editor, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.editorDate, { color: colors.foreground }]}>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</Text>
        {hasCompletedResult && selectedCompletedWorkout ? <View style={[styles.resultCard, { backgroundColor: colors.background, borderColor: colors.success + "66" }]}>
          <View style={styles.resultHeader}><View style={[styles.resultIcon, { backgroundColor: colors.success + "20" }]}><Text style={[styles.resultCheck, { color: colors.success }]}>✓</Text></View><View style={{ flex: 1 }}><Text style={[styles.resultEyebrow, { color: colors.success }]}>ВЫПОЛНЕННАЯ ПРОГРАММА</Text><Text style={[styles.resultName, { color: colors.foreground }]}>{completedProgram?.name ?? "Тренировка"}</Text></View></View>
          <View style={styles.resultMetrics}><View><Text style={[styles.resultMetricValue, { color: colors.foreground }]}>{selectedCompletedWorkout.durationMinutes} мин</Text><Text style={[styles.resultMetricLabel, { color: colors.muted }]}>ДЛИТЕЛЬНОСТЬ</Text></View><View><Text style={[styles.resultMetricValue, { color: colors.foreground }]}>{Math.round(selectedCompletedWorkout.totalVolume).toLocaleString("ru-RU")} кг</Text><Text style={[styles.resultMetricLabel, { color: colors.muted }]}>ОБЪЁМ</Text></View><View><Text style={[styles.resultMetricValue, { color: colors.foreground }]}>{selectedCompletedWorkout.sets?.length ?? 0}</Text><Text style={[styles.resultMetricLabel, { color: colors.muted }]}>ПОДХОДОВ</Text></View></View>
          {workoutAchievements.length > 0 && <View style={[styles.achievementCard, { backgroundColor: colors.success + "12", borderColor: colors.success + "55" }]}><Text style={[styles.achievementEyebrow, { color: colors.success }]}>НОВЫЕ ЛИЧНЫЕ РЕКОРДЫ · {workoutAchievements.length}</Text>{workoutAchievements.map((record) => <View key={record.exerciseId} style={styles.achievementRow}><View style={{ flex: 1 }}><Text style={[styles.achievementName, { color: colors.foreground }]}>{getExercise(record.exerciseId)?.name ?? record.exerciseId}</Text><Text style={[styles.achievementMeta, { color: colors.muted }]}>{record.weight} кг × {record.reps}</Text></View><Text style={[styles.achievementOneRm, { color: colors.success }]}>1RM {record.estimatedOneRepMax.toFixed(1)} кг</Text></View>)}</View>}
          <Pressable onPress={() => setResultOpen(true)} style={[styles.resultsButton, { backgroundColor: colors.success }]}><Text style={styles.resultsButtonText}>Просмотреть результаты</Text><IconSymbol name="chevron.right" size={18} color="#101412" /></Pressable>
          <Pressable onPress={deleteCompletedResult} style={[styles.shareButton, { borderColor: colors.error }]}><Text style={[styles.shareButtonText, { color: colors.error }]}>Удалить из расписания</Text></Pressable>
        </View> : <>
          <View style={[styles.selectedProgram, { backgroundColor: colors.background, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.label, { color: colors.muted }]}>ВЫБРАННАЯ ПРОГРАММА</Text><Text style={[styles.programName, { color: colors.foreground }]}>{selectedProgram?.name ?? "Выберите программу"}</Text><Text style={[styles.programDescription, { color: colors.muted }]}>{selectedProgram ? `${selectedProgram.exercises.length} упражнений · ${selectedProgram.description}` : "Выбор доступен по кнопке ниже"}</Text></View><Pressable onPress={openPicker} style={[styles.change, { borderColor: colors.primary }]}><Text style={[styles.changeText, { color: colors.primary }]}>Выбрать</Text></Pressable></View>
          <View style={styles.details}><View style={{ flex: 1 }}><Text style={[styles.label, { color: colors.muted }]}>Начало</Text><TextInput value={time} onChangeText={setTime} placeholder="18:30" placeholderTextColor={colors.muted} style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]} /></View><View style={{ flex: 1.7 }}><Text style={[styles.label, { color: colors.muted }]}>Напомнить за</Text><View style={styles.reminders}>{reminderOptions.map((minutes) => <Pressable key={minutes} onPress={() => setReminderMinutes(minutes)} style={[styles.reminder, { backgroundColor: reminderMinutes === minutes ? colors.primary : colors.background, borderColor: reminderMinutes === minutes ? colors.primary : colors.border }]}><Text style={{ color: reminderMinutes === minutes ? "#111217" : colors.foreground, fontWeight: "800", fontSize: 11 }}>{minutes}м</Text></Pressable>)}</View></View></View>
          <Pressable onPress={openPicker} style={[styles.save, { backgroundColor: colors.primary }]}><Text style={styles.saveText}>Запланировать тренировку</Text></Pressable>
          {activeSchedule && <Pressable onPress={deletePlan}><Text style={[styles.deleteText, { color: colors.error }]}>Удалить из расписания</Text></Pressable>}
        </>}
      </View>
      {!hasCompletedResult && activeSchedule && <View><Pressable disabled={futureSchedule} onPress={() => { if (!futureSchedule) { startWorkout(activeSchedule.programId); router.push({ pathname: "/workout", params: { programId: activeSchedule.programId } }); } }} style={[styles.start, { borderColor: futureSchedule ? colors.border : colors.primary, opacity: futureSchedule ? 0.45 : 1 }]}><Text style={[styles.startText, { color: futureSchedule ? colors.muted : colors.primary }]}>{futureSchedule ? "Тренировка ещё не началась" : "Начать тренировку сейчас"}</Text><IconSymbol name="chevron.right" size={19} color={futureSchedule ? colors.muted : colors.primary} /></Pressable>{futureSchedule && <Text style={[styles.futureHint, { color: colors.muted }]}>Запуск будет доступен {readableDate(selectedDate)}.</Text>}</View>}
    </ScrollView>

    <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}><View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.background }]}><View style={styles.sheetHeader}><View><Text style={[styles.sheetTitle, { color: colors.foreground }]}>Выберите программу</Text><Text style={[styles.sheetSubtitle, { color: colors.muted }]}>План на {readableDate(selectedDate)}</Text></View><Pressable onPress={() => setPickerOpen(false)} style={[styles.close, { backgroundColor: colors.surface }]}><Text style={[styles.closeText, { color: colors.foreground }]}>×</Text></Pressable></View><ScrollView contentContainerStyle={styles.programList}>{programs.map((program) => { const selected = draftProgramId === program.id; return <Pressable key={program.id} onPress={() => setDraftProgramId(program.id)} style={[styles.programOption, { backgroundColor: selected ? colors.primary + "20" : colors.surface, borderColor: selected ? colors.primary : colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.optionName, { color: colors.foreground }]}>{program.name}</Text><Text style={[styles.optionDescription, { color: colors.muted }]}>{program.exercises.length} упражнений · {program.description}</Text></View><View style={[styles.radio, { borderColor: selected ? colors.primary : colors.muted }]}>{selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}</View></Pressable>; })}</ScrollView><Pressable disabled={!draftProgram} onPress={() => draftProgram && persistPlan(draftProgram.id)} style={[styles.confirm, { backgroundColor: colors.primary, opacity: draftProgram ? 1 : 0.5 }]}><Text style={styles.confirmText}>{draftProgram ? `Запланировать: ${draftProgram.name}` : "Выберите программу"}</Text></Pressable></View></View></Modal>
    <Modal visible={resultOpen} transparent animationType="slide" onRequestClose={() => setResultOpen(false)}><View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.background }]}><View style={styles.sheetHeader}><View><Text style={[styles.sheetTitle, { color: colors.foreground }]}>Результаты тренировки</Text><Text style={[styles.sheetSubtitle, { color: colors.muted }]}>{completedProgram?.name ?? "Тренировка"} · {readableDate(selectedDate)}</Text></View><Pressable onPress={() => setResultOpen(false)} style={[styles.close, { backgroundColor: colors.surface }]}><Text style={[styles.closeText, { color: colors.foreground }]}>×</Text></Pressable></View>{selectedCompletedWorkout && <><View style={[styles.resultSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.resultSummaryValue, { color: colors.foreground }]}>{selectedCompletedWorkout.durationMinutes} мин</Text><Text style={[styles.resultSummaryValue, { color: colors.foreground }]}>{Math.round(selectedCompletedWorkout.totalVolume).toLocaleString("ru-RU")} кг</Text><Text style={[styles.resultSummaryValue, { color: colors.foreground }]}>{selectedCompletedWorkout.sets?.length ?? 0} подходов</Text></View><View style={styles.shareActions}><Pressable onPress={() => setShareOpen(true)} style={[styles.shareAction, { backgroundColor: colors.primary }]}><Text style={styles.shareActionText}>Поделиться достижениями</Text></Pressable></View><ScrollView contentContainerStyle={styles.completedSetList}>{selectedCompletedWorkout.sets?.length ? selectedCompletedWorkout.sets.map((set, index) => <View key={`${set.exerciseId}-${index}`} style={[styles.completedSet, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.completedSetName, { color: colors.foreground }]}>{getExercise(set.exerciseId)?.name ?? set.exerciseId}</Text><Text style={[styles.completedSetMeta, { color: colors.muted }]}>Подход {index + 1}</Text></View><Text style={[styles.completedSetValue, { color: colors.success }]}>{set.weight} кг × {set.reps}</Text></View>) : <Text style={[styles.emptyResults, { color: colors.muted }]}>Подробные подходы недоступны для этой записи.</Text>}</ScrollView></>}</View></View></Modal>
    <Modal visible={shareOpen} transparent animationType="slide" onRequestClose={() => setShareOpen(false)}><View style={styles.backdrop}><View style={[styles.shareSheet, { backgroundColor: colors.background }]}><View style={styles.sheetHeader}><View><Text style={[styles.sheetTitle, { color: colors.foreground }]}>Поделиться достижением</Text><Text style={[styles.sheetSubtitle, { color: colors.muted }]}>Карточка и текст готовы для публикации</Text></View><Pressable onPress={() => setShareOpen(false)} style={[styles.close, { backgroundColor: colors.surface }]}><Text style={[styles.closeText, { color: colors.foreground }]}>×</Text></Pressable></View>{selectedCompletedWorkout && <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.shareContent}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shareCardScroll}><WorkoutShareCard captureRef={shareCardRef} workout={selectedCompletedWorkout} programName={completedProgram?.name ?? "Тренировка"} records={shareRecords} /></ScrollView><View style={[styles.templatePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>{(["telegram", "instagram"] as const).map((template) => <Pressable key={template} onPress={() => setShareTemplate(template)} style={[styles.templateOption, { backgroundColor: shareTemplate === template ? colors.primary : "transparent" }]}><Text style={[styles.templateText, { color: shareTemplate === template ? "#101412" : colors.muted }]}>{template === "telegram" ? "Telegram" : "Instagram"}</Text></Pressable>)}</View><View style={[styles.sharePreview, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.sharePreviewText, { color: colors.foreground }]}>{shareText}</Text></View><Pressable onPress={shareVisualCard} style={[styles.shareImageButton, { backgroundColor: colors.primary }]}><Text style={styles.shareImageButtonText}>Поделиться карточкой PNG</Text></Pressable><Pressable onPress={shareCompletedWorkout} style={[styles.shareTextButton, { borderColor: colors.border }]}><Text style={[styles.shareTextButtonText, { color: colors.foreground }]}>Поделиться текстом</Text></Pressable></ScrollView>}</View></View></Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 34, gap: 13 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { fontSize: 16, fontWeight: "900" }, today: { fontSize: 13, fontWeight: "800" }, monthHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }, arrow: { width: 40, height: 40, borderRadius: 14, justifyContent: "center", alignItems: "center" }, month: { fontSize: 23, fontWeight: "900", textTransform: "capitalize", textAlign: "center" }, monthSub: { fontSize: 11, textAlign: "center", marginTop: 4 }, dragHint: { fontSize: 11, lineHeight: 16 }, weekdays: { flexDirection: "row" }, weekday: { width: "14.285%", textAlign: "center", fontSize: 11, fontWeight: "800" }, grid: { flexDirection: "row", flexWrap: "wrap" }, dayHitbox: { width: "14.285%", height: 47 }, day: { width: "100%", height: "100%", borderRadius: 13, justifyContent: "center", alignItems: "center", gap: 2 }, dragSource: { opacity: 0.42, transform: [{ scale: 0.93 }] }, dot: { width: 5, height: 5, borderRadius: 3 }, completedMark: { width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" }, dropLabel: { fontSize: 8, fontWeight: "900" },
  editor: { borderWidth: 1, borderRadius: 20, padding: 15, gap: 12 }, editorDate: { fontSize: 18, fontWeight: "900", textTransform: "capitalize" }, label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 }, selectedProgram: { minHeight: 82, borderWidth: 1, borderRadius: 15, padding: 11, flexDirection: "row", alignItems: "center", gap: 10 }, programName: { fontSize: 14, fontWeight: "900", marginTop: 4 }, programDescription: { fontSize: 11, lineHeight: 16, marginTop: 3 }, change: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, minHeight: 35, justifyContent: "center" }, changeText: { fontSize: 11, fontWeight: "900" }, details: { flexDirection: "row", gap: 11 }, timeInput: { height: 42, borderWidth: 1, borderRadius: 12, marginTop: 5, paddingHorizontal: 11, fontSize: 15, fontWeight: "800" }, reminders: { flexDirection: "row", gap: 5, marginTop: 5 }, reminder: { flex: 1, height: 42, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" }, save: { minHeight: 52, borderRadius: 15, justifyContent: "center", alignItems: "center" }, saveText: { color: "#111217", fontSize: 14, fontWeight: "900" }, deleteText: { textAlign: "center", fontSize: 12, fontWeight: "800" }, start: { borderWidth: 1, minHeight: 53, borderRadius: 16, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, startText: { fontSize: 14, fontWeight: "900" }, futureHint: { fontSize: 11, marginTop: 7, textAlign: "center" },
  resultCard: { borderWidth: 1, borderRadius: 16, padding: 13, gap: 13 }, resultHeader: { flexDirection: "row", alignItems: "center", gap: 10 }, resultIcon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" }, resultCheck: { fontSize: 21, fontWeight: "900" }, resultEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, resultName: { fontSize: 15, fontWeight: "900", marginTop: 3 }, resultMetrics: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, resultMetricValue: { fontSize: 15, fontWeight: "900" }, resultMetricLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.45, marginTop: 3 }, achievementCard: { borderWidth: 1, borderRadius: 13, padding: 10, gap: 8 }, achievementEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 0.55 }, achievementRow: { flexDirection: "row", alignItems: "center", gap: 8 }, achievementName: { fontSize: 12, fontWeight: "900" }, achievementMeta: { fontSize: 10, marginTop: 2 }, achievementOneRm: { fontSize: 11, fontWeight: "900" }, resultsButton: { minHeight: 44, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, resultsButtonText: { color: "#101412", fontSize: 12, fontWeight: "900" }, shareButton: { minHeight: 42, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" }, shareButtonText: { fontSize: 12, fontWeight: "900" },
  backdrop: { flex: 1, backgroundColor: "#090611A8", justifyContent: "flex-end" }, sheet: { maxHeight: "84%", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 }, sheetHeader: { flexDirection: "row", justifyContent: "space-between" }, sheetTitle: { fontSize: 22, fontWeight: "900" }, sheetSubtitle: { fontSize: 12, marginTop: 4 }, close: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" }, closeText: { fontSize: 25, lineHeight: 28 }, programList: { gap: 9, paddingBottom: 3 }, programOption: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 }, optionName: { fontSize: 14, fontWeight: "900" }, optionDescription: { fontSize: 11, lineHeight: 16, marginTop: 4 }, radio: { width: 21, height: 21, borderWidth: 2, borderRadius: 11, justifyContent: "center", alignItems: "center" }, radioDot: { width: 11, height: 11, borderRadius: 6 }, confirm: { minHeight: 52, borderRadius: 15, alignItems: "center", justifyContent: "center" }, confirmText: { color: "#111217", fontSize: 13, fontWeight: "900", textAlign: "center", paddingHorizontal: 12 },
  resultSummary: { borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: "row", justifyContent: "space-between" }, resultSummaryValue: { fontSize: 12, fontWeight: "900" }, shareActions: { marginBottom: 1 }, shareAction: { minHeight: 45, borderRadius: 13, alignItems: "center", justifyContent: "center" }, shareActionText: { color: "#101412", fontSize: 12, fontWeight: "900" }, completedSetList: { gap: 8, paddingBottom: 8 }, completedSet: { minHeight: 62, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: "row", alignItems: "center", gap: 8 }, completedSetName: { fontSize: 12, fontWeight: "900" }, completedSetMeta: { fontSize: 10, marginTop: 3 }, completedSetValue: { fontSize: 12, fontWeight: "900" }, emptyResults: { textAlign: "center", marginVertical: 24, fontSize: 12 }, shareSheet: { maxHeight: "92%", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 }, shareContent: { gap: 12, paddingBottom: 8 }, shareCardScroll: { paddingVertical: 2, paddingHorizontal: 2 }, templatePicker: { flexDirection: "row", borderWidth: 1, borderRadius: 13, padding: 4, gap: 4 }, templateOption: { flex: 1, minHeight: 37, borderRadius: 9, alignItems: "center", justifyContent: "center" }, templateText: { fontSize: 12, fontWeight: "900" }, sharePreview: { borderWidth: 1, borderRadius: 14, padding: 12 }, sharePreviewText: { fontSize: 12, lineHeight: 18 }, shareImageButton: { minHeight: 49, borderRadius: 14, alignItems: "center", justifyContent: "center" }, shareImageButtonText: { color: "#101412", fontSize: 13, fontWeight: "900" }, shareTextButton: { minHeight: 46, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" }, shareTextButtonText: { fontSize: 13, fontWeight: "900" },
});
