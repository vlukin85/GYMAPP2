import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const notificationService = readFileSync(
  resolve(process.cwd(), "lib/workout-notifications.ts"),
  "utf8",
);
const nativeModule = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/IronriseRestTimerModule.kt",
  ),
  "utf8",
);
const nativeBridge = readFileSync(
  resolve(process.cwd(), "modules/ironrise-rest-timer/src/index.ts"),
  "utf8",
);
const receiver = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerCompletionReceiver.kt",
  ),
  "utf8",
);
const actionReceiver = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerActionReceiver.kt",
  ),
  "utf8",
);
const workoutScreen = readFileSync(
  resolve(process.cwd(), "app/workout.tsx"),
  "utf8",
);

describe("таймер отдыха на заблокированном Android-экране", () => {
  it("передаёт обратный отсчёт нативному модулю и не дублирует Expo-уведомление", () => {
    expect(notificationService).toContain(
      "showNativeRestCountdown(restEndAt, target, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextAction)",
    );
    expect(notificationService).toContain("nativeCountdownStarted ? undefined");
    expect(notificationService).toContain("clearNativeRestCountdown()");
    expect(nativeModule).toContain(
      'Function("showCountdown") { payload: Map<String, Any?>',
    );
    expect(nativeBridge).toContain("module.showCountdown({");
  });

  it("публикует и обновляет постоянное уведомление в момент запуска и продления отдыха", () => {
    expect(workoutScreen).toMatch(
      /const startRestTimer[\s\S]*?showRestLockScreenNotification\(endTimestamp, nextAction\)/,
    );
    expect(workoutScreen).toMatch(
      /const extendRestTimer[\s\S]*?showRestLockScreenNotification\(updatedEnd\)/,
    );
    expect(nativeModule).toContain(
      "completionPendingIntent(context, PendingIntent.FLAG_NO_CREATE)?.let",
    );
  });

  it("использует системный хронометр и отдельный виброканал завершения", () => {
    expect(nativeModule).toContain(".setWhen(restEndAt)");
    expect(nativeModule).not.toContain(
      "SystemClock.elapsedRealtime() + remaining",
    );
    expect(nativeModule).toContain("setUsesChronometer(true)");
    expect(nativeModule).toContain("setChronometerCountDown(true)");
    expect(nativeModule).toContain("setExactAndAllowWhileIdle");
    expect(receiver).toContain("enableVibration(vibrationEnabled)");
    expect(receiver).toContain("vibrationPattern");
    expect(receiver).toContain("COMPLETION_ACCENT_COLOR");
    expect(receiver).toContain(
      "setColor(android.graphics.Color.parseColor(COMPLETION_ACCENT_COLOR))",
    );
  });

  it("даёт управлять отдыхом и видеть целевую зону на экране блокировки", () => {
    expect(nativeModule).toContain('"Пропустить"');
    expect(nativeModule).toContain('"+30 секунд"');
    expect(nativeModule).toContain("Цель пульса:");
    expect(actionReceiver).toContain("ACTION_SKIP");
    expect(actionReceiver).toContain("ACTION_EXTEND");
    expect(actionReceiver).toContain("savePendingAction");
    expect(workoutScreen).toContain("consumeNativeRestTimerAction()");
    expect(workoutScreen).toMatch(
      /scheduleRestTimerLockScreenNotification\(\s*endTimestamp/,
    );
  });

  it("добавляет приватную текущую ЧСС и действие начала подхода", () => {
    expect(nativeModule).toContain('"Начать подход"');
    expect(nativeModule).toContain("currentHeartRateBpm");
    expect(actionReceiver).toContain("ACTION_START");
    expect(actionReceiver).toContain(
      "savePendingAction(context, nextActionKind, System.currentTimeMillis(), exerciseId)",
    );
    expect(workoutScreen).toContain("lockScreenHeartRateVisible");
    expect(workoutScreen).toContain("loadLockScreenHeartRateVisible()");
  });

  it("показывает завершение упражнения после последнего подхода в обоих Android-уведомлениях", () => {
    expect(nativeBridge).toContain('kind: "start" | "finish-exercise"');
    expect(nativeModule).toContain('nextActionKind == "finish-exercise"');
    expect(nativeModule).toContain('"Завершить упражнение"');
    expect(receiver).toContain('nextActionKind == "finish-exercise"');
    expect(receiver).toContain('"Последний подход завершён."');
    expect(workoutScreen).toContain(
      'kind: setIndex === draft.length - 1 ? "finish-exercise" : "start"',
    );
  });

  it("фиксирует отдых по времени нажатия и не запускает секундомер упражнения из уведомления", () => {
    expect(actionReceiver).toContain(
      "savePendingAction(context, nextActionKind, System.currentTimeMillis(), exerciseId)",
    );
    expect(workoutScreen).toContain("skipRest(action.restEndAt)");
    expect(workoutScreen).toMatch(
      /action\.kind === "skip" \|\| action\.kind === "start"[\s\S]*?setActiveSet\(null\)[\s\S]*?skipRest\(action\.restEndAt\)/,
    );
    expect(workoutScreen).not.toMatch(
      /action\.kind === "start"[\s\S]{0,220}setActiveSet\(\{[^}]*startedAt/,
    );
  });

  it("применяет цвет фактической зоны пульса к уведомлению", () => {
    expect(nativeModule).toContain("heartRateZoneColor");
    expect(nativeModule).toContain("Color.parseColor");
    expect(workoutScreen).toContain("getActualHeartRateZoneColor");
  });

  it("применяет женский голос, мужской голос или сирену и позволяет начать подход из уведомления завершения", () => {
    expect(nativeModule).toContain("completionSound");
    expect(nativeModule).toContain('"rest_complete_female"');
    expect(nativeModule).toContain('"rest_complete_male"');
    expect(nativeModule).toContain('"rest_complete_siren"');
    expect(nativeModule).toContain(
      "completionSoundUri(context, completionSound)",
    );
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "modules/ironrise-rest-timer/android/src/main/res/raw/rest_complete_female.wav",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "modules/ironrise-rest-timer/android/src/main/res/raw/rest_complete_male.wav",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(
          process.cwd(),
          "modules/ironrise-rest-timer/android/src/main/res/raw/rest_complete_siren.mp3",
        ),
      ),
    ).toBe(true);
    expect(receiver).toContain('"Начать подход"');
    expect(receiver).toContain("ACTION_START");
    expect(receiver).toContain("ironrise-rest-complete-v3");
    expect(receiver).toContain("AudioAttributes.USAGE_ALARM");
    expect(receiver).toContain("setSound(soundUri");
    expect(workoutScreen).toContain("restTimerCompletionSound");
  });

  it("позволяет продлить паузу из финального уведомления", () => {
    expect(receiver).toContain('"+30 секунд"');
    expect(receiver).toContain("ACTION_EXTEND");
    expect(receiver).toContain("EXTRA_REST_END_AT");
  });

  it("сохраняет громкость сигнала и настройку вибрации для завершения и продления отдыха", () => {
    expect(nativeModule).toContain("EXTRA_COMPLETION_VOLUME");
    expect(nativeModule).toContain("EXTRA_COMPLETION_VIBRATION");
    expect(nativeModule).toContain('payload["completionVolume"]');
    expect(actionReceiver).toContain("completionVolume");
    expect(actionReceiver).toContain("completionVibrationEnabled");
    expect(receiver).toContain("volume = completionVolume");
    expect(receiver).toContain("completionVibrationEnabled");
    expect(workoutScreen).toContain("restTimerCompletionVolume");
  });

  it("сохраняет короткий, длинный или пульсирующий паттерн вибрации при продлении отдыха", () => {
    expect(nativeModule).toContain("EXTRA_COMPLETION_VIBRATION_PATTERN");
    expect(nativeModule).toContain("completionVibrationPattern");
    expect(actionReceiver).toContain("completionVibrationPattern");
    expect(receiver).toContain('"pulse"');
    expect(receiver).toContain(
      "completionVibrationPattern(vibrationPatternId)",
    );
    expect(workoutScreen).toContain("restTimerVibrationPattern");
  });
});
