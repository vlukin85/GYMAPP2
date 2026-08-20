import AsyncStorage from "@react-native-async-storage/async-storage";

import { HEART_RATE_ZONES, estimateMaximumHeartRate, type HeartRateZoneId } from "./heart-rate-analysis";

const STORAGE_KEY = "ironrise.heart-rate-target-zone.v1";

export type TargetHeartRateZoneId = Extract<HeartRateZoneId, "easy" | "aerobic" | "threshold">;
export type HeartRateTargetState = "unavailable" | "below" | "within" | "above";

export const TARGET_HEART_RATE_ZONES = HEART_RATE_ZONES.filter((zone): zone is typeof zone & { id: TargetHeartRateZoneId } => zone.id === "easy" || zone.id === "aerobic" || zone.id === "threshold");

export function targetZoneLabel(id: TargetHeartRateZoneId) {
  return TARGET_HEART_RATE_ZONES.find((zone) => zone.id === id)?.label ?? "Аэробная";
}

export function getHeartRateTargetStatus(currentBpm: number | undefined, ageYears: number | undefined, targetZoneId: TargetHeartRateZoneId): { state: HeartRateTargetState; fromBpm?: number; toBpm?: number; maximumBpm?: number } {
  const maximumBpm = estimateMaximumHeartRate(ageYears);
  const zone = TARGET_HEART_RATE_ZONES.find((item) => item.id === targetZoneId);
  if (!maximumBpm || !zone || !currentBpm) return { state: "unavailable", maximumBpm };
  const fromBpm = Math.round(maximumBpm * zone.fromRatio);
  const toBpm = Math.round(maximumBpm * zone.toRatio);
  return { state: currentBpm < fromBpm ? "below" : currentBpm > toBpm ? "above" : "within", fromBpm, toBpm, maximumBpm };
}

export async function loadTargetHeartRateZone(): Promise<TargetHeartRateZoneId> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return TARGET_HEART_RATE_ZONES.some((zone) => zone.id === value) ? value as TargetHeartRateZoneId : "aerobic";
  } catch {
    return "aerobic";
  }
}

export async function saveTargetHeartRateZone(zone: TargetHeartRateZoneId) {
  await AsyncStorage.setItem(STORAGE_KEY, zone);
}
