import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ironrise.lock-screen-heart-rate-visible.v1";

export async function loadLockScreenHeartRateVisible() {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) !== "false";
  } catch {
    return true;
  }
}

export async function saveLockScreenHeartRateVisible(visible: boolean) {
  await AsyncStorage.setItem(STORAGE_KEY, String(visible));
}
