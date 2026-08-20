import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DEFAULT_HOME_WIDGETS, HOME_WIDGETS } from "../lib/home-widgets";

const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");
const tabs = readFileSync(resolve(process.cwd(), "app/(tabs)/_layout.tsx"), "utf8");

describe("home widgets", () => {
  it("provides a complete, configurable catalog of optional home widgets", () => {
    expect(HOME_WIDGETS.map((widget) => widget.id)).toEqual(["quote", "week", "nutrition", "trainingTrend", "metrics", "shortcuts"]);
    expect(home).toContain("useHomeWidgets");
    expect(home).toContain("homeWidgets.order");
    expect(DEFAULT_HOME_WIDGETS.dragHintSeen).toBe(false);
  });
  it("exposes each widget toggle in settings and uses the correct exercises tab title", () => {
    expect(settings).toContain("Виджеты на экране «Сегодня»");
    expect(settings).toContain("setWidgetVisible");
    expect(tabs).toContain('title: "УПРАЖНЕНИЯ"');
    expect(tabs).not.toContain('title: "ЖИМ"');
  });
  it("supports reordering directly on the home screen and positions the vertical motto safely", () => {
    expect(home).toContain("PanResponder.create");
    expect(home).toContain("homeWidgets.moveWidget");
    expect(home).toContain("Перетащить виджет");
    expect(home).toContain('top: 166');
  });

  it("animates adjacent widgets and elevates the active widget while reordering", () => {
    expect(home).toContain("LayoutAnimation.configureNext");
    expect(home).toContain("previewWidgetMove");
    expect(home).toContain("Animated.timing(lift");
    expect(home).toContain("translateY");
    expect(home).toContain("scale");
  });

  it("provides a one-time drag hint and native feedback when a widget is grabbed", () => {
    expect(home).toContain("performAndroidHapticsAsync");
    expect(home).toContain("AndroidHaptics.Drag_Start");
    expect(home).toContain("Перемещайте виджеты");
    expect(home).toContain("ПОНЯТНО");
    expect(home).toContain("dismissWidgetDragHint");
  });
});
