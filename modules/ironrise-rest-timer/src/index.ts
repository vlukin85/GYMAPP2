import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

type IronriseRestTimerNativeModule = {
  showCountdown(payload: NativeRestCountdownPayload): void;
  previewCompletionSound(completionSound: string): void;
  clearCountdown(): void;
  consumePendingAction(): {
    kind: "skip" | "extend" | "start";
    restEndAt: number;
  } | null;
};

export type NativeRestTimerAction = {
  kind: "skip" | "extend" | "start";
  restEndAt: number;
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
  });
  return true;
}

export function clearNativeRestCountdown() {
  const module = getModule();
  if (!module) return false;
  module.clearCountdown();
  return true;
}

export function previewNativeRestCompletionSound(
  completionSound: NativeRestCompletionSound,
) {
  const module = getModule();
  if (!module || completionSound === "silent") return false;
  module.previewCompletionSound(completionSound);
  return true;
}

export function consumeNativeRestTimerAction(): NativeRestTimerAction | null {
  return getModule()?.consumePendingAction() ?? null;
}
