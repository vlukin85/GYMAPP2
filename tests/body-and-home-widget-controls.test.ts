import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { BODY_METRICS } from "../lib/body-store";
import { DEFAULT_HOME_WIDGETS, HOME_WIDGETS } from "../lib/home-widgets";
import { getAdjacentMainTab, getMainTabIdFromPathname } from "../lib/main-tab-navigation";

const bodyScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/body.tsx"), "utf8");
const bodyVisuals = readFileSync(resolve(process.cwd(), "components/body-visuals.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");
const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const bodyStore = readFileSync(resolve(process.cwd(), "lib/body-store.tsx"), "utf8");

describe("body tracking and home widget controls", () => {
  it("tracks weight and the core circumference measurements locally", () => {
    expect(BODY_METRICS.map((metric) => metric.id)).toEqual(["weightKg", "bodyFatPct", "chestCm", "waistCm", "hipsCm", "upperArmCm", "thighCm"]);
    expect(bodyScreen).toContain("СОХРАНИТЬ ЗАМЕР");
    expect(bodyScreen).toContain("removeMeasurement");
  });
  it("contains a data-backed chart and silhouette with current body labels", () => {
    expect(bodyVisuals).toContain("BodyMetricChart");
    expect(bodyVisuals).toContain("BodySilhouette");
    expect(bodyVisuals).toContain("Polyline");
    expect(bodyVisuals).toContain("КАРТА ЗАМЕРОВ");
  });
  it("persists the selected body profile and renders distinct silhouette variants", () => {
    expect(bodyStore).toContain('type BodyProfile = "male" | "female"');
    expect(bodyStore).toContain("ironrise.body-profile.v1");
    expect(settings).toContain("Силуэт и расчёты");
    expect(bodyVisuals).toContain('profile === "female"');
    expect(bodyVisuals).toContain("ЖЕНСКИЙ ПРОФИЛЬ");
    expect(bodyVisuals).toContain("МУЖСКОЙ ПРОФИЛЬ");
    expect(bodyVisuals).toContain("body-silhouette-female.png");
    expect(bodyVisuals).toContain("body-silhouette-male.png");
    expect(bodyVisuals).toContain("Реалистичный женский силуэт тела");
    expect(bodyVisuals).toContain("Реалистичный мужской силуэт тела");
  });
  it("adds the body tab to swipe navigation", () => {
    expect(getMainTabIdFromPathname("/body")).toBe("body");
    expect(getAdjacentMainTab("stats", -72)).toBe("/(tabs)/body");
  });
  it("persists default order and compact modes while exposing drag reset controls", () => {
    expect(DEFAULT_HOME_WIDGETS.order).toEqual(HOME_WIDGETS.map((widget) => widget.id));
    expect(Object.values(DEFAULT_HOME_WIDGETS.compact).every((value) => value === false)).toBe(true);
    expect(settings).toContain("moveWidget");
    expect(settings).toContain("resetWidgets");
    expect(settings).toContain("PanResponder");
    expect(home).toContain("homeWidgets.order");
  });
});
