import { defineDomain } from "../types";

// Домен «Общие данные интерфейса»: подписи, которые живут не в экранах, а в
// общих структурах и показываются сразу на нескольких экранах.
//
//   MAIN_TABS          (lib/main-tab-preferences.ts) — нижняя панель вкладок,
//                      экран «Сегодня» и настройки → settings.tsx;
//   HOME_WIDGETS       (lib/home-widgets.tsx) — виджеты экрана «Сегодня» и
//                      редактор виджетов в настройках;
//   APP_COLOR_THEMES   (lib/app-color-themes.ts) — варианты оформления в
//                      настройках и на главном экране.
//
// В элементах этих структур рядом с русскими полями лежат ключи
// titleKey/settingsTitleKey/descriptionKey/hintKey — экран показывает
// t(item.titleKey). Русские поля оставлены для совместимости: экраны, которые
// ещё не переведены, продолжают их читать.
//
// Ключи плоские: "common.<структура>.<элемент>.<смысл>". Наборы ключей ru и en
// совпадают — это проверяет defineDomain и tests/i18n.test.ts.
export const common = defineDomain({
  ru: {
    "common.tab.today.title": "ГЛАВНОЕ",
    "common.tab.today.settingsTitle": "Главное",
    "common.tab.today.description": "Экран на сегодня и виджеты",
    "common.tab.calendar.title": "ПЛАН",
    "common.tab.calendar.settingsTitle": "План",
    "common.tab.calendar.description": "Календарь и расписание тренировок",
    "common.tab.exercises.title": "УПРАЖНЕНИЯ",
    "common.tab.exercises.settingsTitle": "Упражнения",
    "common.tab.exercises.description": "Каталог и техника выполнения",
    "common.tab.programs.title": "ПРОГРАММЫ",
    "common.tab.programs.settingsTitle": "Программы",
    "common.tab.programs.description": "Сохранённые планы тренировок",
    "common.tab.nutrition.title": "ПИТАНИЕ",
    "common.tab.nutrition.settingsTitle": "Питание",
    "common.tab.nutrition.description": "Дневник калорий и БЖУ",
    "common.tab.stats.title": "ПРОГРЕСС",
    "common.tab.stats.settingsTitle": "Прогресс",
    "common.tab.stats.description": "Статистика и личные рекорды",
    "common.tab.body.title": "ТЕЛО",
    "common.tab.body.settingsTitle": "Тело",
    "common.tab.body.description": "Замеры, цели и динамика",
    "common.tab.settings.title": "НАСТРОЙКИ",
    "common.tab.settings.settingsTitle": "Настройки",
    "common.tab.settings.description": "Параметры IronRise",

    "common.widget.quote.title": "Цитата дня",
    "common.widget.quote.description": "Ежедневная мотивационная цитата спортсмена",
    "common.widget.week.title": "Неделя",
    "common.widget.week.description": "План и статус тренировок на текущей неделе",
    "common.widget.nutrition.title": "Питание",
    "common.widget.nutrition.description": "Дневной прогресс калорий и БЖУ",
    "common.widget.trainingTrend.title": "График тренировок",
    "common.widget.trainingTrend.description": "Объём завершённых тренировок",
    "common.widget.metrics.title": "Сводные показатели",
    "common.widget.metrics.description": "Количество тренировок, объём и время",
    "common.widget.shortcuts.title": "Быстрый доступ",
    "common.widget.shortcuts.description": "Кнопки календаря и каталога упражнений",

    "common.theme.editorial.title": "IronRise Editorial",
    "common.theme.editorial.hint": "Плакатный кремовый, красный и синий",
    "common.theme.orchid.title": "Orchid Voltage",
    "common.theme.orchid.hint": "Электрический фиолетовый",
    "common.theme.violet.title": "Фиолетовый",
    "common.theme.violet.hint": "Фирменный IronRise",
    "common.theme.rose.title": "Розовый импульс",
    "common.theme.rose.hint": "Яркий и энергичный",
    "common.theme.ocean.title": "Океан",
    "common.theme.ocean.hint": "Холодный фокус",
    "common.theme.forest.title": "Лесной ритм",
    "common.theme.forest.hint": "Спокойная сила",
    "common.theme.sunset.title": "Закат",
    "common.theme.sunset.hint": "Тёплая энергия",
    "common.theme.midnight.title": "Полночь",
    "common.theme.midnight.hint": "Контрастная тёмная",
    "common.theme.darkEnergy.title": "Тёмный атлет",
    "common.theme.darkEnergy.hint": "Графит и лайм — фирменная энергия",
    "common.theme.lightMinimal.title": "Светлый минимализм",
    "common.theme.lightMinimal.hint": "Воздух, белые карточки, изумрудный акцент",
    "common.theme.boldNeon.title": "Bold Neon",
    "common.theme.boldNeon.hint": "Градиенты и неон для энергичных тренировок",

    // Общие сервисные модули и шторки, которые открываются с разных экранов:
    // выбор изображения (обложка программы, фото упражнения), кадрирование
    // (обложка, фото упражнения, фото продукта) и проверка файла.
    "common.duration.hours": "ч",
    "common.duration.minutes": "мин",
    "common.duration.seconds": "сек",
    "common.userMedia.unsupported":
      "Выберите изображение JPG, PNG, WEBP или HEIC размером до 8 МБ.",

    "common.mediaPicker.eyebrow": "ИЗОБРАЖЕНИЕ",
    "common.mediaPicker.hint":
      "Выберите готовую иллюстрацию или загрузите JPG, PNG, WEBP либо HEIC до 8 МБ. Перед сохранением можно обрезать изображение.",
    "common.mediaPicker.current": "Текущее изображение",
    "common.mediaPicker.upload": "Загрузить из устройства",
    "common.mediaPicker.uploadBusy": "Открываем файлы…",
    "common.mediaPicker.libraryTitle": "Готовые иллюстрации",
    "common.mediaPicker.done": "Готово",
    "common.mediaPicker.pickFailedTitle": "Не удалось загрузить изображение",
    "common.mediaPicker.pickFailedFallback": "Попробуйте выбрать другой файл.",

    "common.imageCrop.eyebrow": "КАДРИРОВАНИЕ",
    "common.imageCrop.title": "Подготовьте изображение",
    "common.imageCrop.presetOriginal": "Полный",
    "common.imageCrop.presetSquareHint": "Карточка",
    "common.imageCrop.presetLandscapeHint": "Обложка",
    "common.imageCrop.presetOriginalHint": "Без обрезки",
    "common.imageCrop.badgeOriginal": "Исходный кадр",
    "common.imageCrop.hintOriginal": "Изображение сохранится без обрезки.",
    "common.imageCrop.hintCrop":
      "Перемещайте рамку одним пальцем и масштабируйте её двумя пальцами. Исходный файл не изменяется.",
    "common.imageCrop.reset": "Сбросить положение и масштаб",
    "common.imageCrop.cancel": "Отмена",
    "common.imageCrop.save": "Сохранить кадр",
    "common.imageCrop.saving": "Сохраняем…",
    "common.imageCrop.failedTitle": "Не удалось обработать изображение",
    "common.imageCrop.failedMessage":
      "Попробуйте другой файл или выберите полный кадр.",
  },
  en: {
    "common.tab.today.title": "HOME",
    "common.tab.today.settingsTitle": "Home",
    "common.tab.today.description": "Today's screen and widgets",
    "common.tab.calendar.title": "PLAN",
    "common.tab.calendar.settingsTitle": "Plan",
    "common.tab.calendar.description": "Calendar and workout schedule",
    "common.tab.exercises.title": "EXERCISES",
    "common.tab.exercises.settingsTitle": "Exercises",
    "common.tab.exercises.description": "Catalog and technique",
    "common.tab.programs.title": "PROGRAMS",
    "common.tab.programs.settingsTitle": "Programs",
    "common.tab.programs.description": "Saved workout plans",
    "common.tab.nutrition.title": "NUTRITION",
    "common.tab.nutrition.settingsTitle": "Nutrition",
    "common.tab.nutrition.description": "Calorie and macro diary",
    "common.tab.stats.title": "PROGRESS",
    "common.tab.stats.settingsTitle": "Progress",
    "common.tab.stats.description": "Statistics and personal records",
    "common.tab.body.title": "BODY",
    "common.tab.body.settingsTitle": "Body",
    "common.tab.body.description": "Measurements, goals and trends",
    "common.tab.settings.title": "SETTINGS",
    "common.tab.settings.settingsTitle": "Settings",
    "common.tab.settings.description": "IronRise preferences",

    "common.widget.quote.title": "Quote of the day",
    "common.widget.quote.description": "A daily motivational quote from an athlete",
    "common.widget.week.title": "Week",
    "common.widget.week.description": "Workout plan and status for this week",
    "common.widget.nutrition.title": "Nutrition",
    "common.widget.nutrition.description": "Daily calorie and macro progress",
    "common.widget.trainingTrend.title": "Workout chart",
    "common.widget.trainingTrend.description": "Volume of completed workouts",
    "common.widget.metrics.title": "Summary metrics",
    "common.widget.metrics.description": "Workout count, volume and time",
    "common.widget.shortcuts.title": "Quick access",
    "common.widget.shortcuts.description": "Calendar and exercise catalog buttons",

    "common.theme.editorial.title": "IronRise Editorial",
    "common.theme.editorial.hint": "Poster cream, red and blue",
    "common.theme.orchid.title": "Orchid Voltage",
    "common.theme.orchid.hint": "Electric violet",
    "common.theme.violet.title": "Violet",
    "common.theme.violet.hint": "The IronRise signature look",
    "common.theme.rose.title": "Pink pulse",
    "common.theme.rose.hint": "Bright and energetic",
    "common.theme.ocean.title": "Ocean",
    "common.theme.ocean.hint": "Cool focus",
    "common.theme.forest.title": "Forest rhythm",
    "common.theme.forest.hint": "Calm strength",
    "common.theme.sunset.title": "Sunset",
    "common.theme.sunset.hint": "Warm energy",
    "common.theme.midnight.title": "Midnight",
    "common.theme.midnight.hint": "High-contrast dark",
    "common.theme.darkEnergy.title": "Dark athlete",
    "common.theme.darkEnergy.hint": "Graphite and lime — the signature energy",
    "common.theme.lightMinimal.title": "Light minimalism",
    "common.theme.lightMinimal.hint": "Air, white cards, emerald accent",
    "common.theme.boldNeon.title": "Bold Neon",
    "common.theme.boldNeon.hint": "Gradients and neon for energetic workouts",

    "common.duration.hours": "h",
    "common.duration.minutes": "min",
    "common.duration.seconds": "sec",
    "common.userMedia.unsupported":
      "Choose a JPG, PNG, WEBP or HEIC image up to 8 MB.",

    "common.mediaPicker.eyebrow": "IMAGE",
    "common.mediaPicker.hint":
      "Pick a ready-made illustration or upload a JPG, PNG, WEBP or HEIC file up to 8 MB. You can crop it before saving.",
    "common.mediaPicker.current": "Current image",
    "common.mediaPicker.upload": "Upload from device",
    "common.mediaPicker.uploadBusy": "Opening files…",
    "common.mediaPicker.libraryTitle": "Ready-made illustrations",
    "common.mediaPicker.done": "Done",
    "common.mediaPicker.pickFailedTitle": "Could not load the image",
    "common.mediaPicker.pickFailedFallback": "Try choosing another file.",

    "common.imageCrop.eyebrow": "CROPPING",
    "common.imageCrop.title": "Prepare the image",
    "common.imageCrop.presetOriginal": "Full",
    "common.imageCrop.presetSquareHint": "Card",
    "common.imageCrop.presetLandscapeHint": "Cover",
    "common.imageCrop.presetOriginalHint": "No crop",
    "common.imageCrop.badgeOriginal": "Original frame",
    "common.imageCrop.hintOriginal": "The image will be saved without cropping.",
    "common.imageCrop.hintCrop":
      "Move the frame with one finger and zoom it with two. The original file is left untouched.",
    "common.imageCrop.reset": "Reset position and zoom",
    "common.imageCrop.cancel": "Cancel",
    "common.imageCrop.save": "Save frame",
    "common.imageCrop.saving": "Saving…",
    "common.imageCrop.failedTitle": "Could not process the image",
    "common.imageCrop.failedMessage":
      "Try another file or choose the full frame.",
  },
});
