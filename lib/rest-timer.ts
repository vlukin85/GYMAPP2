/** Возвращает оставшиеся полные секунды по абсолютному времени окончания. */
export function getRemainingRestSeconds(endTimestamp: number, nowTimestamp = Date.now()) {
  return Math.max(0, Math.ceil((endTimestamp - nowTimestamp) / 1000));
}

/** Нормализованный прогресс для кругового индикатора отдыха. */
export function getRestProgress(remainingSeconds: number, totalSeconds: number) {
  if (totalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, remainingSeconds / totalSeconds));
}
