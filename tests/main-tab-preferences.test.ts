import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAIN_TAB_PREFERENCES,
  DEFAULT_MAIN_TAB_VISIBILITY,
  MAIN_TABS,
  normalizeMainTabPreferences,
  normalizeMainTabVisibility,
} from "../lib/main-tab-preferences";

const settings = readFileSync(
  resolve(process.cwd(), "app/settings.tsx"),
  "utf8",
);
const tabs = readFileSync(
  resolve(process.cwd(), "app/(tabs)/_layout.tsx"),
  "utf8",
);
const swipe = readFileSync(
  resolve(process.cwd(), "components/main-tab-swipe.tsx"),
  "utf8",
);
const tabBar = readFileSync(
  resolve(process.cwd(), "components/ordered-main-tab-bar.tsx"),
  "utf8",
);

describe("main tab preferences", () => {
  it("keeps Главноe, План and Настройки required while all other main tabs remain optional", () => {
    expect(
      MAIN_TABS.filter((tab) => tab.required).map((tab) => tab.id),
    ).toEqual(["today", "calendar", "settings"]);
    expect(DEFAULT_MAIN_TAB_VISIBILITY).toEqual({
      today: true,
      calendar: true,
      exercises: true,
      programs: true,
      nutrition: true,
      stats: true,
      body: true,
      settings: true,
    });
  });

  it("does not allow persisted preferences to hide required tabs", () => {
    expect(
      normalizeMainTabVisibility({
        today: false,
        calendar: false,
        exercises: false,
        settings: false,
      }),
    ).toMatchObject({
      today: true,
      calendar: true,
      exercises: false,
      settings: true,
    });
  });

  it("normalizes stored order and compact mode while retaining every tab exactly once", () => {
    expect(DEFAULT_MAIN_TAB_PREFERENCES.order).toEqual(
      MAIN_TABS.map((tab) => tab.id),
    );
    expect(
      normalizeMainTabPreferences({
        order: ["body", "body", "today"],
        compact: true,
      }),
    ).toMatchObject({
      order: [
        "body",
        "today",
        "calendar",
        "exercises",
        "programs",
        "nutrition",
        "stats",
        "settings",
      ],
      compact: true,
    });
  });

  it("exposes tab visibility in settings and excludes hidden tabs from bottom navigation and swipes", () => {
    expect(settings).toContain("Вкладки в нижней панели");
    expect(settings).toContain("setTabVisible");
    expect(settings).toContain("ПОКАЗАТЬ ВСЕ ВКЛАДКИ");
    expect(settings).toContain("Компактный режим");
    expect(settings).toContain("moveTab");
    expect(settings).toContain("Тяните маркер ⠿");
    expect(tabs).toContain("useMainTabPreferences");
    expect(tabs).toContain("OrderedMainTabBar");
    expect(tabs).toContain('href: showTab("exercises") ? undefined : null');
    expect(tabBar).toContain("LayoutAnimation.configureNext");
    expect(tabBar).toContain("Animated.timing(height");
    expect(tabBar).toContain("!compact &&");
    expect(swipe).toContain("visibleTabs");
    expect(swipe).toMatch(
      /getAdjacentMainTab\(\s*current,\s*event\.translationX,\s*visibleTabs,?\s*\)/,
    );
  });
});
