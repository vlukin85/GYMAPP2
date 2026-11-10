import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// AsyncStorage в тестовом окружении отсутствует: подменяем картой в памяти.
const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("инфраструктура локализации RU/EN", () => {
  beforeEach(() => {
    storage.clear();
    vi.resetModules();
  });

  it("по умолчанию отвечает на русском и нормализует неизвестный выбор", async () => {
    const i18n = await import("../lib/i18n");
    expect(i18n.DEFAULT_LANG).toBe("ru");
    expect(i18n.getAppLanguage()).toBe("ru");
    expect(await i18n.loadAppLanguage()).toBe("ru");
    expect(i18n.normalizeLang(undefined)).toBe("ru");
    expect(i18n.normalizeLang("de")).toBe("ru");
    expect(i18n.normalizeLang("en")).toBe("en");
  });

  it("сохраняет выбор языка и переживает перезагрузку хранилища", async () => {
    const i18n = await import("../lib/i18n");
    expect(await i18n.saveAppLanguage("en")).toBe("en");
    expect(storage.get("ironrise.app-language.v1")).toBe("en");
    expect(await i18n.loadAppLanguage()).toBe("en");
    // Нормализация при сохранении: неподдерживаемое значение становится ru.
    expect(await i18n.saveAppLanguage("fr" as never)).toBe("ru");
    expect(storage.get("ironrise.app-language.v1")).toBe("ru");
  });

  it("подставляет плейсхолдеры {name} и переключает язык перевода", async () => {
    const i18n = await import("../lib/i18n");
    expect(i18n.t("settings.strength.stepKg", { step: 2.5 })).toBe("2.5 кг");
    expect(
      i18n.t("settings.offline.progress", { completed: 3, total: 9 }),
    ).toBe("Загружено 3 из 9 фотографий…");
    // Незаполненный плейсхолдер остаётся как есть, а не превращается в undefined.
    expect(i18n.t("settings.strength.stepKg")).toBe("{step} кг");

    await i18n.saveAppLanguage("en");
    expect(i18n.getAppLanguage()).toBe("en");
    expect(i18n.t("settings.strength.stepKg", { step: 2.5 })).toBe("2.5 kg");
    expect(i18n.getT("en")("settings.header.title")).toBe("Settings");
    expect(i18n.getT("ru")("settings.header.title")).toBe("Настройки");
    // Английский с откатом на русский: неизвестный язык = русский словарь.
    expect(i18n.translate("de" as never, "settings.header.title")).toBe(
      "Настройки",
    );
  });

  it("держит одинаковый набор ключей во всех доменах RU и EN", async () => {
    const { RU, EN } = await import("../lib/i18n");
    const ruKeys = Object.keys(RU).sort();
    const enKeys = Object.keys(EN).sort();
    expect(ruKeys.length).toBeGreaterThan(0);
    expect(enKeys).toEqual(ruKeys);
    // Ни одной пустой строки: пропущенный перевод виден сразу.
    for (const key of ruKeys) {
      expect(RU[key as keyof typeof RU]?.trim().length, key).toBeGreaterThan(0);
      expect(EN[key as keyof typeof EN]?.trim().length, key).toBeGreaterThan(0);
    }
    // Ключи плоские и с префиксом домена.
    const prefixes = new Set(ruKeys.map((key) => key.split(".")[0]));
    for (const prefix of prefixes)
      expect(
        ["settings", "workout", "common", "catalog", "programs", "transfer",
          "tabs", "stats", "calendar", "body", "nutrition", "workoutServices"],
        prefix,
      ).toContain(prefix);
  });

  it("держит полноту доменов workout и common", async () => {
    const { RU, EN } = await import("../lib/i18n");
    const workoutKeys = Object.keys(RU).filter((key) =>
      key.startsWith("workout."),
    );
    const commonKeys = Object.keys(RU).filter((key) =>
      key.startsWith("common."),
    );
    // Активная тренировка, итоги, публикация, сравнение, история и отчёт —
    // это сотни подписей; домен не должен «схлопнуться» при слиянии словарей.
    expect(workoutKeys.length).toBeGreaterThan(200);
    expect(commonKeys.length).toBeGreaterThan(40);
    for (const key of [...workoutKeys, ...commonKeys]) {
      expect(EN[key as keyof typeof EN], key).toBeTruthy();
      // Английский перевод не должен остаться русским текстом.
      expect(
        /[А-Яа-яЁё]/.test(EN[key as keyof typeof EN]) && !/[A-Za-z]/.test(EN[key as keyof typeof EN]),
        key,
      ).toBe(false);
    }
    // Реестр знает оба домена.
    const registry = read("lib/i18n/domains/index.ts");
    expect(registry).toContain('from "./workout"');
    expect(registry).toContain('from "./common"');
    expect(registry).toContain("workout,");
    expect(registry).toContain("common,");
  });

  it("переводит подписи общих данных через ключи домена common", () => {
    // Данные вкладок, виджетов и тем живут вне экранов, поэтому у каждого
    // элемента рядом с русским полем лежит ключ словаря.
    const tabs = read("lib/main-tab-preferences.ts");
    expect(tabs).toContain('titleKey: "common.tab.today.title"');
    expect(tabs).toContain('settingsTitleKey: "common.tab.calendar.settingsTitle"');
    expect(tabs).toContain('descriptionKey: "common.tab.stats.description"');

    const widgets = read("lib/home-widgets.tsx");
    expect(widgets).toContain('titleKey: "common.widget.quote.title"');
    expect(widgets).toContain('descriptionKey: "common.widget.metrics.description"');

    const themes = read("lib/app-color-themes.ts");
    expect(themes).toContain('titleKey: "common.theme.editorial.title"');
    expect(themes).toContain('hintKey: "common.theme.darkEnergy.hint"');
  });

  it("держит названия упражнений и программ на обоих языках в данных", () => {
    const data = read("lib/workout-data.ts");
    const expansion = read("lib/catalog-expansion.ts");
    expect(data).toContain("nameEn?: string");
    // Все 140 упражнений каталога и 15 дефолтных программ размечены.
    const dataNameEn = data.match(/nameEn: "/g) ?? [];
    expect(dataNameEn.length).toBe(35);
    const expanded = expansion.match(/"[\w-]+", "[^"]+", "[^"]+", "[^"]+", "[^"]+"\]/g) ?? [];
    expect(expanded.length).toBe(120);
    // Английские названия заполнены, а не продублированы русскими.
    expect(expansion).toContain('"Dumbbell bench press"');
    expect(expansion).toContain('"Kettlebell swing"');
    expect(data).toContain('nameEn: "Barbell squat"');
    expect(data).toContain('nameEn: "Upper body · Strength"');
  });

  it("держит английские названия всех 336 продуктов питания и их категорий", async () => {
    const { popularFoods, foodCategory, foodName, mealLabel, pieceLabelOf, defaultPieceLabel, defaultPieceLabelEn, nutritionCategoryEn } = await import(
      "../lib/nutrition-data"
    );
    const { NUTRITION_NAME_EN, NUTRITION_CATEGORY_EN, NUTRITION_PIECE_LABEL_EN } = await import(
      "../lib/nutrition-names-en"
    );

    // Полнота каталога: у каждого продукта есть английское название и категория.
    expect(popularFoods).toHaveLength(336);
    const missingNames = popularFoods.filter((food) => !food.nameEn?.trim()).map((food) => food.id);
    expect(missingNames).toEqual([]);
    const missingCategories = popularFoods.filter((food) => !food.categoryEn?.trim()).map((food) => food.id);
    expect(missingCategories).toEqual([]);
    expect(Object.keys(NUTRITION_NAME_EN)).toHaveLength(336);
    expect(Object.keys(NUTRITION_CATEGORY_EN)).toHaveLength(24);
    expect(Object.keys(NUTRITION_PIECE_LABEL_EN)).toHaveLength(4);
    // Словарь не дублирует русские названия английскими: латиница в русском
    // названии (BCAA, Поке) допустима, кириллица в английском — нет.
    for (const food of popularFoods) {
      if (/[А-Яа-яЁё]/.test(food.name)) expect(food.nameEn, food.id).not.toBe(food.name);
      expect(/[А-Яа-яЁё]/.test(food.nameEn ?? ""), food.id).toBe(false);
    }

    // Хелперы отображения выбирают язык и не теряют русский вариант.
    const apple = popularFoods.find((food) => food.id === "apple");
    expect(foodName(apple, "ru")).toBe("Яблоко");
    expect(foodName(apple, "en")).toBe("Apple");
    expect(foodCategory(apple, "ru")).toBe("Фрукты");
    expect(foodCategory(apple, "en")).toBe("Fruits");
    expect(nutritionCategoryEn["Мясо и рыба"]).toBe("Meat & fish");
    // Свои продукты пользователя английского варианта не имеют — откат на русский.
    expect(foodName({ name: "Мой продукт" }, "en")).toBe("Мой продукт");

    // Подписи штук и приёмов пищи переключаются языком.
    const yogurt = popularFoods.find((food) => food.id === "yogurt");
    expect(pieceLabelOf(yogurt)).toBe("банка");
    expect(pieceLabelOf(yogurt, "en")).toBe("can");
    expect(pieceLabelOf(null)).toBe(defaultPieceLabel);
    expect(pieceLabelOf(null, "en")).toBe(defaultPieceLabelEn);
    expect(mealLabel("Завтрак", "ru")).toBe("Завтрак");
    expect(mealLabel("Завтрак", "en")).toBe("Breakfast");
    expect(mealLabel("Перекус", "en")).toBe("Snack");
  });

  it("держит английские подписи метрик тела и уровней активности", async () => {
    const {
      BODY_METRICS,
      DAILY_ACTIVITY_LEVELS,
      activityLevelDescription,
      activityLevelTitle,
      bodyMetricLabel,
      bodyMetricShort,
      bodyMetricUnit,
    } = await import("../lib/body-store");

    for (const metric of BODY_METRICS) {
      expect(metric.labelEn?.trim(), metric.id).toBeTruthy();
      expect(metric.unitEn?.trim(), metric.id).toBeTruthy();
      expect(metric.shortEn?.trim(), metric.id).toBeTruthy();
      // Английские подписи не повторяют русские и не содержат кириллицы.
      expect(metric.labelEn, metric.id).not.toBe(metric.label);
      expect(/[А-Яа-яЁё]/.test(`${metric.labelEn}${metric.unitEn}${metric.shortEn}`), metric.id).toBe(false);
    }
    const weight = BODY_METRICS[0];
    expect(bodyMetricLabel(weight, "ru")).toBe("Вес");
    expect(bodyMetricLabel(weight, "en")).toBe("Weight");
    expect(bodyMetricUnit(weight, "en")).toBe("kg");
    expect(bodyMetricShort(weight, "en")).toBe("WEIGHT");

    for (const level of DAILY_ACTIVITY_LEVELS) {
      expect(level.titleEn?.trim(), level.id).toBeTruthy();
      expect(level.descriptionEn?.trim(), level.id).toBeTruthy();
      expect(/[А-Яа-яЁё]/.test(`${level.titleEn}${level.descriptionEn}`), level.id).toBe(false);
    }
    expect(activityLevelTitle(DAILY_ACTIVITY_LEVELS[1], "ru")).toBe("Лёгкий");
    expect(activityLevelTitle(DAILY_ACTIVITY_LEVELS[1], "en")).toBe("Light");
    expect(activityLevelDescription(DAILY_ACTIVITY_LEVELS[1], "en")).toBe(
      "Regular walking and household chores",
    );
  });

  it("переводит справочник каталога: группы мышц, оборудование и стили иллюстраций", async () => {
    const { muscleGroups, exercises, aiExerciseArtStyles } = await import(
      "../lib/workout-data"
    );
    const { artStyleHint, artStyleLabel, equipmentLabel, exerciseName, muscleGroupLabel } = await import(
      "../lib/i18n/exercise-labels"
    );

    // Все группы мышц и всё оборудование каталога имеют английские подписи.
    for (const group of muscleGroups) {
      const en = muscleGroupLabel(group, "en");
      expect(en.trim(), group).toBeTruthy();
      expect(/[А-Яа-яЁё]/.test(en), group).toBe(false);
    }
    expect(muscleGroupLabel("Все", "ru")).toBe("Все");
    expect(muscleGroupLabel("Все", "en")).toBe("All");
    for (const equipment of new Set(exercises.map((exercise) => exercise.equipment))) {
      const en = equipmentLabel(equipment, "en");
      expect(en.trim(), equipment).toBeTruthy();
      expect(/[А-Яа-яЁё]/.test(en), equipment).toBe(false);
    }
    expect(equipmentLabel("Штанга", "ru")).toBe("Штанга");
    expect(equipmentLabel("Штанга", "en")).toBe("Barbell");

    // Каждое упражнение каталога показывает английское название при lang === "en".
    const missing = exercises.filter((exercise) => !exercise.nameEn?.trim()).map((exercise) => exercise.id);
    expect(missing).toEqual([]);
    expect(exerciseName(exercises[0], "en")).toBe(exercises[0].nameEn);
    expect(exerciseName(exercises[0], "ru")).toBe(exercises[0].name);
    // Своё упражнение без перевода откатывается на русское название.
    expect(exerciseName({ name: "Моё упражнение" }, "en")).toBe("Моё упражнение");

    for (const style of aiExerciseArtStyles) {
      expect(artStyleLabel(style, "en"), style.id).not.toBe(style.label);
      expect(artStyleHint(style, "en"), style.id).not.toBe(style.hint);
      expect(artStyleLabel(style, "ru")).toBe(style.label);
    }
  });

  it("регистрирует домены вкладок, каталога, программ, статистики, календаря, тела и питания", () => {
    const registry = read("lib/i18n/domains/index.ts");
    for (const domain of [
      "tabs",
      "catalog",
      "programs",
      "stats",
      "calendar",
      "body",
      "nutrition",
      "transfer",
    ]) {
      expect(registry).toContain(`from "./${domain}"`);
      expect(registry).toContain(`${domain},`);
    }
  });

  it("держит плейсхолдеры доменов совпадающими в RU и EN", async () => {
    const { DOMAINS } = await import("../lib/i18n/domains");
    const placeholders = (template: string) =>
      [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const domain of DOMAINS) {
      for (const [key, ruTemplate] of Object.entries(domain.ru)) {
        const enTemplate = domain.en[key as keyof typeof domain.en];
        expect(enTemplate, key).toBeTruthy();
        expect(placeholders(enTemplate), key).toEqual(placeholders(ruTemplate));
      }
    }
  });

  it("регистрирует домен сервисных текстов тренировки и переводит их", async () => {
    const { RU, EN, getT } = await import("../lib/i18n");
    const registry = read("lib/i18n/domains/index.ts");
    // Домен зарегистрирован: одна строка импорта и одна строка в DOMAINS.
    expect(registry).toContain('from "./workout-services"');
    expect(registry).toContain("workoutServices,");

    const keys = Object.keys(RU).filter((key) =>
      key.startsWith("workoutServices."),
    );
    // Карточка публикации, PDF-отчёт, пост в соцсети, темп кардио и статусы
    // Health Connect — это десятки подписей, домен не должен «схлопнуться».
    expect(keys.length).toBeGreaterThan(50);
    for (const key of keys) {
      const en = EN[key as keyof typeof EN];
      expect(en, key).toBeTruthy();
      // Английский перевод не должен остаться русским текстом.
      expect(/[А-Яа-яЁё]/.test(en) && !/[A-Za-z]/.test(en), key).toBe(false);
    }

    // Сервисные модули берут язык у вызывающего, а не из константы.
    const ru = getT("ru");
    const en = getT("en");
    expect(ru("workoutServices.card.brand")).toBe("IRONRISE · ДОСТИЖЕНИЕ");
    expect(en("workoutServices.card.brand")).toBe("IRONRISE · ACHIEVEMENT");
    expect(ru("workoutServices.cardio.pace", { value: "5:00" })).toBe("5:00 мин/км");
    expect(en("workoutServices.cardio.pace", { value: "5:00" })).toBe("5:00 min/km");
    expect(ru("workoutServices.report.tag")).toBe("ДНЕВНИК ТРЕНИРОВОК");
    expect(en("workoutServices.report.tag")).toBe("WORKOUT JOURNAL");
    expect(ru("workoutServices.healthConnect.unsupported")).toContain("Android");
    expect(en("workoutServices.healthConnect.unsupported")).toContain("Android");

    // Параметр lang у сервисных модулей необязателен: дефолт — русский.
    for (const [path, signature] of [
      ["components/workout-share-card.tsx", "lang = DEFAULT_LANG"],
      ["lib/monthly-report.ts", "lang: Lang = DEFAULT_LANG"],
      ["lib/cardio-metrics.ts", "lang: Lang = DEFAULT_LANG"],
      ["lib/health-connect.ts", "lang: Lang = DEFAULT_LANG"],
      ["lib/heart-rate-analysis.ts", "lang: Lang = DEFAULT_LANG"],
      ["lib/workout-achievements.ts", "lang = DEFAULT_LANG"],
    ] as const) {
      expect(read(path), path).toContain(signature);
    }
  });

  it("описывает для следующих агентов, как добавлять домены", () => {
    const readme = read("lib/i18n/README.md");
    expect(readme).toContain("defineDomain");
    expect(readme).toContain("DOMAINS");
    expect(readme).toContain("useLanguage");
    expect(readme).toContain("ironrise.app-language.v1");
    expect(read("lib/i18n/domains/index.ts")).toContain("settings");
  });

  it("доносит текущий язык до payload'ов нативных уведомлений", () => {
    const workout = read("app/workout.tsx");
    expect(workout).toContain("useLanguage");
    expect(workout).toMatch(/showNativeActiveSetNotification\(\{[\s\S]*?lang,/);
    expect(workout).toMatch(
      /scheduleRestTimerLockScreenNotification\([\s\S]*?lang,/,
    );

    const notifications = read("lib/workout-notifications.ts");
    expect(notifications).toContain("lang: NativeLang");
    expect(notifications).toMatch(/nextAction,\s*lang,/);

    const bridge = read("modules/ironrise-rest-timer/src/index.ts");
    expect(bridge).toContain('export type NativeLang = "ru" | "en"');
    expect(bridge).toContain('lang: payload.lang ?? "ru"');

    const nativeModule = read(
      "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/IronriseRestTimerModule.kt",
    );
    expect(nativeModule).toContain('internal const val EXTRA_LANG = "lang"');
    expect(nativeModule).toContain('payload["lang"] as? String ?: "ru"');
    expect(nativeModule).toContain("RestTimerStrings");

    const actionReceiver = read(
      "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerActionReceiver.kt",
    );
    expect(actionReceiver).toContain("EXTRA_LANG");

    const strings = read(
      "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerStrings.kt",
    );
    // Оба языка на месте, выбор идёт по lang из payload.
    expect(strings).toContain("isEnglishLang");
    expect(strings).toContain('"Завершить подход"');
    expect(strings).toContain('"Finish set"');
    expect(strings).toContain('"Отдых завершён"');
    expect(strings).toContain('"Rest complete"');
  });

  it("держит подписи нижней панели на ключах словаря, а не литералами в layout", () => {
    const layout = read("app/(tabs)/_layout.tsx");
    const tabs = read("lib/main-tab-preferences.ts");
    const tabIds = [
      "today",
      "calendar",
      "exercises",
      "programs",
      "nutrition",
      "stats",
      "body",
      "settings",
    ];
    // Layout берёт перевод из общего хука и показывает t(titleKey) каждой вкладки.
    expect(layout).toContain("useLanguage");
    expect(layout).toContain("TAB_TITLE_KEYS");
    for (const id of tabIds) {
      expect(layout, id).toContain(`title: t(TAB_TITLE_KEYS.${id})`);
      // Русская подпись осталась рядом с ключом в данных вкладок.
      expect(tabs, id).toContain(`titleKey: "common.tab.${id}.title"`);
    }
    // В самом layout русских литералов подписей не осталось: только комментарии.
    const code = layout
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    const cyrillic = code.match(/[А-Яа-яЁё][^\n]{0,60}/g) ?? [];
    expect(cyrillic, cyrillic.join(" | ")).toEqual([]);
  });

  it("держит английские описания всех 15 дефолтных программ и форматтеры с языком", async () => {
    const {
      defaultPrograms,
      formatDuration,
      formatProgramCreatedAt,
      formatProgramDuration,
      programDescription,
    } = await import("../lib/workout-data");

    expect(defaultPrograms).toHaveLength(15);
    for (const program of defaultPrograms) {
      expect(program.descriptionEn?.trim(), program.id).toBeTruthy();
      // Английское описание не повторяет русское и не содержит кириллицы.
      expect(program.descriptionEn, program.id).not.toBe(program.description);
      expect(/[А-Яа-яЁё]/.test(program.descriptionEn ?? ""), program.id).toBe(
        false,
      );
      expect(programDescription(program, "ru"), program.id).toBe(
        program.description,
      );
      expect(programDescription(program, "en"), program.id).toBe(
        program.descriptionEn,
      );
    }
    // Своя программа без перевода откатывается на русское описание.
    expect(programDescription({ description: "Моя программа" }, "en")).toBe(
      "Моя программа",
    );

    // Длительность и дата создания переключаются языком; без языка — по-русски.
    expect(formatDuration(67)).toBe("1 ч 7 мин");
    expect(formatDuration(67, "en")).toBe("1 h 7 min");
    expect(formatProgramCreatedAt("2026-08-14T12:00:00.000Z")).toContain(
      "Создано",
    );
    expect(formatProgramCreatedAt("2026-08-14T12:00:00.000Z", "en")).toContain(
      "Created",
    );
    expect(formatProgramDuration(522)).toBe("8 мин 42 сек");
    expect(formatProgramDuration(522, "en")).toBe("8 min 42 sec");
    expect(formatProgramDuration(60, "en")).toBe("1 min");
  });

  it("передаёт язык в общие шторки изображений и в разбор файлов обмена", async () => {
    // Сервисные модули и общие шторки принимают необязательный lang:
    // без него текст остаётся русским, поэтому прежние вызовы не меняются.
    for (const [path, signature] of [
      ["components/media-picker-sheet.tsx", "lang = DEFAULT_LANG"],
      ["components/image-crop-sheet.tsx", "lang = DEFAULT_LANG"],
      ["lib/user-media.ts", "lang: Lang = DEFAULT_LANG"],
      ["lib/nutrition-product-media.ts", "lang: Lang = DEFAULT_LANG"],
      ["lib/body-progress-media.ts", "lang: Lang = DEFAULT_LANG"],
      ["lib/program-exchange.ts", "lang: Lang = DEFAULT_LANG"],
    ] as const) {
      expect(read(path), path).toContain(signature);
    }
    // Вызывающие экраны прокидывают язык из useLanguage().
    expect(read("app/(tabs)/programs.tsx")).toContain(
      "parseProgramExchange(content, programs, lang)",
    );
    expect(read("app/(tabs)/programs.tsx")).toContain("lang={lang}");
    expect(read("app/(tabs)/nutrition.tsx")).toContain(
      "pickFoodProductPhotoFromLibrary(lang)",
    );
    expect(read("app/(tabs)/nutrition.tsx")).toContain(
      "captureFoodProductPhoto(lang)",
    );
    expect(read("app/exercise/[id].tsx")).toContain("lang={lang}");
    expect(read("app/(tabs)/body.tsx")).toContain(
      "pickAndPersistBodyProgressPhoto(measurement.id, lang)",
    );

    // Метки ракурсов пользователя магазин хранит по-русски, а показывает через
    // перевод при отображении — данные не переписываются.
    expect(read("lib/workout-store.tsx")).toContain(
      "label: `Моё фото ${gallery.length + 1}`",
    );
    const { userPhotoLabel } = await import("../lib/i18n/exercise-labels");
    expect(userPhotoLabel("Моё изображение", "ru")).toBe("Моё изображение");
    expect(userPhotoLabel("Моё изображение", "en")).toBe("My image");
    expect(userPhotoLabel("Моё фото 2", "ru")).toBe("Моё фото 2");
    expect(userPhotoLabel("Моё фото 2", "en")).toBe("My photo 2");
    // Служебные подписи каталога не подменяются.
    expect(userPhotoLabel("Техника", "en")).toBe("Техника");
  });

  it("переводит библиотеку обложек программ и подписи кандидатов изображения", async () => {
    const {
      candidateLabel,
      illustrationLibraryLabel,
    } = await import("../lib/i18n/exercise-labels");
    const {
      exercises,
      getExerciseIllustrationCandidates,
      programCoverIllustrationLibrary,
    } = await import("../lib/workout-data");

    // Обложки программ: русская подпись осталась в данных, рядом labelEn.
    expect(programCoverIllustrationLibrary.map((item) => item.label)).toEqual([
      "Сила",
      "Объём",
      "Full Body",
      "Выносливость",
    ]);
    expect(
      programCoverIllustrationLibrary.map((item) =>
        illustrationLibraryLabel(item, "ru"),
      ),
    ).toEqual(["Сила", "Объём", "Full Body", "Выносливость"]);
    expect(
      programCoverIllustrationLibrary.map((item) =>
        illustrationLibraryLabel(item, "en"),
      ),
    ).toEqual(["Strength", "Volume", "Full body", "Endurance"]);
    // Запись без labelEn переводится по id, незнакомый id — остаётся русским.
    expect(
      illustrationLibraryLabel({ id: "volume", label: "Объём" }, "en"),
    ).toBe("Volume");
    expect(
      illustrationLibraryLabel({ id: "custom", label: "Своя" }, "en"),
    ).toBe("Своя");

    // Кандидаты изображения упражнения: русская подпись не переименована,
    // английская берётся из labelEn.
    const bench = exercises.find((exercise) => exercise.id === "bench-press")!;
    const candidates = getExerciseIllustrationCandidates(bench);
    const openPhoto = candidates.find(
      (candidate) => candidate.id === "open-photo-bench-press",
    )!;
    expect(openPhoto.label).toBe("Открытое фото упражнения · free-exercise-db");
    expect(openPhoto.labelEn).toBe("Open exercise photo · free-exercise-db");
    expect(candidateLabel(openPhoto, "ru")).toBe(openPhoto.label);
    expect(candidateLabel(openPhoto, "en")).toBe(
      "Open exercise photo · free-exercise-db",
    );
    // Подписи без labelEn узнаются по русскому тексту: старые сохранённые
    // кандидаты и подпись группы с названием группы.
    expect(candidateLabel({ label: "Иллюстрация упражнения" }, "en")).toBe(
      "Exercise illustration",
    );
    expect(candidateLabel({ label: "Техника" }, "en")).toBe("Technique");
    expect(
      candidateLabel({ label: "AI-иллюстрация группы: Грудь" }, "en"),
    ).toBe("AI group illustration: Chest");
    expect(candidateLabel({ label: "Моё изображение" }, "en")).toBe(
      "Моё изображение",
    );

    // Подпись главного ракурса тоже переведена, а русская осталась «Техника».
    expect(bench.photoAngles?.[0].label).toBe("Техника");
    expect(bench.photoAngles?.[0].labelEn).toBe("Technique");

    // Точки рендера берут подписи через хелперы, а не показывают русские поля.
    expect(read("app/(tabs)/programs.tsx")).toContain(
      "illustrationLibraryLabel(item, lang)",
    );
    expect(read("app/exercise/[id].tsx")).toContain(
      "candidateLabel(candidate, lang)",
    );
    expect(read("app/exercise/[id].tsx")).toContain(
      "userPhotoLabel(candidateLabel(photo, lang), lang)",
    );
  });

  it("держит экраны вкладок без русских литералов в интерфейсе", () => {
    // Подписи вкладок живут в словарях доменов, поэтому в самих экранах
    // кириллица допустима только в комментариях и в служебных значениях
    // данных каталога (типы приёмов пищи, категория «Мои продукты», формы
    // штук, группа «Все», оборудование по умолчанию).
    const screens = [
      "app/(tabs)/index.tsx",
      "app/(tabs)/stats.tsx",
      "app/(tabs)/calendar.tsx",
      "app/(tabs)/body.tsx",
      "app/(tabs)/nutrition.tsx",
      "app/(tabs)/programs.tsx",
      "app/(tabs)/exercises.tsx",
      "components/body-visuals.tsx",
    ];
    const dataLiterals = [
      '"Все"',
      '"Мои продукты"',
      '"Завтрак"',
      '"Обед"',
      '"Ужин"',
      '"Перекус"',
      '"Тренажёр"',
      '"штука"',
      '"банка"',
      '"стакан"',
      '"порция"',
    ];
    // Комментарии и значения данных вырезаем: остаются только строки UI.
    const uiSource = (source: string) => {
      let code = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      for (const literal of dataLiterals) code = code.split(literal).join('""');
      return code;
    };
    for (const path of screens) {
      const code = uiSource(read(path));
      const cyrillic = code.match(/[А-Яа-яЁё][^\n]{0,60}/g) ?? [];
      expect(cyrillic, `${path}: ${cyrillic.join(" | ")}`).toEqual([]);
      // Каждый экран берёт перевод из общего хука и локаль из выбранного языка.
      expect(read(path), path).toContain("useLanguage");
    }
    for (const path of [
      "app/(tabs)/index.tsx",
      "app/(tabs)/stats.tsx",
      "app/(tabs)/calendar.tsx",
      "app/(tabs)/body.tsx",
      "app/(tabs)/nutrition.tsx",
      "app/(tabs)/programs.tsx",
      "app/(tabs)/exercises.tsx",
    ]) {
      expect(read(path), path).toContain('lang === "en" ? "en-US" : "ru-RU"');
    }
  });

  it("монтирует провайдер языка в корневом layout и не монтирует заставку", () => {
    const layout = read("app/_layout.tsx");
    expect(layout).toContain("LanguageProvider");
    expect(layout).not.toContain("HydrationGate");
    expect(
      existsSync(resolve(process.cwd(), "components/hydration-gate.tsx")),
    ).toBe(false);
    // Полнокадровый арт заставки больше не используется.
    expect(read("app.config.ts")).not.toContain("splash-full-");
    expect(
      existsSync(resolve(process.cwd(), "assets/images/splash-full-dark.png")),
    ).toBe(false);
    expect(
      existsSync(resolve(process.cwd(), "assets/images/splash-full-light.png")),
    ).toBe(false);
  });
});
