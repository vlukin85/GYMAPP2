import { useEffect, useMemo, useRef, useState } from "react";
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
  UIManager,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import Svg, { Line, Rect } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { entryCalories, sumEntryMacros } from "@/lib/nutrition-data";
import { useNutritionStore } from "@/lib/nutrition-store";
import { type HomeWidgetId, useHomeWidgets } from "@/lib/home-widgets";
import { useWorkoutStore } from "@/lib/workout-store";
import {
  getCurrentTrainingPeriodStats,
  getExercise,
  getProgram,
} from "@/lib/workout-data";
import { updateWeeklyStatsWidget } from "@/modules/ironrise-rest-timer";
import {
  buildHomeWorkoutTrend,
  type HomeWorkoutTrendPoint,
} from "@/lib/home-workout-trend";
import {
  athleteQuoteAuthor,
  athleteQuoteText,
  getDailyAthleteQuote,
} from "@/lib/daily-athlete-quote";
import { useLanguage, type DictKey, type TFunction } from "@/lib/i18n";
import { exerciseName } from "@/lib/i18n/exercise-labels";
import { useBodyStore } from "@/lib/body-store";
import { calculateDailyEnergy } from "@/lib/workout-energy";
import {
  buildHomeEnergyTrend,
  type HomeEnergyTrendPoint,
} from "@/lib/home-energy-trend";
import {
  minTouchTarget,
  pressedOpacity,
  radius,
  shadows,
  spacing,
  type as typeTokens,
} from "@/lib/design-tokens";

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const titleCase = (value: string) =>
  value ? value[0].toUpperCase() + value.slice(1) : value;
// Приветствие — это ключ словаря, а выбор по часу остаётся в коде.
const greetingKeyByHour = (hour: number): DictKey =>
  hour < 5
    ? "tabs.hero.greetingNight"
    : hour < 12
      ? "tabs.hero.greetingMorning"
      : hour < 18
        ? "tabs.hero.greetingDay"
        : "tabs.hero.greetingEvening";
// Длительность в часах и минутах: единицы измерения берутся из словаря.
const formatHomeDuration = (minutes: number, t: TFunction) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest
    ? t("tabs.metrics.duration", { hours, minutes: rest })
    : t("tabs.metrics.durationHours", { hours });
};

export default function HomeScreen() {
  const colors = useColors();
  const { lang, t } = useLanguage();
  // Даты форматируются по выбранному языку, а не жёстко по ru-RU.
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const { programs, completed, scheduled, startWorkout, bodyWeightKg } =
    useWorkoutStore();
  const { profile, heightCm, ageYears, measurements, activityLevel } =
    useBodyStore();
  const {
    entries: nutritionEntries,
    dailyCalorieGoal,
    dailyMacroGoals,
  } = useNutritionStore();
  const homeWidgets = useHomeWidgets();
  const now = new Date();
  const today = dateKey(now);
  const nutritionToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todaySchedule = scheduled[today];
  const todayProgram = todaySchedule
    ? (getProgram(todaySchedule.programId) ??
      programs.find((program) => program.id === todaySchedule.programId))
    : undefined;
  const workoutTrend = buildHomeWorkoutTrend(completed, 7, lang);
  const weekVolume = completed.reduce((sum, item) => sum + item.totalVolume, 0);
  const dayLabel = titleCase(
    now.toLocaleDateString(locale, { weekday: "long" }),
  );
  const monthLabel = now.toLocaleDateString(locale, { month: "long" });
  const greeting = t(greetingKeyByHour(now.getHours()));
  const todayTotalSets =
    todayProgram?.exercises.reduce((sum, item) => sum + item.sets, 0) ?? 0;
  const todayEstimateMinutes = todayProgram
    ? Math.round(
        todayProgram.exercises.reduce(
          (sum, item) => sum + item.sets * (item.rest + 45),
          0,
        ) / 60,
      )
    : 0;
  const todayFoodEntries = nutritionEntries.filter(
    (entry) => entry.date === nutritionToday,
  );
  const foodCalories = todayFoodEntries.reduce(
    (sum, entry) => sum + entryCalories(entry),
    0,
  );
  const foodMacros = sumEntryMacros(todayFoodEntries);
  const dailyQuote = getDailyAthleteQuote(now);
  const latestRecordedWeight = measurements.find(
    (measurement) =>
      typeof measurement.weightKg === "number" && measurement.weightKg > 0,
  )?.weightKg;
  const currentWeightKg = latestRecordedWeight ?? bodyWeightKg;
  const workoutCaloriesToday = completed
    .filter((workout) => workout.date === today)
    .reduce(
      (sum, workout) => sum + Math.max(0, workout.caloriesBurned ?? 0),
      0,
    );
  const dailyEnergy = calculateDailyEnergy({
    profile,
    weightKg: currentWeightKg,
    heightCm,
    ageYears,
    activityLevel,
    workoutCalories: workoutCaloriesToday,
  });
  const weeklyEnergyTrend = buildHomeEnergyTrend(
    now,
    completed,
    {
      profile,
      weightKg: currentWeightKg,
      heightCm,
      ageYears,
      activityLevel,
    },
    lang,
  );
  const weeklyTrainingStats = getCurrentTrainingPeriodStats(completed, now).week;

  useEffect(() => {
    if (Platform.OS !== "android") return;
    updateWeeklyStatsWidget({
      workoutCount: weeklyTrainingStats.workoutCount,
      activeDays: weeklyTrainingStats.activeDays,
      durationMinutes: weeklyTrainingStats.durationMinutes,
      volume: weeklyTrainingStats.totalVolume,
      openUrl: Linking.createURL("/"),
    });
  }, [
    completed,
    today,
    weeklyTrainingStats.workoutCount,
    weeklyTrainingStats.activeDays,
    weeklyTrainingStats.durationMinutes,
    weeklyTrainingStats.totalVolume,
  ]);

  return (
    <ScreenContainer className="px-0" containerClassName="bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Text style={[styles.heroEyebrow, { color: colors.primary }]}>
            {t("tabs.hero.eyebrow")}
          </Text>
          <Text style={[styles.heroGreeting, { color: colors.foreground }]}>
            {greeting}
          </Text>
          <Text style={[styles.heroDate, { color: colors.muted }]}>
            {t("tabs.hero.date", {
              weekday: dayLabel.toLowerCase(),
              day: now.getDate(),
              month: monthLabel,
            })}
          </Text>
          <View style={styles.brandCredit}>
            <Text style={[styles.creditName, { color: colors.foreground }]}>
              {t("tabs.hero.brand")}
            </Text>
            <Text style={[styles.creditRights, { color: colors.muted }]}>
              {t("tabs.hero.rights")}
            </Text>
          </View>
        </View>
        {todayProgram ? (
          <TodayWorkoutCard
            program={todayProgram}
            colors={colors}
            totalSets={todayTotalSets}
            estimateMinutes={todayEstimateMinutes}
            onStart={() => {
              startWorkout(todayProgram.id);
              router.push({
                pathname: "/workout",
                params: { programId: todayProgram.id },
              });
            }}
          />
        ) : (
          <View
            style={[
              styles.todCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.card,
            ]}
          >
            <Text style={[styles.todKicker, { color: colors.primary }]}>
              {t("tabs.today.kicker")}
            </Text>
            <EmptyPlan colors={colors} />
          </View>
        )}
        <HomeWidgetStack
          homeWidgets={homeWidgets}
          now={now}
          scheduled={scheduled}
          completed={completed}
          colors={colors}
          foodCalories={foodCalories}
          dailyCalorieGoal={dailyCalorieGoal}
          foodMacros={foodMacros}
          dailyMacroGoals={dailyMacroGoals}
          workoutTrend={workoutTrend}
          weekVolume={weekVolume}
          dailyQuote={dailyQuote}
          dailyEnergy={dailyEnergy}
          weeklyEnergyTrend={weeklyEnergyTrend}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function HomeWidgetStack({
  homeWidgets,
  now,
  scheduled,
  completed,
  colors,
  foodCalories,
  dailyCalorieGoal,
  foodMacros,
  dailyMacroGoals,
  workoutTrend,
  weekVolume,
  dailyQuote,
  dailyEnergy,
  weeklyEnergyTrend,
}: any) {
  const { lang, t } = useLanguage();
  const [draggingId, setDraggingId] = useState<HomeWidgetId | null>(null);
  const [dragTarget, setDragTarget] = useState<number | null>(null);
  const [previewOrder, setPreviewOrder] = useState<HomeWidgetId[] | null>(null);
  const visibleIds = homeWidgets.order.filter(
    (id: HomeWidgetId) => homeWidgets.visibility[id],
  );
  const displayedIds = previewOrder ?? visibleIds;

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    )
      UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

  const animateWidgetLayout = () =>
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

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
    const destination = destinationId
      ? homeWidgets.order.indexOf(destinationId)
      : homeWidgets.order.length - 1;
    animateWidgetLayout();
    homeWidgets.moveWidget(id, destination);
    setDraggingId(null);
    setDragTarget(null);
    setPreviewOrder(null);
  };

  const triggerWidgetGrabFeedback = () => {
    if (!homeWidgets.dragHapticsEnabled) return;
    if (Platform.OS === "android") {
      void Haptics.performAndroidHapticsAsync(
        Haptics.AndroidHaptics.Drag_Start,
      ).catch(() => undefined);
      return;
    }
    if (Platform.OS !== "web")
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
  };
  const renderWidget = (id: HomeWidgetId) => {
    const compact = homeWidgets.compact[id];
    if (id === "quote")
      return (
        <View
          key={id}
          style={[
            styles.quoteCard,
            compact && compactStyles.quoteCard,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <View
            style={[styles.quoteAccent, { backgroundColor: colors.primary }]}
          />
          <Text style={[styles.quoteKicker, { color: colors.primary }]}>
            {t("tabs.quote.kicker")}
          </Text>
          <Text
            numberOfLines={compact ? 2 : undefined}
            style={[
              styles.quoteText,
              compact && compactStyles.quoteText,
              { color: colors.foreground },
            ]}
          >
            {t("tabs.quote.text", { quote: athleteQuoteText(dailyQuote, lang) })}
          </Text>
          <Text style={[styles.quoteAuthor, { color: colors.muted }]}>
            {t("tabs.quote.author", {
              athlete: athleteQuoteAuthor(dailyQuote, lang).athlete.toUpperCase(),
              discipline: athleteQuoteAuthor(dailyQuote, lang).discipline.toUpperCase(),
            })}
          </Text>
        </View>
      );
    if (id === "week")
      return (
        <WeekStrip
          key={id}
          now={now}
          scheduled={scheduled}
          completed={completed}
          colors={colors}
          compact={compact}
        />
      );
    if (id === "nutrition")
      return (
        <NutritionProgress
          key={id}
          calories={foodCalories}
          calorieGoal={dailyCalorieGoal}
          macros={foodMacros}
          macroGoals={dailyMacroGoals}
          colors={colors}
          compact={compact}
        />
      );
    if (id === "trainingTrend")
      return (
        <View
          key={id}
          style={[
            styles.analytics,
            compact && compactStyles.analytics,
            { backgroundColor: colors.surface, borderColor: colors.border },
            shadows.card,
          ]}
        >
          <View style={styles.chartTopline}>
            <Text style={[styles.analyticsTitle, { color: colors.foreground }]}>
              {t("tabs.trend.title")}
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/stats")}
              style={({ pressed }) => [
                styles.chartLink,
                { borderColor: colors.primary, opacity: pressed ? pressedOpacity : 1 },
              ]}
            >
              <Text style={[styles.chartLinkText, { color: colors.primary }]}>
                {t("tabs.trend.statsLink")}
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.chartCaption, { color: colors.muted }]}>
            {t("tabs.trend.caption")}
          </Text>
          <CompletedWorkoutChart
            points={workoutTrend}
            colors={colors}
            compact={compact}
          />
        </View>
      );
    if (id === "metrics")
      return (
        <View key={id} style={styles.metricsStack}>
          <DailyEnergyCard
            estimate={dailyEnergy}
            colors={colors}
            compact={compact}
          />
          <WeeklyEnergyTrend
            points={weeklyEnergyTrend}
            colors={colors}
            compact={compact}
          />
          <View style={[styles.dataRow, compact && compactStyles.dataRow]}>
            <Metric
              compact={compact}
              label={t("tabs.metrics.workouts")}
              value={String(completed.length)}
              suffix=""
              colors={colors}
            />
            <Metric
              compact={compact}
              label={t("tabs.metrics.volume")}
              value={`${(weekVolume / 1000).toFixed(1)}`}
              suffix={t("tabs.metrics.volumeSuffix")}
              colors={colors}
            />
            <Metric
              compact={compact}
              label={t("tabs.metrics.time")}
              value={formatHomeDuration(
                completed.reduce(
                  (sum: number, item: any) => sum + item.durationMinutes,
                  0,
                ),
                t,
              )}
              suffix=""
              colors={colors}
            />
          </View>
        </View>
      );
    return (
      <View
        key={id}
        style={[styles.footerActions, compact && compactStyles.footerActions]}
      >
        <Pressable
          onPress={() => router.push("/(tabs)/calendar")}
          style={({ pressed }) => [
            styles.outlineAction,
            compact && compactStyles.outlineAction,
            { borderColor: colors.border, opacity: pressed ? pressedOpacity : 1 },
          ]}
        >
          <Text style={[styles.actionText, { color: colors.foreground }]}>
            {t("tabs.actions.calendar")}
          </Text>
          <IconSymbol
            name="calendar"
            size={compact ? 16 : 19}
            color={colors.foreground}
          />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/exercises")}
          style={({ pressed }) => [
            styles.outlineAction,
            compact && compactStyles.outlineAction,
            { borderColor: colors.border, opacity: pressed ? pressedOpacity : 1 },
          ]}
        >
          <Text style={[styles.actionText, { color: colors.foreground }]}>
            {t("tabs.actions.exercises")}
          </Text>
          <IconSymbol
            name="dumbbell.fill"
            size={compact ? 16 : 19}
            color={colors.foreground}
          />
        </Pressable>
      </View>
    );
  };
  return (
    <>
      {homeWidgets.ready && !homeWidgets.dragHintSeen && (
        <WidgetDragHint
          colors={colors}
          onDismiss={homeWidgets.dismissWidgetDragHint}
        />
      )}
      {displayedIds.map((id: HomeWidgetId, index: number) => (
        <DraggableHomeWidget
          key={id}
          id={id}
          index={index}
          total={visibleIds.length}
          dragging={draggingId === id}
          colors={colors}
          onDragStart={() => {
            triggerWidgetGrabFeedback();
            setDraggingId(id);
            setDragTarget(index);
            setPreviewOrder(visibleIds);
          }}
          onDragMove={(next) => previewWidgetMove(id, next)}
          onDragEnd={(target) => finishWidgetDrag(id, target)}
        >
          {renderWidget(id)}
        </DraggableHomeWidget>
      ))}
    </>
  );
}

function WidgetDragHint({
  colors,
  onDismiss,
}: {
  colors: any;
  onDismiss: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View style={styles.hintBackdrop}>
        <View
          style={[
            styles.hintCard,
            { backgroundColor: colors.background, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.hintEyebrow, { color: colors.primary }]}>
            {t("tabs.dragHint.eyebrow")}
          </Text>
          <Text style={[styles.hintTitle, { color: colors.foreground }]}>
            {t("tabs.dragHint.title")}
          </Text>
          <Text style={[styles.hintText, { color: colors.muted }]}>
            {t("tabs.dragHint.text")}
          </Text>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.hintButton,
              { backgroundColor: colors.primary, opacity: pressed ? pressedOpacity : 1 },
            ]}
          >
            <Text style={[styles.hintButtonText, { color: colors.background }]}>{t("tabs.dragHint.cta")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DraggableHomeWidget({
  id,
  index,
  total,
  dragging,
  colors,
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
}: {
  id: HomeWidgetId;
  index: number;
  total: number;
  dragging: boolean;
  colors: any;
  onDragStart: () => void;
  onDragMove: (index: number) => void;
  onDragEnd: (index: number) => void;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
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
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          currentTargetRef.value = index;
          onDragStart();
        },
        onPanResponderMove: (_event, gesture) => {
          const next = Math.max(
            0,
            Math.min(total - 1, index + Math.round(gesture.dy / 96)),
          );
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
          opacity: lift.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.96],
          }),
          transform: [
            {
              translateY: lift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5],
              }),
            },
            {
              scale: lift.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.015],
              }),
            },
          ],
        },
      ]}
    >
      <View pointerEvents="box-none">{children}</View>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={t("tabs.widget.handleA11y")}
        style={[
          styles.widgetHandle,
          {
            backgroundColor: dragging ? colors.primary : colors.background,
            borderColor: dragging ? colors.primary : colors.border,
          },
        ]}
        {...trackedPanResponder.panHandlers}
      >
        <Text
          style={[
            styles.widgetHandleText,
            { color: dragging ? "#FFFFFF" : colors.muted },
          ]}
        >
          ⠿
        </Text>
      </View>
    </Animated.View>
  );
}

function EmptyPlan({ colors }: { colors: any }) {
  const { t } = useLanguage();
  return (
    <View style={styles.emptyPlan}>
      <Text style={[styles.emptyPlanText, { color: colors.muted }]}>
        {t("tabs.today.emptyText")}
      </Text>
      <Pressable
        onPress={() => router.push("/(tabs)/calendar")}
        style={({ pressed }) => [
          styles.planButton,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            opacity: pressed ? pressedOpacity : 1,
          },
        ]}
      >
        <Text style={[styles.planButtonText, { color: colors.foreground }]}>
          {t("tabs.today.emptyCta")}
        </Text>
      </Pressable>
    </View>
  );
}

function TodayWorkoutCard({
  program,
  colors,
  totalSets,
  estimateMinutes,
  onStart,
}: {
  program: NonNullable<ReturnType<typeof getProgram>>;
  colors: any;
  totalSets: number;
  estimateMinutes: number;
  onStart: () => void;
}) {
  const { lang, t } = useLanguage();
  const chips = program.exercises.slice(0, 5);
  return (
    <View
      style={[
        styles.todCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.todGlow, { backgroundColor: `${colors.primary}17` }]}
      />
      <View style={styles.todTop}>
        <Text style={[styles.todKicker, { color: colors.primary }]}>
          {t("tabs.today.kicker")}
        </Text>
        <View
          style={[
            styles.todBadge,
            {
              borderColor: `${colors.warning}47`,
              backgroundColor: `${colors.warning}1F`,
            },
          ]}
        >
          <Text style={[styles.todBadgeText, { color: colors.warning }]}>
            {t("tabs.today.setsBadge", { count: totalSets })}
          </Text>
        </View>
      </View>
      <Text
        numberOfLines={2}
        style={[styles.todName, { color: colors.foreground }]}
      >
        {lang === "en" ? (program.nameEn ?? program.name) : program.name}
      </Text>
      <View style={styles.todMeta}>
        <Text style={[styles.todMetaText, { color: colors.muted }]}>
          {t("tabs.today.exerciseCount", { count: program.exercises.length })}
        </Text>
        <Text style={[styles.todMetaText, { color: colors.muted }]}>
          {t("tabs.today.estimateMinutes", { minutes: estimateMinutes })}
        </Text>
      </View>
      <View style={styles.todExList}>
        {chips.map((exercise) => (
          <View
            key={`${program.id}-${exercise.exerciseId}`}
            style={[
              styles.todExChip,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.todExChipText, { color: colors.muted }]}
            >
              {exerciseName(getExercise(exercise.exerciseId), lang) || t("tabs.today.exerciseFallback")}
            </Text>
          </View>
        ))}
        {program.exercises.length > chips.length && (
          <View
            style={[
              styles.todExChip,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.todExChipText, { color: colors.muted }]}>
              {t("tabs.today.moreExercises", { count: program.exercises.length - chips.length })}
            </Text>
          </View>
        )}
      </View>
      <Pressable
        onPress={onStart}
        style={({ pressed }) => [
          styles.todCta,
          { backgroundColor: colors.primary, opacity: pressed ? pressedOpacity : 1 },
          shadows.raised,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("tabs.today.startA11y")}
      >
        <Text style={[styles.todCtaText, { color: colors.background }]}>
          {t("tabs.today.startCta")}
        </Text>
      </Pressable>
    </View>
  );
}

function WeekStrip({
  now,
  scheduled,
  completed,
  colors,
  compact,
}: {
  now: Date;
  scheduled: Record<string, unknown>;
  completed: Array<{ date: string; totalVolume?: number; durationMinutes?: number }>;
  colors: any;
  compact: boolean;
}) {
  const { lang, t } = useLanguage();
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const monday = new Date(now);
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  const cells = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = dateKey(date);
    const dayWorkouts = completed.filter((item) => item.date === key);
    const volume = dayWorkouts.reduce(
      (sum, item) => sum + Math.max(0, item.totalVolume ?? 0),
      0,
    );
    return {
      date,
      key,
      done: dayWorkouts.length > 0,
      volume,
      planned: Boolean(scheduled[key]),
      today: key === dateKey(now),
    };
  });
  const rangeLabel = `${monday.getDate()}–${new Date(monday.getTime() + 6 * 86_400_000).getDate()} ${monday.toLocaleDateString(locale, { month: "short" }).replace(".", "")}`;
  const weekWorkouts = cells.filter((cell) => cell.done).length;
  const weekVolume = cells.reduce((sum, cell) => sum + cell.volume, 0);
  const weekMinutes = completed
    .filter((item) => cells.some((cell) => cell.key === item.date))
    .reduce((sum, item) => sum + Math.max(0, item.durationMinutes ?? 0), 0);
  const maxVolume = Math.max(1, ...cells.map((cell) => cell.volume));
  const stats = [
    { value: String(weekWorkouts), label: t("tabs.week.workouts"), tone: colors.primary },
    {
      value: t("tabs.week.volumeValue", { value: (weekVolume / 1000).toFixed(1) }),
      label: t("tabs.week.volume"),
      tone: colors.warning,
    },
    {
      value: String(weekMinutes),
      label: t("tabs.week.minutes"),
      tone: colors.foreground,
    },
  ];
  return (
    <View
      style={[
        styles.weekCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.weekHead}>
        <Text style={[styles.weekKicker, { color: colors.primary }]}>
          {t("tabs.week.title")}
        </Text>
        <Text style={[styles.weekRange, { color: colors.muted }]}>
          {rangeLabel}
        </Text>
      </View>
      {!compact && (
        <View style={styles.weekStats}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.weekStat,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.weekStatValue,
                  { color: stat.tone, fontVariant: ["tabular-nums"] },
                ]}
              >
                {stat.value}
              </Text>
              <Text style={[styles.weekStatLabel, { color: colors.muted }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={[styles.weekBars, compact && compactStyles.weekBars]}>
        {cells.map((cell) => (
          <Pressable
            key={cell.key}
            onPress={() => router.push("/(tabs)/calendar")}
            style={({ pressed }) => [
              styles.weekBarCell,
              compact && compactStyles.weekBarCell,
              { opacity: pressed ? pressedOpacity : 1 },
            ]}
            accessibilityLabel={t("tabs.week.dayA11y", { day: cell.date.getDate() })}
          >
            <View
              style={[
                styles.weekBar,
                compact && compactStyles.weekBar,
                {
                  height: cell.done
                    ? `${Math.max(24, Math.round((cell.volume / maxVolume) * 100))}%`
                    : 5,
                  backgroundColor: cell.done
                    ? cell.today
                      ? colors.primary
                      : `${colors.primary}80`
                    : colors.background,
                  borderColor:
                    cell.planned && !cell.done
                      ? colors.border
                      : cell.done
                        ? `${colors.primary}4D`
                        : colors.border,
                },
              ]}
            />
            <Text
              style={[
                styles.weekBarDay,
                {
                  color: cell.today ? colors.primary : colors.muted,
                  fontWeight: cell.today ? "800" : "600",
                },
              ]}
            >
              {cell.date
                .toLocaleDateString(locale, { weekday: "short" })
                .replace(".", "")
                .toLowerCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  suffix,
  colors,
  compact,
}: {
  label: string;
  value: string;
  suffix: string;
  colors: any;
  compact: boolean;
}) {
  return (
    <Pressable
      onPress={() => router.push("/(tabs)/stats")}
      style={({ pressed }) => [
        styles.metric,
        compact && compactStyles.metric,
        { borderColor: colors.border, opacity: pressed ? pressedOpacity : 1 },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.metricValue,
          compact && compactStyles.metricValue,
          { color: colors.foreground },
        ]}
      >
        {value}
        <Text style={styles.metricSuffix}>{suffix}</Text>
      </Text>
      <Text
        style={[
          styles.metricLabel,
          compact && compactStyles.metricLabel,
          { color: colors.muted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DailyEnergyCard({
  estimate,
  colors,
  compact,
}: {
  estimate: {
    restingCalories: number;
    movementCalories: number;
    workoutCalories: number;
    totalCalories: number;
    isPersonalizedRestingEstimate: boolean;
  };
  colors: any;
  compact: boolean;
}) {
  const { lang, t } = useLanguage();
  const locale = lang === "en" ? "en-US" : "ru-RU";
  return (
    <Pressable
      onPress={() => router.push("/(tabs)/body")}
      style={({ pressed }) => [
        styles.energyCard,
        compact && compactStyles.energyCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? pressedOpacity : 1,
        },
      ]}
    >
      <View style={styles.energyHead}>
        <View>
          <Text style={[styles.energyKicker, { color: colors.primary }]}>
            {t("tabs.energy.title")}
          </Text>
          <Text
            style={[
              styles.energyValue,
              compact && compactStyles.energyValue,
              { color: colors.foreground },
            ]}
          >
            {estimate.totalCalories.toLocaleString(locale)}{" "}
            <Text style={styles.energySuffix}>{t("tabs.energy.unit")}</Text>
          </Text>
        </View>
        <IconSymbol
          name="bolt.fill"
          size={compact ? 25 : 30}
          color={colors.primary}
        />
      </View>
      {!compact && (
        <View
          style={[styles.energyBreakdown, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.energyPart, { color: colors.muted }]}>
            {t("tabs.energy.resting")}{" "}
            <Text
              style={[styles.energyPartValue, { color: colors.foreground }]}
            >
              {estimate.restingCalories}
            </Text>
          </Text>
          <Text style={[styles.energyPart, { color: colors.muted }]}>
            {t("tabs.energy.movement")}{" "}
            <Text
              style={[styles.energyPartValue, { color: colors.foreground }]}
            >
              {estimate.movementCalories}
            </Text>
          </Text>
          <Text style={[styles.energyPart, { color: colors.muted }]}>
            {t("tabs.energy.workout")}{" "}
            <Text style={[styles.energyPartValue, { color: colors.primary }]}>
              {estimate.workoutCalories}
            </Text>
          </Text>
        </View>
      )}
      <Text style={[styles.energyHint, { color: colors.muted }]}>
        {estimate.isPersonalizedRestingEstimate
          ? t("tabs.energy.hintPersonal")
          : t("tabs.energy.hintFillProfile")}
      </Text>
    </Pressable>
  );
}

function WeeklyEnergyTrend({
  points,
  colors,
  compact,
}: {
  points: HomeEnergyTrendPoint[];
  colors: any;
  compact: boolean;
}) {
  const { lang, t } = useLanguage();
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const average = Math.round(
    points.reduce((sum, point) => sum + point.totalCalories, 0) /
      Math.max(1, points.length),
  );
  const width = 308;
  const height = compact ? 74 : 112;
  const baseline = compact ? 54 : 82;
  const maxCalories = Math.max(
    1,
    ...points.map((point) => point.totalCalories),
  );
  const gap = 10;
  const barWidth = Math.max(
    18,
    Math.min(
      28,
      (width - 24 - gap * Math.max(0, points.length - 1)) /
        Math.max(1, points.length),
    ),
  );
  return (
    <Pressable
      onPress={() => router.push("/(tabs)/body")}
      style={({ pressed }) => [
        styles.energyTrend,
        compact && compactStyles.energyTrend,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          opacity: pressed ? pressedOpacity : 1,
        },
      ]}
    >
      <View style={styles.energyTrendHead}>
        <View>
          <Text style={[styles.energyKicker, { color: colors.primary }]}>
            {t("tabs.energyTrend.title")}
          </Text>
          <Text style={[styles.energyTrendValue, { color: colors.foreground }]}>
            {average.toLocaleString(locale)}{" "}
            <Text style={styles.energySuffix}>{t("tabs.energyTrend.average")}</Text>
          </Text>
        </View>
        <IconSymbol
          name="chart.bar.fill"
          size={compact ? 21 : 25}
          color={colors.primary}
        />
      </View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={12}
          x2={width - 12}
          y1={baseline}
          y2={baseline}
          stroke={colors.border}
          strokeWidth="1"
        />
        {points.map((point, index) => {
          const x = 12 + index * (barWidth + gap);
          const barHeight = Math.max(
            6,
            (point.totalCalories / maxCalories) * (compact ? 44 : 65),
          );
          return (
            <Rect
              key={point.date}
              x={x}
              y={baseline - barHeight}
              width={barWidth}
              height={barHeight}
              fill={
                point.workoutCalories > 0 ? colors.primary : colors.foreground
              }
            />
          );
        })}
      </Svg>
      <View style={styles.chartAxis}>
        {points.map((point) => (
          <Text
            key={point.date}
            style={[styles.axisLabel, { color: colors.muted }]}
          >
            {point.label}
          </Text>
        ))}
      </View>
      <Text style={[styles.energyTrendHint, { color: colors.muted }]}>
        {t("tabs.energyTrend.hint")}
      </Text>
    </Pressable>
  );
}

function NutritionProgress({
  calories,
  calorieGoal,
  macros,
  macroGoals,
  colors,
  compact,
}: {
  calories: number;
  calorieGoal: number;
  macros: { protein: number; fat: number; carbs: number };
  macroGoals: { protein: number; fat: number; carbs: number };
  colors: any;
  compact: boolean;
}) {
  const { t } = useLanguage();
  const items = [
    {
      label: t("tabs.nutrition.proteinShort"),
      value: macros.protein,
      goal: macroGoals.protein,
      color: colors.primary,
    },
    { label: t("tabs.nutrition.fatShort"), value: macros.fat, goal: macroGoals.fat, color: colors.warning },
    {
      label: t("tabs.nutrition.carbsShort"),
      value: macros.carbs,
      goal: macroGoals.carbs,
      color: colors.success,
    },
  ];
  const caloriePercent = Math.min(
    100,
    Math.round((calories / Math.max(1, calorieGoal)) * 100),
  );
  return (
    <Pressable
      onPress={() => router.push("/(tabs)/nutrition")}
      style={({ pressed }) => [
        styles.nutritionProgress,
        compact && compactStyles.nutritionProgress,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          opacity: pressed ? pressedOpacity : 1,
        },
      ]}
    >
      <View style={styles.nutritionHead}>
        <View>
          <Text style={[styles.nutritionKicker, { color: colors.primary }]}>
            {t("tabs.nutrition.title")}
          </Text>
          <Text
            style={[
              styles.nutritionCalories,
              compact && compactStyles.nutritionCalories,
              { color: colors.foreground },
            ]}
          >
            {calories}{" "}
            <Text style={styles.nutritionCaloriesSuffix}>
              {t("tabs.nutrition.goalSuffix", { goal: calorieGoal })}
            </Text>
          </Text>
        </View>
        <Text
          style={[
            styles.nutritionPercent,
            { color: calories > calorieGoal ? colors.error : colors.primary },
          ]}
        >
          {caloriePercent}%
        </Text>
      </View>
      <View style={[styles.nutritionTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.nutritionFill,
            {
              width: `${caloriePercent}%`,
              backgroundColor:
                calories > calorieGoal ? colors.error : colors.primary,
            },
          ]}
        />
      </View>
      {!compact && (
        <View style={styles.macroProgressRow}>
          {items.map((item) => {
            const percent = Math.min(
              100,
              Math.round((item.value / Math.max(1, item.goal)) * 100),
            );
            return (
              <View key={item.label} style={styles.macroProgress}>
                <View style={styles.macroProgressHead}>
                  <Text
                    style={[styles.macroProgressLabel, { color: colors.muted }]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.macroProgressValue,
                      { color: colors.foreground },
                    ]}
                  >
                    {t("tabs.nutrition.macroValue", { value: item.value, goal: item.goal })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.macroProgressTrack,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.macroProgressFill,
                      { width: `${percent}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Pressable>
  );
}

function CompletedWorkoutChart({
  points,
  colors,
  compact,
}: {
  points: HomeWorkoutTrendPoint[];
  colors: any;
  compact: boolean;
}) {
  const { t } = useLanguage();
  const width = 308;
  const height = compact ? 92 : 132;
  const baseline = compact ? 70 : 104;
  const paddingX = 12;
  const maxVolume = Math.max(1, ...points.map((point) => point.volume));
  const gap = 12;
  const barWidth = points.length
    ? Math.max(
        18,
        Math.min(
          32,
          (width - paddingX * 2 - gap * Math.max(0, points.length - 1)) /
            points.length,
        ),
      )
    : 0;
  return points.length ? (
    <>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={paddingX}
          x2={width - paddingX}
          y1={baseline}
          y2={baseline}
          stroke={colors.border}
          strokeWidth="1"
        />
        {points.map((point, index) => {
          const x = paddingX + index * (barWidth + gap);
          const barHeight = Math.max(8, (point.volume / maxVolume) * 78);
          return (
            <Rect
              key={point.date}
              x={x}
              y={baseline - barHeight}
              width={barWidth}
              height={barHeight}
              fill={
                index === points.length - 1
                  ? colors.primary
                  : `${colors.primary}66`
              }
              onPress={() =>
                router.push({
                  pathname: "/workout-history/[id]",
                  params: { id: point.workoutId },
                })
              }
            />
          );
        })}
      </Svg>
      <View style={styles.chartAxis}>
        {points.map((point) => (
          <Text
            key={point.date}
            style={[styles.axisLabel, { color: colors.muted }]}
          >
            {point.label}
          </Text>
        ))}
      </View>
    </>
  ) : (
    <View style={styles.chartEmpty}>
      <Text style={[styles.chartEmptyText, { color: colors.muted }]}>
        {t("tabs.trend.empty")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  hero: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14 },
  heroEyebrow: { ...typeTokens.eyebrow },
  heroGreeting: { ...typeTokens.title, fontSize: 27, marginTop: 6 },
  heroDate: { fontSize: 13, marginTop: 5, textTransform: "capitalize" },
  brandCredit: { marginTop: 10, gap: 2 },
  creditName: { fontSize: 9, fontWeight: "700", letterSpacing: 0.3 },
  creditRights: { fontSize: 8, fontWeight: "600", letterSpacing: 0.1, opacity: 0.8 },
  todCard: {
    marginHorizontal: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  todGlow: { position: "absolute", top: 0, right: 0, width: 220, height: 110, borderBottomLeftRadius: 110, opacity: 0.55 },
  todTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  todKicker: { ...typeTokens.eyebrow },
  todBadge: { borderWidth: 1, borderRadius: radius.chip, paddingHorizontal: 10, paddingVertical: 5 },
  todBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", fontVariant: ["tabular-nums"] },
  todName: { ...typeTokens.title, marginTop: 12 },
  todMeta: { flexDirection: "row", gap: 16, marginTop: 8 },
  todMetaText: { fontSize: 13 },
  todMetaValue: { fontWeight: "800", fontSize: 14 },
  todExList: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  todExChip: { borderWidth: 1, borderRadius: radius.chip, paddingHorizontal: 10, paddingVertical: 5, maxWidth: 150 },
  todExChipText: { fontSize: 11, fontWeight: "600" },
  todCta: {
    marginTop: 16,
    minHeight: minTouchTarget + 6,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  todCtaText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
  emptyPlan: { paddingTop: 12, gap: 13 },
  emptyPlanText: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  planButton: {
    minHeight: minTouchTarget,
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  planButtonText: { fontSize: 13, fontWeight: "700" },
  quoteCard: {
    margin: 14,
    marginBottom: 0,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: radius.tile,
    padding: 16,
    paddingLeft: 18,
    gap: 7,
    overflow: "hidden",
    position: "relative",
  },
  quoteAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  quoteKicker: { ...typeTokens.eyebrow, fontSize: 9 },
  quoteText: { fontSize: 15, lineHeight: 22, fontWeight: "600", fontStyle: "italic" },
  quoteAuthor: { ...typeTokens.eyebrow, fontSize: 8, marginTop: 2 },
  weekCard: {
    margin: 14,
    marginBottom: 0,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 18,
  },
  weekHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weekKicker: { ...typeTokens.eyebrow },
  weekRange: { fontSize: 11, fontVariant: ["tabular-nums"] },
  weekStats: { flexDirection: "row", gap: 8, marginTop: 12 },
  weekStat: { flex: 1, borderWidth: 1, borderRadius: radius.input, padding: 12, paddingBottom: 10 },
  weekStatValue: { fontSize: 20, fontWeight: "800" },
  weekStatLabel: { fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 4 },
  weekBars: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 64, marginTop: 16 },
  weekBarCell: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  weekBar: { width: "100%", maxWidth: 26, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, borderWidth: 1 },
  weekBarDay: { fontSize: 9, letterSpacing: 0.5 },
  nutritionProgress: {
    margin: 14,
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 14,
    gap: 10,
  },
  nutritionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  nutritionKicker: { ...typeTokens.eyebrow, fontSize: 9 },
  nutritionCalories: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  nutritionCaloriesSuffix: { fontSize: 10, letterSpacing: 0 },
  nutritionPercent: { fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] },
  nutritionTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  nutritionFill: { height: "100%" },
  macroProgressRow: { flexDirection: "row", gap: 8 },
  macroProgress: { flex: 1, gap: 4 },
  macroProgressHead: { flexDirection: "row", justifyContent: "space-between" },
  macroProgressLabel: { fontSize: 9, fontWeight: "800" },
  macroProgressValue: { fontSize: 9, fontWeight: "700", fontVariant: ["tabular-nums"] },
  macroProgressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  macroProgressFill: { height: "100%" },
  analytics: {
    margin: 14,
    marginBottom: 0,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  analyticsTitle: { ...typeTokens.eyebrow, fontSize: 12, letterSpacing: 0.8 },
  chartTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartCaption: { fontSize: 9, fontWeight: "700", letterSpacing: 0.6 },
  chartLink: { paddingBottom: 3, borderBottomWidth: 2 },
  chartLinkText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  chartAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 3,
    paddingHorizontal: 4,
  },
  axisLabel: { fontSize: 8, flex: 1, textAlign: "center", fontWeight: "600", fontVariant: ["tabular-nums"] },
  chartEmpty: {
    minHeight: 132,
    justifyContent: "center",
    alignItems: "center",
  },
  chartEmptyText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 16,
  },
  metricsStack: { gap: 0 },
  energyCard: {
    marginHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 14,
    gap: 9,
  },
  energyHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  energyKicker: { ...typeTokens.eyebrow, fontSize: 9 },
  energyValue: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.3,
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  energySuffix: { fontSize: 11, letterSpacing: 0 },
  energyBreakdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  energyPart: { fontSize: 10, fontWeight: "600", flex: 1 },
  energyPartValue: { fontSize: 11, fontWeight: "800", fontVariant: ["tabular-nums"] },
  energyHint: { fontSize: 10, lineHeight: 13, fontWeight: "500" },
  energyTrend: {
    marginHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 14,
  },
  energyTrendHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  energyTrendValue: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  energyTrendHint: { fontSize: 10, fontWeight: "500", marginTop: 4 },
  dataRow: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginTop: 14,
    gap: 8,
  },
  metric: {
    flex: 1,
    minHeight: 75,
    padding: 12,
    borderWidth: 1,
    borderRadius: radius.tile,
  },
  metricValue: { fontSize: 19, fontWeight: "800", letterSpacing: -0.8, fontVariant: ["tabular-nums"] },
  metricSuffix: { fontSize: 10 },
  metricLabel: {
    ...typeTokens.eyebrow,
    fontSize: 8,
    marginTop: 9,
  },
  footerActions: {
    flexDirection: "row",
    paddingHorizontal: 14,
    marginTop: 14,
    gap: 10,
  },
  outlineAction: {
    flex: 1,
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderRadius: radius.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  actionText: { ...typeTokens.eyebrow, fontSize: 10 },
  sideMotto: {
    position: "absolute",
    top: 166,
    left: -111,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    writingDirection: "ltr",
    transform: [{ rotate: "-90deg" }],
    width: 260,
    textAlign: "center",
  },
  widgetShell: { position: "relative" },
  widgetHandle: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 29,
    height: 29,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.chip,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 12,
  },
  widgetHandleText: { fontSize: 19, lineHeight: 21, fontWeight: "800" },
  hintBackdrop: {
    flex: 1,
    backgroundColor: "#050806B8",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  hintCard: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 22,
    gap: 12,
  },
  hintEyebrow: { ...typeTokens.eyebrow, fontSize: 9 },
  hintTitle: { ...typeTokens.title, fontSize: 24, lineHeight: 28 },
  hintText: { fontSize: 13, lineHeight: 20, fontWeight: "500" },
  hintButton: {
    minHeight: minTouchTarget,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  hintButtonText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
});

const compactStyles = StyleSheet.create({
  quoteCard: { paddingVertical: 10, gap: 4 },
  quoteText: { fontSize: 12, lineHeight: 17 },
  weekBars: { height: 46, marginTop: 12 },
  weekBarCell: { gap: 4 },
  weekBar: { maxWidth: 22 },
  nutritionProgress: { paddingVertical: 9, gap: 7 },
  nutritionCalories: { fontSize: 20, marginTop: 1 },
  analytics: { minHeight: 150 },
  energyCard: { paddingVertical: 10, gap: 4 },
  energyValue: { fontSize: 23, marginTop: 1 },
  energyTrend: { paddingVertical: 10, marginTop: 9 },
  dataRow: { marginTop: 9 },
  metric: { minHeight: 56, paddingVertical: 8 },
  metricValue: { fontSize: 16 },
  metricLabel: { marginTop: 5, fontSize: 7 },
  footerActions: { marginTop: 8 },
  outlineAction: { minHeight: 44, paddingHorizontal: 10 },
});
