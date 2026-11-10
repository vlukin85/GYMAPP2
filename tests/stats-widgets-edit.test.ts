import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_STATS_WIDGETS,
  STATS_WIDGETS,
  STATS_WIDGETS_STORAGE_KEY,
  normalizeStoredStatsWidgets,
} from "../lib/stats-widgets-storage";

const screen = readFileSync(resolve(process.cwd(), "app/(tabs)/stats.tsx"), "utf8") + readFileSync(resolve(process.cwd(), "lib/i18n/domains/stats.ts"), "utf8");
const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8") + readFileSync(resolve(process.cwd(), "lib/i18n/domains/tabs.ts"), "utf8");

describe("stats widgets edit mode", () => {
  it("declares the manageable stats widget catalog in the on-screen order", () => {
    expect(STATS_WIDGETS.map((widget) => widget.id)).toEqual([
      "summary",
      "comparison",
      "oneRm",
      "cardio",
      "activity",
      "progress",
      "records",
    ]);
    expect(DEFAULT_STATS_WIDGETS.order).toEqual(STATS_WIDGETS.map((widget) => widget.id));
    expect(DEFAULT_STATS_WIDGETS.hidden).toEqual([]);
    expect(DEFAULT_STATS_WIDGETS.dragHintSeen).toBe(false);
  });

  it("stores widget order and hidden set under a dedicated storage key", () => {
    expect(STATS_WIDGETS_STORAGE_KEY).toBe("gym-diary-stats-widgets-v1");
    expect(screen).toContain("loadStatsWidgets");
    expect(screen).toContain("saveStatsWidgets");
    const restored = normalizeStoredStatsWidgets(
      { order: ["records", "summary"], hidden: ["cardio"] },
      DEFAULT_STATS_WIDGETS,
    );
    expect(restored.order).toEqual(["records", "summary", "comparison", "oneRm", "cardio", "activity", "progress"]);
    expect(restored.hidden).toEqual(["cardio"]);
    expect(normalizeStoredStatsWidgets(null, DEFAULT_STATS_WIDGETS)).toEqual(DEFAULT_STATS_WIDGETS);
    expect(normalizeStoredStatsWidgets({ order: ["bogus"], hidden: ["also-bogus"] }, DEFAULT_STATS_WIDGETS)).toEqual(DEFAULT_STATS_WIDGETS);
  });

  it("toggles an edit mode from the stats header", () => {
    expect(screen).toContain("Редактировать");
    expect(screen).toContain("Готово");
    expect(screen).toContain("editMode");
    expect(screen).toContain("editButton");
  });

  it("wraps stats cards into draggable shells reusing the home drag pattern", () => {
    expect(screen).toContain("DraggableStatsWidget");
    expect(screen).toContain("PanResponder.create");
    expect(screen).toContain("Animated.timing(lift");
    expect(screen).toContain("LayoutAnimation.configureNext");
    expect(screen).toContain("previewStatsWidgetMove");
    expect(screen).toContain("Перетащить виджет");
    expect(screen).toContain("accessibilityRole=\"adjustable\"");
  });

  it("reuses the shared drag haptics setting from the home widgets", () => {
    expect(screen).toContain("useHomeWidgets");
    expect(screen).toContain("dragHapticsEnabled");
    expect(screen).toContain("AndroidHaptics.Drag_Start");
  });

  it("shows a one-time drag hint following the home DragHint pattern", () => {
    expect(screen).toContain("StatsDragHint");
    expect(screen).toContain("Перемещайте виджеты");
    expect(screen).toContain("ПОНЯТНО");
    expect(screen).toContain("dragHintSeen");
  });

  it("lists hidden widgets with a per-widget restore action", () => {
    expect(screen).toContain("Скрытые виджеты");
    expect(screen).toContain("restoreStatsWidget");
    expect(screen).toContain("Вернуть");
    expect(screen).toContain("hideStatsWidget");
  });

  it("persists the new widget order after dragging", () => {
    expect(screen).toContain("finishStatsWidgetDrag");
    expect(screen).toContain("placeableWidgetIds");
    expect(screen).toContain("visibleWidgetIds");
  });

  it("keeps the home screen drag implementation untouched", () => {
    expect(home).toContain("DraggableHomeWidget");
    expect(home).toContain("homeWidgets.moveWidget");
    expect(home).toContain("WidgetDragHint");
  });
});
