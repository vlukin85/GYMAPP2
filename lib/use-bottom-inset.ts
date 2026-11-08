import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Единый нижний отступ для диалогов и bottom-sheet'ов с прижатыми к низу
 * кнопками действий: поднимает их над системной панелью навигации/жестов
 * Android. На устройствах без панели (или на web) даёт минимум 12dp.
 */
export function useBottomActionInset(extra = 12) {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12) + extra;
}
