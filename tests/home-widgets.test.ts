import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { HOME_WIDGETS } from "../lib/home-widgets";

const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");
const tabs = readFileSync(resolve(process.cwd(), "app/(tabs)/_layout.tsx"), "utf8");

describe("home widgets", () => {
  it("provides a complete, configurable catalog of optional home widgets", () => {
    expect(HOME_WIDGETS.map((widget) => widget.id)).toEqual(["week", "nutrition", "trainingTrend", "metrics", "shortcuts"]);
    expect(home).toContain("useHomeWidgets");
    expect(home).toContain("homeWidgets.order");
  });
  it("exposes each widget toggle in settings and uses the correct exercises tab title", () => {
    expect(settings).toContain("Виджеты на экране «Сегодня»");
    expect(settings).toContain("setWidgetVisible");
    expect(tabs).toContain('title: "УПРАЖНЕНИЯ"');
    expect(tabs).not.toContain('title: "ЖИМ"');
  });
});
