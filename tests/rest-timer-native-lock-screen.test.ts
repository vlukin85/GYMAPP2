import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const notificationService = readFileSync(resolve(process.cwd(), "lib/workout-notifications.ts"), "utf8");
const nativeModule = readFileSync(resolve(process.cwd(), "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/IronriseRestTimerModule.kt"), "utf8");
const receiver = readFileSync(resolve(process.cwd(), "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerCompletionReceiver.kt"), "utf8");
const actionReceiver = readFileSync(resolve(process.cwd(), "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerActionReceiver.kt"), "utf8");
const workoutScreen = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");

describe("таймер отдыха на заблокированном Android-экране", () => {
  it("передаёт обратный отсчёт нативному модулю и не дублирует Expo-уведомление", () => {
    expect(notificationService).toContain("showNativeRestCountdown(restEndAt, target)");
    expect(notificationService).toContain("nativeCountdownStarted ? undefined");
    expect(notificationService).toContain("clearNativeRestCountdown()");
  });

  it("использует системный хронометр и отдельный виброканал завершения", () => {
    expect(nativeModule).toContain("setUsesChronometer(true)");
    expect(nativeModule).toContain("setChronometerCountDown(true)");
    expect(nativeModule).toContain("setExactAndAllowWhileIdle");
    expect(receiver).toContain("enableVibration(true)");
    expect(receiver).toContain("vibrationPattern");
    expect(receiver).toContain("COMPLETION_ACCENT_COLOR");
    expect(receiver).toContain("setColor(android.graphics.Color.parseColor(COMPLETION_ACCENT_COLOR))");
  });

  it("даёт управлять отдыхом и видеть целевую зону на экране блокировки", () => {
    expect(nativeModule).toContain('"Пропустить"');
    expect(nativeModule).toContain('"+30 секунд"');
    expect(nativeModule).toContain("Цель пульса:");
    expect(actionReceiver).toContain("ACTION_SKIP");
    expect(actionReceiver).toContain("ACTION_EXTEND");
    expect(actionReceiver).toContain("savePendingAction");
    expect(workoutScreen).toContain("consumeNativeRestTimerAction()");
    expect(workoutScreen).toContain("scheduleRestTimerLockScreenNotification(endTimestamp");
  });

  it("добавляет приватную текущую ЧСС и действие начала подхода", () => {
    expect(nativeModule).toContain('"Начать подход"');
    expect(nativeModule).toContain("currentHeartRateBpm");
    expect(actionReceiver).toContain("ACTION_START");
    expect(actionReceiver).toContain('savePendingAction(context, "start"');
    expect(workoutScreen).toContain("lockScreenHeartRateVisible");
    expect(workoutScreen).toContain("loadLockScreenHeartRateVisible()");
  });

  it("применяет цвет фактической зоны пульса к уведомлению", () => {
    expect(nativeModule).toContain("heartRateZoneColor");
    expect(nativeModule).toContain("Color.parseColor");
    expect(workoutScreen).toContain("getActualHeartRateZoneColor");
  });
});
