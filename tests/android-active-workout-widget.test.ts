import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const widgetSource = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/ActiveWorkoutWidget.kt",
  ),
  "utf8",
);
const widgetManifest = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/AndroidManifest.xml",
  ),
  "utf8",
);
const widgetInfo = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/res/xml/ironrise_active_workout_widget_info.xml",
  ),
  "utf8",
);
const widgetBridge = readFileSync(
  resolve(process.cwd(), "modules/ironrise-rest-timer/src/index.ts"),
  "utf8",
);
const timerModule = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/IronriseRestTimerModule.kt",
  ),
  "utf8",
);
const earlyWarningReceiver = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerEarlyWarningReceiver.kt",
  ),
  "utf8",
);
const weeklyWidgetInfo = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/res/xml/ironrise_week_stats_widget_info.xml",
  ),
  "utf8",
);
const weeklyWidgetLayout = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/res/layout/ironrise_week_stats_widget.xml",
  ),
  "utf8",
);
const homeScreen = readFileSync(
  resolve(process.cwd(), "app/(tabs)/index.tsx"),
  "utf8",
);
const workoutScreen = readFileSync(
  resolve(process.cwd(), "app/workout.tsx"),
  "utf8",
);
const calendarScreen = readFileSync(
  resolve(process.cwd(), "app/(tabs)/calendar.tsx"),
  "utf8",
);

describe("Android-виджет активной тренировки", () => {
  it("зарегистрирован как системный виджет с XML-метаданными", () => {
    expect(widgetManifest).toContain(".ActiveWorkoutWidgetProvider");
    expect(widgetManifest).toContain("android.permission.BIND_APPWIDGET");
    expect(widgetInfo).toContain("@layout/ironrise_active_workout_widget");
    expect(widgetInfo).toContain('android:updatePeriodMillis="0"');
  });

  it("безопасно передаёт действия через явный immutable PendingIntent", () => {
    expect(widgetSource).toContain("AppWidgetProvider");
    expect(widgetSource).toContain("RemoteViews");
    expect(widgetSource).toContain("ActiveWorkoutWidgetProvider::class.java");
    expect(widgetSource).toContain("PendingIntent.FLAG_IMMUTABLE");
    expect(widgetSource).toContain("WIDGET_ACTION_START_SET");
    expect(widgetSource).toContain("WIDGET_ACTION_FINISH_SET");
    expect(widgetSource).toContain("WIDGET_ACTION_EXTEND_REST");
    expect(widgetSource).toContain("WIDGET_ACTION_SKIP_REST");
  });

  it("синхронизируется с экраном тренировки и возвращает пользователя через deep link", () => {
    expect(widgetBridge).toContain("updateActiveWorkoutWidget");
    expect(widgetBridge).toContain("consumeActiveWorkoutWidgetAction");
    expect(workoutScreen).toContain("Linking.createURL(\"/workout\"");
    expect(workoutScreen).toContain("finishSetFromWidget");
    expect(workoutScreen).toContain("syncActiveWorkoutWidgetAction");
    expect(workoutScreen).toContain("startRestAfterSetInput(setIndex, completedDraft)");
  });

  it("планирует отдельный сигнал ровно за 10 секунд до завершения отдыха", () => {
    expect(timerModule).toContain("val earlyWarningAt = restEndAt - 10_000L");
    expect(timerModule).toContain("RestTimerEarlyWarningReceiver::class.java");
    expect(earlyWarningReceiver).toContain("VibrationEffect.createWaveform");
    expect(earlyWarningReceiver).toContain("completionSoundUri(context, sound)");
  });

  it("регистрирует виджет прогресса недели и передаёт ему реальные weekly-агрегаты", () => {
    expect(widgetManifest).toContain(".WeeklyStatsWidgetProvider");
    expect(weeklyWidgetInfo).toContain("@layout/ironrise_week_stats_widget");
    expect(weeklyWidgetLayout).toContain("ironrise_week_stats_progress");
    expect(widgetBridge).toContain("updateWeeklyStatsWidget");
    expect(homeScreen).toContain("getCurrentTrainingPeriodStats(completed, now).week");
    expect(homeScreen).toContain("weeklyTrainingStats.totalVolume");
  });

  it("сохраняет кнопку календарного sheet выше системной панели", () => {
    expect(calendarScreen).toContain("useSafeAreaInsets");
    expect(calendarScreen).toContain("paddingBottom: Math.max(20, insets.bottom + 12)");
  });
});
