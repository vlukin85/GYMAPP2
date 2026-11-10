import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

type IronriseRestTimerNativeModule = {
  showCountdown(payload: NativeRestCountdownPayload): void;
  showActiveSetNotification(payload: NativeActiveSetPayload): void;
  clearActiveSetNotification(): void;
  previewCompletionSound(completionSound: string): boolean;
  clearCountdown(): void;
  updateActiveWorkoutWidget(payload: ActiveWorkoutWidgetPayload): void;
  updateWeeklyStatsWidget(payload: WeeklyStatsWidgetPayload): void;
  consumeActiveWorkoutWidgetAction(): ActiveWorkoutWidgetAction | null;
  consumePendingAction(): {
    kind: "skip" | "extend" | "start" | "finish-exercise" | "commit-set";
    restEndAt: number;
    exerciseId?: string;
    setIndex?: number;
    weight?: string;
    reps?: string;
  } | null;
};

export type ActiveWorkoutWidgetAction = {
  kind: "start-set" | "finish-set" | "extend-rest" | "skip-rest" | "open";
  exerciseId?: string;
  setIndex?: number;
  restEndAt?: number;
};

export type WeeklyStatsWidgetPayload = {
  workoutCount: number;
  activeDays: number;
  durationMinutes: number;
  volume: number;
  openUrl: string;
};

export type ActiveWorkoutWidgetPayload = {
  active: boolean;
  programName: string;
  exerciseName: string;
  completedSets: number;
  totalSets: number;
  exerciseId: string;
  setIndex: number;
  activeSet: boolean;
  restEndAt?: number | null;
  openUrl: string;
};

// Язык нативных уведомлений: JS передаёт текущий язык приложения, Kotlin
// выбирает по нему строки заголовков, текстов и кнопок (дефолт — русский).
export type NativeLang = "ru" | "en";

export type NativeRestTimerAction = {
  kind: "skip" | "extend" | "start" | "finish-exercise" | "commit-set";
  restEndAt: number;
  exerciseId?: string;
  setIndex?: number;
  weight?: string;
  reps?: string;
};
export type NativeActiveSetPayload = {
  exerciseName: string;
  setIndex: number;
  setsCount: number;
  planWeightKg: number;
  planReps: number;
  exerciseIndex: number;
  exercisesCount: number;
  exerciseId?: string;
  lang?: NativeLang;
};
export type NativeRestNextAction = {
  kind: "start" | "finish-exercise";
  exerciseId?: string;
  setIndex?: number;
  weight?: string;
  reps?: string;
};
export type LockScreenHeartRateTarget = {
  label: string;
  fromBpm?: number;
  toBpm?: number;
  currentBpm?: number;
  zoneColor?: string;
};
export type NativeRestCompletionSound = "female" | "male" | "siren" | "silent";

type NativeRestCountdownPayload = {
  restEndAt: number;
  targetLabel: string;
  targetFromBpm: number;
  targetToBpm: number;
  currentHeartRateBpm: number;
  heartRateZoneColor: string;
  completionSound: NativeRestCompletionSound;
  completionVolume: number;
  completionVibrationEnabled: boolean;
  completionVibrationPattern: string;
  nextActionKind: NativeRestNextAction["kind"];
  exerciseId: string;
  nextSetIndex: number;
  nextSetWeight: string;
  nextSetReps: string;
  lang: NativeLang;
};

function getModule(): IronriseRestTimerNativeModule | null {
  if (Platform.OS !== "android") return null;
  return requireOptionalNativeModule<IronriseRestTimerNativeModule>(
    "IronriseRestTimer",
  );
}

export function showNativeRestCountdown(
  restEndAt: number,
  target?: LockScreenHeartRateTarget,
  completionSound: NativeRestCompletionSound = "female",
  completionVolume = 0.8,
  completionVibrationEnabled = true,
  completionVibrationPattern = "short",
  nextAction: NativeRestNextAction = { kind: "start" },
  lang: NativeLang = "ru",
) {
  const module = getModule();
  if (!module) return false;
  module.showCountdown({
    restEndAt,
    targetLabel: target?.label ?? "",
    targetFromBpm: target?.fromBpm ?? 0,
    targetToBpm: target?.toBpm ?? 0,
    currentHeartRateBpm: target?.currentBpm ?? 0,
    heartRateZoneColor: target?.zoneColor ?? "",
    completionSound,
    completionVolume: Math.max(0.1, Math.min(1, completionVolume)),
    completionVibrationEnabled,
    completionVibrationPattern,
    nextActionKind: nextAction.kind,
    exerciseId: nextAction.exerciseId ?? "",
    nextSetIndex: nextAction.setIndex ?? -1,
    nextSetWeight: nextAction.weight ?? "",
    nextSetReps: nextAction.reps ?? "",
    lang,
  });
  return true;
}

export function clearNativeRestCountdown() {
  const module = getModule();
  if (!module) return false;
  module.clearCountdown();
  return true;
}

/**
 * Зеркало выполняющегося подхода для часов: постоянное уведомление с планом
 * подхода и действием «Завершить подход». setIndex ожидается 0-базным —
 * нативный слой сам отображает «Подход N из M».
 */
export function showNativeActiveSetNotification(
  payload: NativeActiveSetPayload,
) {
  const module = getModule();
  if (!module) return false;
  module.showActiveSetNotification({
    exerciseName: payload.exerciseName,
    setIndex: payload.setIndex,
    setsCount: payload.setsCount,
    planWeightKg: payload.planWeightKg,
    planReps: payload.planReps,
    exerciseIndex: payload.exerciseIndex,
    exercisesCount: payload.exercisesCount,
    exerciseId: payload.exerciseId ?? "",
    lang: payload.lang ?? "ru",
  });
  return true;
}

export function clearNativeActiveSetNotification() {
  const module = getModule();
  if (!module) return false;
  module.clearActiveSetNotification();
  return true;
}

export function updateWeeklyStatsWidget(payload: WeeklyStatsWidgetPayload) {
  const module = getModule();
  if (!module) return false;
  module.updateWeeklyStatsWidget(payload);
  return true;
}

export function updateActiveWorkoutWidget(payload: ActiveWorkoutWidgetPayload) {
  const module = getModule();
  if (!module) return false;
  module.updateActiveWorkoutWidget(payload);
  return true;
}

export function consumeActiveWorkoutWidgetAction(): ActiveWorkoutWidgetAction | null {
  const module = getModule();
  return module?.consumeActiveWorkoutWidgetAction() ?? null;
}

export function previewNativeRestCompletionSound(
  completionSound: NativeRestCompletionSound,
) {
  const module = getModule();
  if (!module || completionSound === "silent") return false;
  // Нативная сторона отвечает, реально ли запустилось воспроизведение:
  // RingtoneManager на части устройств молча не проигрывает raw-ресурсы.
  return module.previewCompletionSound(completionSound) === true;
}

export function consumeNativeRestTimerAction(): NativeRestTimerAction | null {
  return getModule()?.consumePendingAction() ?? null;
}
