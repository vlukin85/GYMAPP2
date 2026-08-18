export type MainTabId = "today" | "calendar" | "exercises" | "programs" | "stats";

const tabRoutes = ["/(tabs)", "/(tabs)/calendar", "/(tabs)/exercises", "/(tabs)/programs", "/(tabs)/stats"] as const;
const tabIndex: Record<MainTabId, number> = { today: 0, calendar: 1, exercises: 2, programs: 3, stats: 4 };

export function getMainTabIdFromPathname(pathname: string): MainTabId {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/exercises")) return "exercises";
  if (pathname.startsWith("/programs")) return "programs";
  if (pathname.startsWith("/stats")) return "stats";
  return "today";
}

export function getAdjacentMainTab(current: MainTabId, translationX: number) {
  if (Math.abs(translationX) < 64) return null;
  const nextIndex = Math.max(0, Math.min(tabRoutes.length - 1, tabIndex[current] + (translationX < 0 ? 1 : -1)));
  return nextIndex === tabIndex[current] ? null : tabRoutes[nextIndex];
}
