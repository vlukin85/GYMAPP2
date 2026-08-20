import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, LayoutAnimation, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Line, Rect } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { entryCalories, sumEntryMacros } from "@/lib/nutrition-data";
import { useNutritionStore } from "@/lib/nutrition-store";
import { type HomeWidgetId, useHomeWidgets } from "@/lib/home-widgets";
import { useWorkoutStore } from "@/lib/workout-store";
import { formatDuration, getExercise, getProgram } from "@/lib/workout-data";
import { buildHomeWorkoutTrend, type HomeWorkoutTrendPoint } from "@/lib/home-workout-trend";
import { getDailyAthleteQuote } from "@/lib/daily-athlete-quote";

const REFERENCE_BLUE = "#1746D2";

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const titleCase = (value: string) => value ? value[0].toUpperCase() + value.slice(1) : value;

export default function HomeScreen() {
  const colors = useColors();
  const { programs, completed, scheduled, startWorkout } = useWorkoutStore();
  const { entries: nutritionEntries, dailyCalorieGoal, dailyMacroGoals } = useNutritionStore();
  const homeWidgets = useHomeWidgets();
  const now = new Date();
  const today = dateKey(now);
  const nutritionToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todaySchedule = scheduled[today];
  const todayProgram = todaySchedule ? getProgram(todaySchedule.programId) ?? programs.find((program) => program.id === todaySchedule.programId) : undefined;
  const workoutTrend = buildHomeWorkoutTrend(completed);
  const weekVolume = completed.reduce((sum, item) => sum + item.totalVolume, 0);
  const dayLabel = titleCase(now.toLocaleDateString("ru-RU", { weekday: "long" }));
  const monthLabel = now.toLocaleDateString("ru-RU", { month: "long" }).toUpperCase();
  const todayFoodEntries = nutritionEntries.filter((entry) => entry.date === nutritionToday);
  const foodCalories = todayFoodEntries.reduce((sum, entry) => sum + entryCalories(entry), 0);
  const foodMacros = sumEntryMacros(todayFoodEntries);
  const dailyQuote = getDailyAthleteQuote(now);

  return (
    <ScreenContainer className="px-0" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: colors.primary }]} />
        <View style={styles.heroGrid}>
          <View style={[styles.heroLeft, { borderColor: colors.border }]}>
            <Text style={[styles.sideMotto, { color: colors.foreground }]}>ПОДНИМАЙ. ПРОГРЕССИРУЙ. ПОВТОРЯЙ.</Text>
            <View style={[styles.mottoRule, { backgroundColor: colors.foreground }]} />
          </View>
          <View style={[styles.dayPanel, { borderColor: colors.border }]}>
            <Text style={[styles.dayNumber, { color: colors.foreground }]}>{String(now.getDate()).padStart(2, "0")}</Text>
            <View style={styles.dayMeta}><Text style={[styles.redKicker, { color: colors.primary }]}>СЕГОДНЯ</Text><Text style={[styles.dayName, { color: colors.foreground }]}>{dayLabel}</Text><Text style={[styles.dateText, { color: colors.foreground }]}>{now.getDate()} {monthLabel}</Text><View style={[styles.redRule, { backgroundColor: colors.primary }]} /></View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76} style={[styles.wordmark, { color: colors.foreground }]}>IRON<Text style={{ color: colors.primary }}>RISE</Text></Text>
            <Text style={[styles.tagline, { color: colors.foreground }]}>СТАНЬ СИЛЬНЕЕ СЕБЯ ВЧЕРАШНЕГО.</Text>
            <View style={styles.brandCredit}><Text style={[styles.creditName, { color: colors.foreground }]}>by Vasily Lukin</Text><Text style={[styles.creditRights, { color: colors.muted }]}>© All rights reserved</Text></View>
            <View style={[styles.blueBlock, { backgroundColor: REFERENCE_BLUE }]} />
          </View>
          <View style={[styles.planPanel, { borderColor: colors.border }]}>
            <View style={[styles.planHeading, { borderBottomColor: colors.border }]}><Text style={[styles.planStar, { color: colors.primary }]}>✳</Text><Text style={[styles.planTitle, { color: colors.primary }]}>ПЛАН</Text></View>
            {todayProgram ? <PlanTimeline program={todayProgram} colors={colors} /> : <EmptyPlan colors={colors} />}
          </View>
        </View>
        <HomeWidgetStack homeWidgets={homeWidgets} now={now} scheduled={scheduled} completed={completed} colors={colors} foodCalories={foodCalories} dailyCalorieGoal={dailyCalorieGoal} foodMacros={foodMacros} dailyMacroGoals={dailyMacroGoals} workoutTrend={workoutTrend} weekVolume={weekVolume} dailyQuote={dailyQuote} />
      </ScrollView>
    </ScreenContainer>
  );
}

function HomeWidgetStack({ homeWidgets, now, scheduled, completed, colors, foodCalories, dailyCalorieGoal, foodMacros, dailyMacroGoals, workoutTrend, weekVolume, dailyQuote }: any) {
  const [draggingId, setDraggingId] = useState<HomeWidgetId | null>(null);
  const [dragTarget, setDragTarget] = useState<number | null>(null);
  const [previewOrder, setPreviewOrder] = useState<HomeWidgetId[] | null>(null);
  const visibleIds = homeWidgets.order.filter((id: HomeWidgetId) => homeWidgets.visibility[id]);
  const displayedIds = previewOrder ?? visibleIds;

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

  const animateWidgetLayout = () => LayoutAnimation.configureNext({ duration: 210, update: { type: LayoutAnimation.Types.easeInEaseOut }, create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity }, delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity } });

  const previewWidgetMove = (id: HomeWidgetId, target: number) => {
    setDragTarget(target);
    setPreviewOrder((current) => {
      const order = current ?? visibleIds;
      const source = order.indexOf(id);
      if (source < 0 || source === target) return order;
      animateWidgetLayout();
      const next = [...order];
      next.splice(source, 1);
      next.splice(target, 0, id);
      return next;
    });
  };

  const finishWidgetDrag = (id: HomeWidgetId, target: number) => {
    const destinationId = visibleIds[target];
    const destination = destinationId ? homeWidgets.order.indexOf(destinationId) : homeWidgets.order.length - 1;
    animateWidgetLayout();
    homeWidgets.moveWidget(id, destination);
    setDraggingId(null);
    setDragTarget(null);
    setPreviewOrder(null);
  };

  const triggerWidgetGrabFeedback = () => {
    if (Platform.OS === "android") {
      void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Drag_Start).catch(() => undefined);
      return;
    }
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const renderWidget = (id: HomeWidgetId) => {
    const compact = homeWidgets.compact[id];
    if (id === "quote") return <View key={id} style={[styles.quoteCard, compact && compactStyles.quoteCard, { borderColor: colors.border, backgroundColor: colors.surface }]}><View style={[styles.quoteAccent, { backgroundColor: colors.primary }]} /><Text style={[styles.quoteKicker, { color: colors.primary }]}>ЦИТАТА ДНЯ</Text><Text numberOfLines={compact ? 2 : undefined} style={[styles.quoteText, compact && compactStyles.quoteText, { color: colors.foreground }]}>«{dailyQuote.quote}»</Text><Text style={[styles.quoteAuthor, { color: colors.muted }]}>{dailyQuote.athlete.toUpperCase()} · {dailyQuote.discipline.toUpperCase()}</Text></View>;
    if (id === "week") return <WeekStrip key={id} now={now} scheduled={scheduled} completed={completed} colors={colors} compact={compact} />;
    if (id === "nutrition") return <NutritionProgress key={id} calories={foodCalories} calorieGoal={dailyCalorieGoal} macros={foodMacros} macroGoals={dailyMacroGoals} colors={colors} compact={compact} />;
    if (id === "trainingTrend") return <View key={id} style={[styles.analytics, compact && compactStyles.analytics, { borderTopColor: colors.border, borderBottomColor: colors.border }]}><View style={[styles.analyticsLabel, { borderRightColor: colors.border }]}><Text style={[styles.analyticsTitle, { color: colors.foreground }]}>ОБЪЁМ{`\n`}КГ</Text><View style={[styles.graphMark, { backgroundColor: colors.foreground }]}><IconSymbol name="chart.bar.fill" size={compact ? 24 : 34} color={colors.surface} /></View></View><View style={styles.chartArea}><View style={styles.chartTopline}><Text style={[styles.chartCaption, { color: colors.foreground }]}>ЗАВЕРШЁННЫЕ ТРЕНИРОВКИ</Text><Pressable onPress={() => router.push("/(tabs)/stats")} style={({ pressed }) => [styles.chartLink, { borderColor: colors.primary, opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.chartLinkText, { color: colors.primary }]}>СТАТИСТИКА</Text></Pressable></View><CompletedWorkoutChart points={workoutTrend} colors={colors} compact={compact} /></View></View>;
    if (id === "metrics") return <View key={id} style={[styles.dataRow, compact && compactStyles.dataRow]}><Metric compact={compact} label="ТРЕНИРОВОК" value={String(completed.length)} suffix="" colors={colors} /><Metric compact={compact} label="ОБЪЁМ" value={`${(weekVolume / 1000).toFixed(1)}`} suffix=" т" colors={colors} /><Metric compact={compact} label="ВРЕМЯ" value={formatDuration(completed.reduce((sum: number, item: any) => sum + item.durationMinutes, 0)).replace(" ч 0 мин", " ч")} suffix="" colors={colors} /></View>;
    return <View key={id} style={[styles.footerActions, compact && compactStyles.footerActions]}><Pressable onPress={() => router.push("/(tabs)/calendar")} style={({ pressed }) => [styles.outlineAction, compact && compactStyles.outlineAction, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.actionText, { color: colors.foreground }]}>КАЛЕНДАРЬ</Text><IconSymbol name="calendar" size={compact ? 16 : 19} color={colors.foreground} /></Pressable><Pressable onPress={() => router.push("/(tabs)/exercises")} style={({ pressed }) => [styles.outlineAction, compact && compactStyles.outlineAction, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.actionText, { color: colors.foreground }]}>УПРАЖНЕНИЯ</Text><IconSymbol name="dumbbell.fill" size={compact ? 16 : 19} color={colors.foreground} /></Pressable></View>;
  };
  return <>{homeWidgets.ready && !homeWidgets.dragHintSeen && <WidgetDragHint colors={colors} onDismiss={homeWidgets.dismissWidgetDragHint} />}{displayedIds.map((id: HomeWidgetId, index: number) => <DraggableHomeWidget key={id} id={id} index={index} total={visibleIds.length} dragging={draggingId === id} colors={colors} onDragStart={() => { triggerWidgetGrabFeedback(); setDraggingId(id); setDragTarget(index); setPreviewOrder(visibleIds); }} onDragMove={(next) => previewWidgetMove(id, next)} onDragEnd={(target) => finishWidgetDrag(id, target)}>{renderWidget(id)}</DraggableHomeWidget>)}</>;
}

function WidgetDragHint({ colors, onDismiss }: { colors: any; onDismiss: () => void }) {
  return <Modal transparent animationType="fade" visible onRequestClose={onDismiss}><View style={styles.hintBackdrop}><View style={[styles.hintCard, { backgroundColor: colors.background, borderColor: colors.primary }]}><Text style={[styles.hintEyebrow, { color: colors.primary }]}>НАСТРОЙТЕ «СЕГОДНЯ» ПОД СЕБЯ</Text><Text style={[styles.hintTitle, { color: colors.foreground }]}>Перемещайте виджеты</Text><Text style={[styles.hintText, { color: colors.muted }]}>Зажмите маркер ⠿ на карточке и потяните её вверх или вниз. Соседние блоки плавно освободят место, а новый порядок сохранится автоматически.</Text><Pressable onPress={onDismiss} style={({ pressed }) => [styles.hintButton, { backgroundColor: colors.primary, opacity: pressed ? 0.74 : 1 }]}><Text style={styles.hintButtonText}>ПОНЯТНО</Text></Pressable></View></View></Modal>;
}

function DraggableHomeWidget({ id, index, total, dragging, colors, onDragStart, onDragMove, onDragEnd, children }: { id: HomeWidgetId; index: number; total: number; dragging: boolean; colors: any; onDragStart: () => void; onDragMove: (index: number) => void; onDragEnd: (index: number) => void; children: React.ReactNode }) {
  const currentTargetRef = useMemo(() => ({ value: index }), [index]);
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(lift, { toValue: dragging ? 1 : 0, duration: dragging ? 160 : 200, useNativeDriver: true }).start(); }, [dragging, lift]);
  const trackedPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => { currentTargetRef.value = index; onDragStart(); },
    onPanResponderMove: (_event, gesture) => { const next = Math.max(0, Math.min(total - 1, index + Math.round(gesture.dy / 96))); currentTargetRef.value = next; onDragMove(next); },
    onPanResponderRelease: () => onDragEnd(currentTargetRef.value),
    onPanResponderTerminate: () => onDragEnd(index),
  }), [currentTargetRef, index, onDragEnd, onDragMove, onDragStart, total]);
  return <Animated.View style={[styles.widgetShell, { zIndex: dragging ? 20 : 1, elevation: dragging ? 8 : 0, opacity: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }), transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }, { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }]}><View pointerEvents="box-none">{children}</View><View accessibilityRole="adjustable" accessibilityLabel="Перетащить виджет" style={[styles.widgetHandle, { backgroundColor: dragging ? colors.primary : colors.background, borderColor: dragging ? colors.primary : colors.border }]} {...trackedPanResponder.panHandlers}><Text style={[styles.widgetHandleText, { color: dragging ? "#FFFFFF" : colors.muted }]}>⠿</Text></View></Animated.View>;
}

function EmptyPlan({ colors }: { colors: any }) { return <View style={styles.emptyPlan}><Text style={[styles.emptyPlanText, { color: colors.muted }]}>На сегодня программа не запланирована.</Text><Pressable onPress={() => router.push("/(tabs)/calendar")} style={({ pressed }) => [styles.planButton, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]}><Text style={styles.planButtonText}>ЗАПЛАНИРОВАТЬ</Text></Pressable></View>; }

function PlanTimeline({ program, colors }: { program: NonNullable<ReturnType<typeof getProgram>>; colors: any }) {
  const plan = program.exercises.slice(0, 4);
  return <View style={styles.timeline}>{plan.map((exercise, index) => { const detail = `${exercise.sets} × ${exercise.reps}`; return <View key={`${program.id}-${exercise.exerciseId}`} style={[styles.planItem, index < plan.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}><View style={styles.planIndex}><Text style={[styles.indexText, { color: colors.primary }]}>{String(index + 1).padStart(2, "0")}</Text><View style={[styles.timelineDot, { backgroundColor: colors.primary }]} /></View><View style={styles.planBody}><Text numberOfLines={2} style={[styles.exerciseName, { color: colors.foreground }]}>{getExercise(exercise.exerciseId)?.name ?? "Упражнение"}</Text><Text style={[styles.exerciseDetail, { color: colors.muted }]}>{detail} · отдых {exercise.rest} с</Text></View></View>; })}{program.exercises.length > plan.length && <Text style={[styles.morePlan, { color: colors.muted }]}>+ ещё {program.exercises.length - plan.length} в программе</Text>}</View>;
}

function WeekStrip({ now, scheduled, completed, colors, compact }: { now: Date; scheduled: Record<string, unknown>; completed: Array<{ date: string }>; colors: any; compact: boolean }) {
  const monday = new Date(now); const day = (monday.getDay() + 6) % 7; monday.setDate(monday.getDate() - day);
  const cells = Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); const key = dateKey(date); return { date, key, done: completed.some((item) => item.date === key), planned: Boolean(scheduled[key]), today: key === dateKey(now) }; });
  return <View style={[styles.weekStrip, { borderBottomColor: colors.border }]}>{cells.map((cell) => <Pressable key={cell.key} onPress={() => router.push("/(tabs)/calendar")} style={({ pressed }) => [styles.weekCell, compact && compactStyles.weekCell, { borderRightColor: colors.border, backgroundColor: cell.today ? REFERENCE_BLUE : "transparent", opacity: pressed ? 0.64 : 1 }]}><Text style={[styles.weekDay, { color: cell.today ? colors.surface : colors.foreground }]}>{cell.date.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "").toUpperCase()}</Text><Text style={[styles.weekDate, compact && compactStyles.weekDate, { color: cell.today ? colors.surface : colors.foreground }]}>{cell.date.getDate()}</Text>{!compact && <View style={[styles.weekStatus, { borderColor: cell.today ? colors.surface : cell.done ? colors.success : cell.planned ? colors.foreground : colors.muted, backgroundColor: cell.done ? colors.success : cell.planned ? colors.foreground : "transparent" }]} />}</Pressable>)}</View>;
}

function Metric({ label, value, suffix, colors, compact }: { label: string; value: string; suffix: string; colors: any; compact: boolean }) { return <Pressable onPress={() => router.push("/(tabs)/stats")} style={({ pressed }) => [styles.metric, compact && compactStyles.metric, { borderColor: colors.border, opacity: pressed ? 0.64 : 1 }]}><Text numberOfLines={1} style={[styles.metricValue, compact && compactStyles.metricValue, { color: colors.foreground }]}>{value}<Text style={styles.metricSuffix}>{suffix}</Text></Text><Text style={[styles.metricLabel, compact && compactStyles.metricLabel, { color: colors.muted }]}>{label}</Text></Pressable>; }

function NutritionProgress({ calories, calorieGoal, macros, macroGoals, colors, compact }: { calories: number; calorieGoal: number; macros: { protein: number; fat: number; carbs: number }; macroGoals: { protein: number; fat: number; carbs: number }; colors: any; compact: boolean }) {
  const items = [{ label: "Б", value: macros.protein, goal: macroGoals.protein, color: colors.primary }, { label: "Ж", value: macros.fat, goal: macroGoals.fat, color: "#2F5FC4" }, { label: "У", value: macros.carbs, goal: macroGoals.carbs, color: "#E6A52D" }]; const caloriePercent = Math.min(100, Math.round((calories / Math.max(1, calorieGoal)) * 100));
  return <Pressable onPress={() => router.push("/(tabs)/nutrition")} style={({ pressed }) => [styles.nutritionProgress, compact && compactStyles.nutritionProgress, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.68 : 1 }]}><View style={styles.nutritionHead}><View><Text style={[styles.nutritionKicker, { color: colors.primary }]}>ПИТАНИЕ · ЦЕЛЬ ДНЯ</Text><Text style={[styles.nutritionCalories, compact && compactStyles.nutritionCalories, { color: colors.foreground }]}>{calories} <Text style={styles.nutritionCaloriesSuffix}>/ {calorieGoal} ККАЛ</Text></Text></View><Text style={[styles.nutritionPercent, { color: calories > calorieGoal ? colors.error : colors.primary }]}>{caloriePercent}%</Text></View><View style={[styles.nutritionTrack, { backgroundColor: colors.border }]}><View style={[styles.nutritionFill, { width: `${caloriePercent}%`, backgroundColor: calories > calorieGoal ? colors.error : colors.primary }]} /></View>{!compact && <View style={styles.macroProgressRow}>{items.map((item) => { const percent = Math.min(100, Math.round((item.value / Math.max(1, item.goal)) * 100)); return <View key={item.label} style={styles.macroProgress}><View style={styles.macroProgressHead}><Text style={[styles.macroProgressLabel, { color: colors.muted }]}>{item.label}</Text><Text style={[styles.macroProgressValue, { color: colors.foreground }]}>{item.value}/{item.goal}г</Text></View><View style={[styles.macroProgressTrack, { backgroundColor: colors.border }]}><View style={[styles.macroProgressFill, { width: `${percent}%`, backgroundColor: item.color }]} /></View></View>; })}</View>}</Pressable>;
}

function CompletedWorkoutChart({ points, colors, compact }: { points: HomeWorkoutTrendPoint[]; colors: any; compact: boolean }) {
  const width = 308; const height = compact ? 92 : 132; const baseline = compact ? 70 : 104; const paddingX = 12; const maxVolume = Math.max(1, ...points.map((point) => point.volume)); const gap = 12; const barWidth = points.length ? Math.max(18, Math.min(32, (width - paddingX * 2 - gap * Math.max(0, points.length - 1)) / points.length)) : 0;
  return points.length ? <><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Line x1={paddingX} x2={width - paddingX} y1={baseline} y2={baseline} stroke={colors.border} strokeWidth="1" />{points.map((point, index) => { const x = paddingX + index * (barWidth + gap); const barHeight = Math.max(8, (point.volume / maxVolume) * 78); return <Rect key={point.date} x={x} y={baseline - barHeight} width={barWidth} height={barHeight} fill={index === points.length - 1 ? REFERENCE_BLUE : colors.foreground} onPress={() => router.push({ pathname: "/workout-history/[id]", params: { id: point.workoutId } })} />; })}</Svg><View style={styles.chartAxis}>{points.map((point) => <Text key={point.date} style={[styles.axisLabel, { color: colors.muted }]}>{point.label}</Text>)}</View></> : <View style={styles.chartEmpty}><Text style={[styles.chartEmptyText, { color: colors.muted }]}>Завершите тренировку, чтобы увидеть динамику объёма.</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  banner: { height: 8 },
  heroGrid: { flexDirection: "row", minHeight: 432 },
  heroLeft: { width: 38, borderRightWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "flex-end", paddingBottom: 24 },
  sideMotto: { position: "absolute", top: 166, left: -111, fontSize: 10, fontWeight: "900", letterSpacing: 1.6, writingDirection: "ltr", transform: [{ rotate: "-90deg" }], width: 260, textAlign: "center" },
  mottoRule: { width: 1, height: 42 },
  dayPanel: { width: "44%", borderRightWidth: StyleSheet.hairlineWidth, padding: 14, overflow: "hidden", position: "relative" },
  dayNumber: { fontSize: 118, lineHeight: 104, letterSpacing: -8, fontWeight: "900" },
  dayMeta: { marginTop: 12, marginLeft: 2 },
  redKicker: { fontSize: 12, letterSpacing: 1.5, fontWeight: "900" },
  dayName: { fontSize: 18, fontWeight: "900", marginTop: 7, textTransform: "uppercase" },
  dateText: { fontSize: 12, fontWeight: "800", marginTop: 4 },
  redRule: { width: 38, height: 3, marginTop: 16 },
  wordmark: { alignSelf: "stretch", flexShrink: 1, fontSize: 34, lineHeight: 39, letterSpacing: -2.5, fontWeight: "900", marginTop: 38, includeFontPadding: false },
  tagline: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.4, marginTop: 7 },
  brandCredit: { marginTop: 8, gap: 2 },
  creditName: { fontSize: 9, fontWeight: "900", letterSpacing: 0.15 },
  creditRights: { fontSize: 7.5, fontWeight: "700", letterSpacing: 0.1 },
  blueBlock: { position: "absolute", height: 130, width: 300, bottom: -98, right: -88, transform: [{ rotate: "-29deg" }] },
  planPanel: { flex: 1, paddingHorizontal: 12, paddingTop: 18 },
  planHeading: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  planStar: { fontSize: 22, fontWeight: "900" },
  planTitle: { fontSize: 16, letterSpacing: 1.1, fontWeight: "900" },
  timeline: { paddingTop: 7 },
  planItem: { minHeight: 75, flexDirection: "row" },
  planIndex: { width: 38, paddingTop: 10, alignItems: "flex-start", position: "relative" },
  indexText: { fontSize: 20, fontWeight: "900" },
  timelineDot: { width: 8, height: 8, position: "absolute", right: 0, top: 18 },
  planBody: { flex: 1, paddingVertical: 11, paddingLeft: 11 },
  exerciseName: { fontSize: 13, lineHeight: 16, fontWeight: "900", textTransform: "uppercase" },
  exerciseDetail: { fontSize: 10, lineHeight: 14, marginTop: 5, fontWeight: "700" },
  morePlan: { fontSize: 10, fontWeight: "800", marginTop: 6, textAlign: "right" },
  emptyPlan: { paddingTop: 28, gap: 13 },
  emptyPlanText: { fontSize: 12, lineHeight: 17, fontWeight: "700" },
  planButton: { minHeight: 37, justifyContent: "center", alignItems: "center", paddingHorizontal: 8 },
  planButtonText: { color: "#FFFDF8", fontSize: 10, letterSpacing: 0.8, fontWeight: "900" },
  quoteCard: { margin: 12, marginBottom: 0, borderWidth: 1, padding: 15, paddingLeft: 18, gap: 7, overflow: "hidden", position: "relative" },
  quoteAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  quoteKicker: { fontSize: 9, letterSpacing: 1.1, fontWeight: "900" },
  quoteText: { fontSize: 15, lineHeight: 22, fontWeight: "800" },
  quoteAuthor: { fontSize: 8, letterSpacing: 0.7, fontWeight: "900", marginTop: 2 },
  weekStrip: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  weekCell: { flex: 1, minHeight: 86, paddingTop: 10, alignItems: "center", borderRightWidth: StyleSheet.hairlineWidth },
  weekDay: { fontSize: 9, fontWeight: "900" },
  weekDate: { fontSize: 18, fontWeight: "900", marginTop: 4 },
  weekStatus: { width: 7, height: 7, borderWidth: 1, borderRadius: 5, marginTop: 7 },
  nutritionProgress: { margin: 12, borderWidth: 1, borderLeftWidth: 5, padding: 13, gap: 10 },
  nutritionHead: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  nutritionKicker: { fontSize: 9, fontWeight: "900", letterSpacing: .8 },
  nutritionCalories: { fontSize: 26, fontWeight: "900", marginTop: 4, letterSpacing: -1 },
  nutritionCaloriesSuffix: { fontSize: 10, letterSpacing: 0 },
  nutritionPercent: { fontSize: 18, fontWeight: "900" },
  nutritionTrack: { height: 8, overflow: "hidden" },
  nutritionFill: { height: "100%" },
  macroProgressRow: { flexDirection: "row", gap: 8 },
  macroProgress: { flex: 1, gap: 4 },
  macroProgressHead: { flexDirection: "row", justifyContent: "space-between" },
  macroProgressLabel: { fontSize: 9, fontWeight: "900" },
  macroProgressValue: { fontSize: 9, fontWeight: "900" },
  macroProgressTrack: { height: 4, overflow: "hidden" },
  macroProgressFill: { height: "100%" },
  analytics: { minHeight: 216, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row" },
  analyticsLabel: { width: 92, borderRightWidth: StyleSheet.hairlineWidth, justifyContent: "space-between" },
  analyticsTitle: { padding: 14, fontSize: 16, lineHeight: 20, letterSpacing: -0.6, fontWeight: "900" },
  graphMark: { height: 78, alignItems: "center", justifyContent: "center" },
  chartArea: { flex: 1, padding: 12 },
  chartTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartCaption: { fontSize: 9, fontWeight: "900", letterSpacing: 0.4, flex: 1 },
  chartLink: { paddingBottom: 3, borderBottomWidth: 2 },
  chartLinkText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.2 },
  chartAxis: { flexDirection: "row", justifyContent: "space-between", gap: 3, paddingHorizontal: 4 },
  axisLabel: { fontSize: 8, flex: 1, textAlign: "center", fontWeight: "700" },
  chartEmpty: { minHeight: 132, justifyContent: "center", alignItems: "center" },
  chartEmptyText: { fontSize: 11, lineHeight: 16, textAlign: "center", fontWeight: "700", paddingHorizontal: 16 },
  dataRow: { flexDirection: "row", marginHorizontal: 12, marginTop: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "#272624" },
  metric: { flex: 1, minHeight: 75, padding: 11, borderRightWidth: StyleSheet.hairlineWidth },
  metricValue: { fontSize: 19, fontWeight: "900", letterSpacing: -0.8 },
  metricSuffix: { fontSize: 10 },
  metricLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.4, marginTop: 9 },
  footerActions: { flexDirection: "row", paddingHorizontal: 12, marginTop: 12, gap: 10 },
  outlineAction: { flex: 1, height: 48, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  actionText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  widgetShell: { position: "relative" },
  widgetHandle: { position: "absolute", right: 5, top: 5, width: 29, height: 29, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", alignItems: "center", zIndex: 12 },
  widgetHandleText: { fontSize: 19, lineHeight: 21, fontWeight: "900" },
  hintBackdrop: { flex: 1, backgroundColor: "#111016B8", alignItems: "center", justifyContent: "center", padding: 24 },
  hintCard: { width: "100%", maxWidth: 360, borderWidth: 2, padding: 22, gap: 12 },
  hintEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  hintTitle: { fontSize: 25, lineHeight: 29, fontWeight: "900" },
  hintText: { fontSize: 13, lineHeight: 20, fontWeight: "700" },
  hintButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 4 },
  hintButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 0.7 },
});

const compactStyles = StyleSheet.create({
  quoteCard: { paddingVertical: 10, gap: 4 },
  quoteText: { fontSize: 12, lineHeight: 17 },
  weekCell: { minHeight: 54, paddingTop: 7 },
  weekDate: { fontSize: 14, marginTop: 2 },
  nutritionProgress: { paddingVertical: 9, gap: 7 },
  nutritionCalories: { fontSize: 20, marginTop: 1 },
  analytics: { minHeight: 150 },
  dataRow: { marginTop: 9 },
  metric: { minHeight: 56, paddingVertical: 8 },
  metricValue: { fontSize: 16 },
  metricLabel: { marginTop: 5, fontSize: 7 },
  footerActions: { marginTop: 8 },
  outlineAction: { height: 40, paddingHorizontal: 9 },
});
