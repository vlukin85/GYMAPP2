import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

type IronriseRestTimerNativeModule = {
  showCountdown(restEndAt: number): void;
  clearCountdown(): void;
};

function getModule(): IronriseRestTimerNativeModule | null {
  if (Platform.OS !== "android") return null;
  return requireOptionalNativeModule<IronriseRestTimerNativeModule>("IronriseRestTimer");
}

export function showNativeRestCountdown(restEndAt: number) {
  const module = getModule();
  if (!module) return false;
  module.showCountdown(restEndAt);
  return true;
}

export function clearNativeRestCountdown() {
  const module = getModule();
  if (!module) return false;
  module.clearCountdown();
  return true;
}
