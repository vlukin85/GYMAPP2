import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");

describe("settings visual system", () => {
  it("keeps drag feedback controllable from widget settings", () => {
    expect(settings).toContain("Виброотклик при переносе");
    expect(settings).toContain("setWidgetDragHapticsEnabled");
    expect(settings).toContain("widgetFeedbackRow");
  });

  it("uses a unified editorial grid and type scale across settings cards", () => {
    expect(settings).toContain('sectionTitle: { fontSize: 15, fontWeight: "900"');
    expect(settings).toContain('iconThemeCard: { borderWidth: 1, borderRadius: 0, borderLeftWidth: 5');
    expect(settings).toContain('restSoundCard: { borderWidth: 1, borderRadius: 0, borderLeftWidth: 5');
    expect(settings).toContain('notificationCard: { borderWidth: 1, borderRadius: 0, borderLeftWidth: 5');
    expect(settings).toContain('storageCard: { borderWidth: 1, borderRadius: 0, borderLeftWidth: 5');
    expect(settings).toContain('offlineCard: { borderWidth: 1, borderRadius: 0, borderLeftWidth: 5');
  });

  it("groups settings into navigable categories and exposes a focused parameter search", () => {
    expect(settings).toContain("SETTINGS_CATEGORIES");
    expect(settings).toContain("Тренировка");
    expect(settings).toContain("Главный экран");
    expect(settings).toContain("Питание и тело");
    expect(settings).toContain("Поиск настроек");
    expect(settings).toContain("isSectionVisible");
    expect(settings).toContain("Ничего не найдено");
  });

  it("keeps lock-screen heart-rate visibility under explicit local privacy control", () => {
    expect(settings).toContain("Пульс на экране блокировки");
    expect(settings).toContain("loadLockScreenHeartRateVisible");
    expect(settings).toContain("saveLockScreenHeartRateVisible");
  });
});
