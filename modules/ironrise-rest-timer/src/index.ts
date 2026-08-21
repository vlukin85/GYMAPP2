import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

type IronriseRestTimerNativeModule = {
  showCountdown(restEndAt: number, targetLabel: string, targetFromBpm: number, targetToBpm: number, currentHeartRateBpm: number, heartRateZoneColor: string, completionSound: string): void;
  previewCompletionSound(completionSound: string): void;
  clearCountdown(): void;
  consumePendingAction(): { kind: "skip" | "extend" | "start"; restEndAt: number } | null;
};

export type NativeRestTimerAction = { kind: "skip" | "extend" | "start"; restEndAt: number };
export type LockScreenHeartRateTarget = { label: string; fromBpm?: number; toBpm?: number; currentBpm?: number; zoneColor?: string };
export type NativeRestCompletionSound = "female" | "male" | "siren" | "silent";

function getModule(): IronriseRestTimerNativeModule | null {
  if (Platform.OS !== "android") return null;
  return requireOptionalNativeModule<IronriseRestTimerNativeModule>("IronriseRestTimer");
}

export function showNativeRestCountdown(restEndAt: number, target?: LockScreenHeartRateTarget, completionSound: NativeRestCompletionSound = "female") {
  const module = getModule();
  if (!module) return false;
  module.showCountdown(restEndAt, target?.label ?? "", target?.fromBpm ?? 0, target?.toBpm ?? 0, target?.currentBpm ?? 0, target?.zoneColor ?? "", completionSound);
  return true;
}

export function clearNativeRestCountdown() {
  const module = getModule();
  if (!module) return false;
  module.clearCountdown();
  return true;
}

export function previewNativeRestCompletionSound(completionSound: NativeRestCompletionSound) {
  const module = getModule();
  if (!module || completionSound === "silent") return false;
  module.previewCompletionSound(completionSound);
  return true;
}

export function consumeNativeRestTimerAction(): NativeRestTimerAction | null {
  return getModule()?.consumePendingAction() ?? null;
}
