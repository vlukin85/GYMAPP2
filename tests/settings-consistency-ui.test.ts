import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Русские подписи экрана настроек живут в словаре домена settings,
// поэтому экран проверяется вместе со своим словарём локализации.
const settings =
  readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8") +
  readFileSync(
    resolve(process.cwd(), "lib/i18n/domains/settings.ts"),
    "utf8",
  );

describe("settings visual system", () => {
  it("keeps drag feedback controllable from widget settings", () => {
    expect(settings).toContain("Виброотклик при переносе");
    expect(settings).toContain("setWidgetDragHapticsEnabled");
    expect(settings).toContain("widgetFeedbackRow");
  });

  it("uses a unified editorial grid and type scale across settings cards", () => {
    expect(settings).toMatch(
      /sectionTitle:\s*{\s*fontSize:\s*15,\s*fontWeight:\s*"900"/,
    );
    expect(settings).toMatch(
      /iconThemeCard:\s*{\s*borderWidth:\s*1,\s*borderRadius:\s*0,\s*borderLeftWidth:\s*5/,
    );
    expect(settings).toMatch(
      /restSoundCard:\s*{\s*borderWidth:\s*1,\s*borderRadius:\s*0,\s*borderLeftWidth:\s*5/,
    );
    expect(settings).toMatch(
      /notificationCard:\s*{\s*borderWidth:\s*1,\s*borderRadius:\s*0,\s*borderLeftWidth:\s*5/,
    );
    expect(settings).toMatch(
      /storageCard:\s*{\s*borderWidth:\s*1,\s*borderRadius:\s*0,\s*borderLeftWidth:\s*5/,
    );
    expect(settings).toMatch(
      /offlineCard:\s*{\s*borderWidth:\s*1,\s*borderRadius:\s*0,\s*borderLeftWidth:\s*5/,
    );
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

  it("позволяет предпрослушать выбранный сигнал окончания отдыха", () => {
    expect(settings).toContain("Сигнал завершения");
    expect(settings).toContain("Предпрослушать сигнал");
    expect(settings).toContain("Женский голос");
    expect(settings).toContain("Мужской голос");
    expect(settings).toContain("Сирена");
    expect(settings).toContain("previewRestCompletionSound");
    // Предпрослушивание играет через expo-audio (тот же путь, что сигнал
    // в приложении) и учитывает громкость: нативный RingtoneManager на
    // части устройств молча не проигрывает raw-ресурсы.
    expect(settings).not.toContain("previewNativeRestCompletionSound");
    expect(settings).toContain("playsInSilentMode: true");
  });

  it("содержит ползунок громкости и явную настройку вибрации для сигнала завершения", () => {
    expect(settings).toContain("Громкость сигнала");
    expect(settings).toContain("CompletionVolumeSlider");
    expect(settings).toContain("Вибрация вместе со звуком");
    expect(settings).toContain("restTimerCompletionVolume");
  });

  it("позволяет выбрать паттерн вибрации завершения отдыха", () => {
    expect(settings).toContain("Паттерн вибрации");
    expect(settings).toContain("Короткая");
    expect(settings).toContain("Длинная");
    expect(settings).toContain("Пульсирующая");
    expect(settings).toContain("restTimerVibrationPattern");
  });

  it("даёт переключить язык RU/EN в самом верху настроек", () => {
    // Блок языка — первая карточка основных настроек: он выше первой секции
    // и использует тот же редакционный стиль карточек.
    expect(settings).toContain("LANGUAGE_OPTIONS");
    expect(settings).toContain("useLanguage");
    expect(settings).toContain("styles.languageCard");
    expect(settings).toContain('t("settings.language.sectionTitle")');
    expect(settings).toContain("setLang(option.id)");
    expect(settings).toMatch(
      /languageCard:\s*{\s*borderWidth:\s*1,\s*borderRadius:\s*0,\s*borderLeftWidth:\s*5/,
    );
    // Оба языка присутствуют в словаре и подписаны на самих языках.
    expect(settings).toContain('"settings.language.optionRu": "Русский"');
    expect(settings).toContain('"settings.language.optionEn": "English"');
    const languageBlock = settings.indexOf("styles.languageCard");
    const firstSection = settings.indexOf('isSectionVisible("training")');
    expect(languageBlock).toBeGreaterThan(-1);
    expect(firstSection).toBeGreaterThan(languageBlock);
  });

  it("показывает логотип и версию приложения в разделе «О приложении»", () => {
    expect(settings).toContain("О приложении");
    expect(settings).toContain("ironrise-shield-badge");
    expect(settings).toMatch(/aboutCard:\s*{\s*borderWidth:\s*1,\s*borderRadius:\s*0,\s*borderLeftWidth:\s*5/);
    expect(settings).toMatch(/aboutLogo:\s*{\s*width:\s*60,\s*height:\s*60\s*}/);
    expect(settings).toContain("Версия");
    expect(settings).toContain("Constants.expoConfig?.version");
  });
});
