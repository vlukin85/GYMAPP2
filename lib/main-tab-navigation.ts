import { MAIN_TABS, type MainTabId } from "./main-tab-preferences";

export type { MainTabId } from "./main-tab-preferences";
export type MainTabRoute = (typeof MAIN_TABS)[number]["route"];

const tabRouteById = Object.fromEntries(
  MAIN_TABS.map((tab) => [tab.id, tab.route]),
) as Record<MainTabId, MainTabRoute>;

export function getMainTabIdFromPathname(pathname: string): MainTabId {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/exercises")) return "exercises";
  if (pathname.startsWith("/programs")) return "programs";
  if (pathname.startsWith("/nutrition")) return "nutrition";
  if (pathname.startsWith("/stats")) return "stats";
  if (pathname.startsWith("/body")) return "body";
  if (pathname.startsWith("/settings")) return "settings";
  return "today";
}

export function getAdjacentMainTab(
  current: MainTabId,
  translationX: number,
  visibleTabs: readonly MainTabId[] = MAIN_TABS.map((tab) => tab.id),
) {
  if (Math.abs(translationX) < 64) return null;
  const currentIndex = visibleTabs.indexOf(current);
  if (currentIndex === -1) return null;
  const nextIndex = Math.max(
    0,
    Math.min(
      visibleTabs.length - 1,
      currentIndex + (translationX < 0 ? 1 : -1),
    ),
  );
  return nextIndex === currentIndex
    ? null
    : tabRouteById[visibleTabs[nextIndex]];
}
