export type LaunchMarker = { id: string; startedAt: string; completed: boolean; consecutiveFailures: number };

export function nextLaunchMarker(previous: LaunchMarker | null, now = new Date()): LaunchMarker {
  const isRecentUnfinished = Boolean(previous && !previous.completed && now.getTime() - new Date(previous.startedAt).getTime() < 7 * 24 * 60 * 60 * 1000);
  return { id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`, startedAt: now.toISOString(), completed: false, consecutiveFailures: isRecentUnfinished ? previous!.consecutiveFailures + 1 : 0 };
}

export function shouldWarnAboutRepeatedFailures(marker: LaunchMarker) {
  return marker.consecutiveFailures >= 2;
}
