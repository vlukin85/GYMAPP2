import { defineDomain } from "../types";

// Домен «Питание» (app/(tabs)/nutrition.tsx).
// Ключи плоские: "nutrition.<блок>.<смысл>". Набор ключей ru и en обязан
// совпадать — это проверяет defineDomain на этапе компиляции и тест
// tests/i18n.test.ts.
//
// Названия приёмов пищи (Завтрак/Обед/Ужин/Перекус) в экране приходят из
// lib/nutrition-data как значения MealType — здесь лежат их подписи, чтобы
// экран мог показать t("nutrition.meal.breakfast") вместо самой строки.
// Формы «штука/штуки/штук» тоже вынесены сюда: piece.one — 1, piece.few — 2–4,
// piece.many — 5+, piece.short — компактная подпись «3 шт».
//
// Плейсхолдеры подставляются t("ключ", { name: value }): {goal}, {short},
// {value}, {protein}, {fat}, {carbs}, {day}, {grams}, {calories}, {count},
// {amount}, {pieces}, {form}, {name}, {meal}, {kcal}, {length}.
export const nutrition = defineDomain({
  ru: {
    "nutrition.header.eyebrow": "ДНЕВНИК ПИТАНИЯ",
    "nutrition.header.title": "Питание",
    "nutrition.header.today": "СЕГОДНЯ",

    "nutrition.total.goalCaption": "ИЗ ЦЕЛИ {goal} ККАЛ",
    "nutrition.total.macroValue": "{short} {value}г",
    "nutrition.total.left": "ОСТАЛОСЬ",
    "nutrition.total.over": "ПЕРЕБОР",

    "nutrition.macro.proteinShort": "Б",
    "nutrition.macro.fatShort": "Ж",
    "nutrition.macro.carbsShort": "У",
    "nutrition.macro.protein": "БЕЛКИ",
    "nutrition.macro.fat": "ЖИРЫ",
    "nutrition.macro.carbs": "УГЛЕВОДЫ",
    "nutrition.macro.gramsValue": "{value} г",
    "nutrition.macro.line": "Б {protein} · Ж {fat} · У {carbs}",

    "nutrition.chart.title": "БЖУ · СОСТАВ ДНЯ",
    "nutrition.chart.hint": "{day} · вес продуктов за день · БЖУ в граммах",
    "nutrition.chart.totalValue": "{grams} Г",
    "nutrition.chart.gramsCaption": "ГРАММ",
    "nutrition.chart.a11y": "Круговая диаграмма белков, жиров и углеводов",

    "nutrition.meals.title": "ПРИЁМЫ ПИЩИ",
    "nutrition.meals.report": "ОТЧЁТ",
    "nutrition.meals.templates": "ШАБЛОНЫ",
    "nutrition.meals.import": "ИМПОРТ CSV",
    "nutrition.meals.loading": "Загружаем локальный дневник…",
    "nutrition.meals.kcal": "{calories} ККАЛ",
    "nutrition.meals.empty": "Нет записей",
    "nutrition.meals.addProducts": "＋ ДОБАВИТЬ ПРОДУКТЫ",
    "nutrition.meals.saveTemplate": "СОХРАНИТЬ КАК ШАБЛОН",

    "nutrition.meal.breakfast": "Завтрак",
    "nutrition.meal.lunch": "Обед",
    "nutrition.meal.dinner": "Ужин",
    "nutrition.meal.snack": "Перекус",

    "nutrition.entry.fallback": "Продукт",
    "nutrition.entry.grams": "{grams} г",
    "nutrition.entry.piecesAndGrams": "{pieces} · {grams} г",
    "nutrition.entry.metaLine": "{amount} · Б {protein} · Ж {fat} · У {carbs}",
    "nutrition.entry.removePieceA11y": "Убрать одну штуку {name}",
    "nutrition.entry.addPieceA11y": "Добавить одну штуку {name}",

    "nutrition.piece.count": "{count} {form}",
    "nutrition.piece.short": "{count} шт",
    "nutrition.piece.piece.one": "штука",
    "nutrition.piece.piece.few": "штуки",
    "nutrition.piece.piece.many": "штук",
    "nutrition.piece.can.one": "банка",
    "nutrition.piece.can.few": "банки",
    "nutrition.piece.can.many": "банок",
    "nutrition.piece.glass.one": "стакан",
    "nutrition.piece.glass.few": "стакана",
    "nutrition.piece.glass.many": "стаканов",
    "nutrition.piece.serving.one": "порция",
    "nutrition.piece.serving.few": "порции",
    "nutrition.piece.serving.many": "порций",

    "nutrition.calendar.title": "КАЛЕНДАРЬ ПИТАНИЯ",
    "nutrition.weekday.mon": "ПН",
    "nutrition.weekday.tue": "ВТ",
    "nutrition.weekday.wed": "СР",
    "nutrition.weekday.thu": "ЧТ",
    "nutrition.weekday.fri": "ПТ",
    "nutrition.weekday.sat": "СБ",
    "nutrition.weekday.sun": "ВС",

    "nutrition.source.line":
      "{count} продуктов + ваши позиции · значения на 100 г",

    "nutrition.group.all": "Все",
    "nutrition.group.myProducts": "Мои продукты",

    "nutrition.picker.titleCatalog": "ДОБАВИТЬ ПРОДУКТЫ · {meal}",
    "nutrition.picker.titleEdit": "ИЗМЕНИТЬ ПРОДУКТ",
    "nutrition.picker.titleCustom": "СВОЙ ПРОДУКТ",
    "nutrition.picker.hintCatalog":
      "Выберите продукт и добавьте следующую порцию, не закрывая окно",
    "nutrition.picker.hintCustom":
      "Укажите КБЖУ на 100 г — продукт сохранится на устройстве",
    "nutrition.picker.searchPlaceholder": "Поиск по базе продуктов",
    "nutrition.picker.tabAll": "ВСЕ · {count}",
    "nutrition.picker.tabFavorites": "★ ИЗБРАННОЕ · {count}",
    "nutrition.picker.scanBarcode": "▣ СКАНИРОВАТЬ ШТРИХКОД",
    "nutrition.picker.createCustom": "＋ СОЗДАТЬ СВОЙ ПРОДУКТ",
    "nutrition.picker.emptyFavorites":
      "Добавьте продукты в избранное по кнопке ☆",
    "nutrition.picker.emptySearch": "По этому запросу продуктов нет",
    "nutrition.picker.foodKcal": "{kcal} ккал",
    "nutrition.picker.photoA11y": "Фото {name}",
    "nutrition.picker.illustrationA11y": "Иллюстрация {name}",
    "nutrition.picker.editA11y": "Редактировать {name}",
    "nutrition.picker.deleteA11y": "Удалить {name}",
    "nutrition.picker.favoriteRemoveA11y": "Убрать {name} из избранного",
    "nutrition.picker.favoriteAddA11y": "Добавить {name} в избранное",
    "nutrition.picker.modeGrams": "ГРАММЫ",
    "nutrition.picker.modePieces": "ШТУКИ",
    "nutrition.picker.modeGramsA11y": "Режим граммов",
    "nutrition.picker.modePiecesA11y": "Режим штук",
    "nutrition.picker.removePieceA11y": "Убрать одну штуку",
    "nutrition.picker.addPieceA11y": "Добавить одну штуку",
    "nutrition.picker.pieceRecalc": "{pieces} · {grams} г · ~{kcal} ккал",
    "nutrition.picker.portionPlaceholder": "Вес порции, г",
    "nutrition.picker.commitHint":
      "«Добавить и ещё» оставляет окно открытым для нескольких продуктов. «Готово» добавляет выбранный продукт в приём пищи и закрывает окно.",
    "nutrition.picker.commit": "ДОБАВИТЬ И ЕЩЁ",
    "nutrition.picker.done": "ГОТОВО",
    "nutrition.picker.doneA11y": "Добавить выбранный продукт и закрыть",

    "nutrition.custom.valuesTitle": "ЗНАЧЕНИЯ НА 100 Г",
    "nutrition.custom.namePlaceholder": "Название продукта",
    "nutrition.custom.barcodePlaceholder": "Штрихкод — необязательно",
    "nutrition.custom.scanA11y": "Сканировать штрихкод камеры",
    "nutrition.custom.scan": "⌗ СКАНИРОВАТЬ ШТРИХКОД",
    "nutrition.custom.kcalLabel": "ККАЛ",
    "nutrition.custom.proteinLabel": "БЕЛКИ, Г",
    "nutrition.custom.fatLabel": "ЖИРЫ, Г",
    "nutrition.custom.carbsLabel": "УГЛЕВОДЫ, Г",
    "nutrition.custom.pieceWeightPlaceholder":
      "Вес одной штуки, г — необязательно",
    "nutrition.custom.piecePreview":
      "В одной штуке: {kcal} ккал · Б {protein} · Ж {fat} · У {carbs}",
    "nutrition.custom.photoTitle": "ФОТО ПРОДУКТА — НЕОБЯЗАТЕЛЬНО",
    "nutrition.custom.photoReplaceA11y": "Заменить фото продукта",
    "nutrition.custom.photoPickA11y": "Выбрать фото продукта",
    "nutrition.custom.photoReplace": "ЗАМЕНИТЬ ФОТО",
    "nutrition.custom.photoPick": "📷 ВЫБРАТЬ ФОТО",
    "nutrition.custom.photoRemoveA11y": "Убрать фото продукта",
    "nutrition.custom.photoRemove": "УБРАТЬ ФОТО",
    "nutrition.custom.photoHint":
      "Камера или галерея — после кадрирования фото сохранится на устройстве и заменит стандартную иллюстрацию в каталоге.",
    "nutrition.custom.hint":
      "После сохранения продукт будет выбран для текущего приёма пищи и появится в категории «Мои продукты».",
    "nutrition.custom.saveChanges": "СОХРАНИТЬ ИЗМЕНЕНИЯ",
    "nutrition.custom.saveAndPick": "СОХРАНИТЬ И ВЫБРАТЬ",
    "nutrition.custom.backToCatalog": "К КАТАЛОГУ",

    "nutrition.lookup.found":
      "Найдено в Open Food Facts — проверьте КБЖУ на упаковке перед сохранением.",
    "nutrition.lookup.scanned":
      "Штрихкод отсканирован. Заполните значения с упаковки.",
    "nutrition.lookup.notFound":
      "В открытой базе продукт не найден. Заполните значения с упаковки.",
    "nutrition.lookup.failed":
      "Не удалось обратиться к открытой базе. Заполните значения вручную.",

    "nutrition.alert.photoPickFailedTitle": "Не удалось выбрать фото",
    "nutrition.alert.photoPickFailedMessage": "Попробуйте другое изображение.",
    "nutrition.photo.tooLarge": "Выберите фотографию размером до 8 МБ.",
    "nutrition.photo.cameraPermission":
      "Нужен доступ к камере — разрешите съёмку в настройках устройства.",
    "nutrition.alert.photoSourceTitle": "Фото продукта",
    "nutrition.alert.photoSourceMessage": "Откуда взять изображение?",
    "nutrition.alert.cancel": "Отмена",
    "nutrition.alert.fromGallery": "Из галереи",
    "nutrition.alert.takePhoto": "Сделать фото",
    "nutrition.alert.deleteProductTitle": "Удалить продукт?",
    "nutrition.alert.deleteProductMessage":
      "«{name}» исчезнет из каталога, но останется в истории уже добавленных приёмов пищи.",
    "nutrition.alert.delete": "Удалить",

    "nutrition.scanner.eyebrow": "КАМЕРА",
    "nutrition.scanner.title": "Сканировать штрихкод",
    "nutrition.scanner.checking": "Проверяем доступ к камере…",
    "nutrition.scanner.permissionTitle": "Нужен доступ к камере",
    "nutrition.scanner.permissionText":
      "Камера используется только для считывания штрихкода на упаковке.",
    "nutrition.scanner.permissionCta": "РАЗРЕШИТЬ КАМЕРУ",
    "nutrition.scanner.hint": "Наведите камеру на штрихкод продукта",

    "nutrition.templates.title": "ШАБЛОНЫ БЛЮД",
    "nutrition.templates.hint":
      "Сохраняйте текущий приём и добавляйте его в выбранный день одним нажатием",
    "nutrition.templates.creatorTitle": "СОХРАНИТЬ ТЕКУЩИЙ ПРИЁМ",
    "nutrition.templates.namePlaceholder": "Например, мой завтрак",
    "nutrition.templates.save": "СОХРАНИТЬ · {count} ПРОД.",
    "nutrition.templates.saveEmpty": "В ЭТОМ ПРИЁМЕ НЕТ ПРОДУКТОВ",
    "nutrition.templates.itemMeta":
      "{meal} · {count} продуктов · {kcal} ккал",
    "nutrition.templates.emptyTitle": "Пока нет шаблонов",
    "nutrition.templates.emptyText":
      "Добавьте продукты в приём пищи, введите название выше и сохраните его как шаблон.",

    "nutrition.import.headerTitle": "Импорт питания",
    "nutrition.import.eyebrow": "CSV ИЗ ТРЕКЕРОВ",
    "nutrition.import.title": "Загрузите дневник",
    "nutrition.import.hint":
      "Поддерживаются типичные CSV-выгрузки MyFitnessPal, Cronometer и FatSecret: дата, приём пищи, продукт, вес, калории и БЖУ. Все данные остаются на устройстве.",
    "nutrition.import.readErrorTitle": "Не удалось прочитать файл",
    "nutrition.import.readErrorMessage":
      "Выберите CSV-файл экспорта дневника питания.",
    "nutrition.import.pickBusy": "ЧИТАЕМ ФАЙЛ…",
    "nutrition.import.pickCta": "ВЫБРАТЬ CSV-ФАЙЛ",
    "nutrition.import.previewTitle": "ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР",
    "nutrition.import.positions": "ПОЗИЦИЙ",
    "nutrition.import.kcal": "ККАЛ",
    "nutrition.import.skipped": "Пропущено строк: {count}",
    "nutrition.import.fallbackProduct": "Продукт",
    "nutrition.import.itemMeta": "{date} · {meal} · {grams} г",
    "nutrition.import.more": "И ещё {count} поз.",
    "nutrition.import.commit": "ДОБАВИТЬ В ДНЕВНИК",
    "nutrition.import.doneTitle": "Импорт завершён",
    "nutrition.import.doneMessage":
      "Добавлено позиций: {count}. Повторяющиеся записи пропущены.",
    "nutrition.import.doneEmpty": "Все строки уже есть в дневнике.",
    "nutrition.import.done": "Готово",

    "nutrition.report.eyebrow": "ПИТАНИЕ · 7 ДНЕЙ",
    "nutrition.report.title": "Недельный отчёт",
    "nutrition.report.kcalTotal": "ККАЛ ЗА 7 ДНЕЙ",
    "nutrition.report.daysWithEntries": "ДНЕЙ С ЗАПИСЯМИ",
    "nutrition.report.caloriesByDay": "КАЛОРИИ ПО ДНЯМ",
    "nutrition.report.macrosByDay": "БЖУ ПО ДНЯМ",
    "nutrition.report.macrosHint": "Граммы на каждый из последних 7 дней",
    "nutrition.report.note":
      "Отчёт строится только по локально сохранённым записям питания. Нулевые дни не скрываются, чтобы динамика была честной.",
    "nutrition.report.planLine": "План: {calories} ккал в день",
    "nutrition.report.average": "{value} СР.",
    "nutrition.report.macroGoal": "{name} · ЦЕЛЬ {value} Г",
  },
  en: {
    "nutrition.header.eyebrow": "NUTRITION DIARY",
    "nutrition.header.title": "Nutrition",
    "nutrition.header.today": "TODAY",

    "nutrition.total.goalCaption": "OF {goal} KCAL",
    "nutrition.total.macroValue": "{short} {value} g",
    "nutrition.total.left": "LEFT",
    "nutrition.total.over": "OVER",

    "nutrition.macro.proteinShort": "P",
    "nutrition.macro.fatShort": "F",
    "nutrition.macro.carbsShort": "C",
    "nutrition.macro.protein": "PROTEIN",
    "nutrition.macro.fat": "FAT",
    "nutrition.macro.carbs": "CARBS",
    "nutrition.macro.gramsValue": "{value} g",
    "nutrition.macro.line": "P {protein} · F {fat} · C {carbs}",

    "nutrition.chart.title": "MACROS · DAY BREAKDOWN",
    "nutrition.chart.hint": "{day} · food weight for the day · macros in grams",
    "nutrition.chart.totalValue": "{grams} G",
    "nutrition.chart.gramsCaption": "GRAMS",
    "nutrition.chart.a11y": "Donut chart of protein, fat and carbs",

    "nutrition.meals.title": "MEALS",
    "nutrition.meals.report": "REPORT",
    "nutrition.meals.templates": "TEMPLATES",
    "nutrition.meals.import": "IMPORT CSV",
    "nutrition.meals.loading": "Loading the local diary…",
    "nutrition.meals.kcal": "{calories} KCAL",
    "nutrition.meals.empty": "No entries",
    "nutrition.meals.addProducts": "+ ADD FOOD",
    "nutrition.meals.saveTemplate": "SAVE AS TEMPLATE",

    "nutrition.meal.breakfast": "Breakfast",
    "nutrition.meal.lunch": "Lunch",
    "nutrition.meal.dinner": "Dinner",
    "nutrition.meal.snack": "Snack",

    "nutrition.entry.fallback": "Product",
    "nutrition.entry.grams": "{grams} g",
    "nutrition.entry.piecesAndGrams": "{pieces} · {grams} g",
    "nutrition.entry.metaLine": "{amount} · P {protein} · F {fat} · C {carbs}",
    "nutrition.entry.removePieceA11y": "Remove one {name}",
    "nutrition.entry.addPieceA11y": "Add one {name}",

    "nutrition.piece.count": "{count} {form}",
    "nutrition.piece.short": "{count} pcs",
    "nutrition.piece.piece.one": "piece",
    "nutrition.piece.piece.few": "pieces",
    "nutrition.piece.piece.many": "pieces",
    "nutrition.piece.can.one": "can",
    "nutrition.piece.can.few": "cans",
    "nutrition.piece.can.many": "cans",
    "nutrition.piece.glass.one": "glass",
    "nutrition.piece.glass.few": "glasses",
    "nutrition.piece.glass.many": "glasses",
    "nutrition.piece.serving.one": "serving",
    "nutrition.piece.serving.few": "servings",
    "nutrition.piece.serving.many": "servings",

    "nutrition.calendar.title": "NUTRITION CALENDAR",
    "nutrition.weekday.mon": "MO",
    "nutrition.weekday.tue": "TU",
    "nutrition.weekday.wed": "WE",
    "nutrition.weekday.thu": "TH",
    "nutrition.weekday.fri": "FR",
    "nutrition.weekday.sat": "SA",
    "nutrition.weekday.sun": "SU",

    "nutrition.source.line":
      "{count} foods plus your own items · values per 100 g",

    "nutrition.group.all": "All",
    "nutrition.group.myProducts": "My products",

    "nutrition.picker.titleCatalog": "ADD FOOD · {meal}",
    "nutrition.picker.titleEdit": "EDIT PRODUCT",
    "nutrition.picker.titleCustom": "CUSTOM PRODUCT",
    "nutrition.picker.hintCatalog":
      "Pick a product and add the next portion without closing the window",
    "nutrition.picker.hintCustom":
      "Enter the macros per 100 g — the product is saved on this device",
    "nutrition.picker.searchPlaceholder": "Search the food database",
    "nutrition.picker.tabAll": "ALL · {count}",
    "nutrition.picker.tabFavorites": "★ FAVOURITES · {count}",
    "nutrition.picker.scanBarcode": "▣ SCAN BARCODE",
    "nutrition.picker.createCustom": "+ CREATE A CUSTOM PRODUCT",
    "nutrition.picker.emptyFavorites":
      "Add products to favourites with the ☆ button",
    "nutrition.picker.emptySearch": "No products match this search",
    "nutrition.picker.foodKcal": "{kcal} kcal",
    "nutrition.picker.photoA11y": "{name} photo",
    "nutrition.picker.illustrationA11y": "{name} illustration",
    "nutrition.picker.editA11y": "Edit {name}",
    "nutrition.picker.deleteA11y": "Delete {name}",
    "nutrition.picker.favoriteRemoveA11y": "Remove {name} from favourites",
    "nutrition.picker.favoriteAddA11y": "Add {name} to favourites",
    "nutrition.picker.modeGrams": "GRAMS",
    "nutrition.picker.modePieces": "PIECES",
    "nutrition.picker.modeGramsA11y": "Grams mode",
    "nutrition.picker.modePiecesA11y": "Pieces mode",
    "nutrition.picker.removePieceA11y": "Remove one piece",
    "nutrition.picker.addPieceA11y": "Add one piece",
    "nutrition.picker.pieceRecalc": "{pieces} · {grams} g · ~{kcal} kcal",
    "nutrition.picker.portionPlaceholder": "Portion weight, g",
    "nutrition.picker.commitHint":
      "“Add and more” keeps the window open for several products. “Done” adds the chosen product to the meal and closes the window.",
    "nutrition.picker.commit": "ADD AND MORE",
    "nutrition.picker.done": "DONE",
    "nutrition.picker.doneA11y": "Add the chosen product and close",

    "nutrition.custom.valuesTitle": "VALUES PER 100 G",
    "nutrition.custom.namePlaceholder": "Product name",
    "nutrition.custom.barcodePlaceholder": "Barcode — optional",
    "nutrition.custom.scanA11y": "Scan the barcode with the camera",
    "nutrition.custom.scan": "⌗ SCAN BARCODE",
    "nutrition.custom.kcalLabel": "KCAL",
    "nutrition.custom.proteinLabel": "PROTEIN, G",
    "nutrition.custom.fatLabel": "FAT, G",
    "nutrition.custom.carbsLabel": "CARBS, G",
    "nutrition.custom.pieceWeightPlaceholder":
      "Weight of one piece, g — optional",
    "nutrition.custom.piecePreview":
      "One piece: {kcal} kcal · P {protein} · F {fat} · C {carbs}",
    "nutrition.custom.photoTitle": "PRODUCT PHOTO — OPTIONAL",
    "nutrition.custom.photoReplaceA11y": "Replace the product photo",
    "nutrition.custom.photoPickA11y": "Choose a product photo",
    "nutrition.custom.photoReplace": "REPLACE PHOTO",
    "nutrition.custom.photoPick": "📷 CHOOSE PHOTO",
    "nutrition.custom.photoRemoveA11y": "Remove the product photo",
    "nutrition.custom.photoRemove": "REMOVE PHOTO",
    "nutrition.custom.photoHint":
      "Camera or gallery — after cropping, the photo is saved on this device and replaces the default illustration in the catalogue.",
    "nutrition.custom.hint":
      "After saving, the product is selected for the current meal and appears in the “My products” category.",
    "nutrition.custom.saveChanges": "SAVE CHANGES",
    "nutrition.custom.saveAndPick": "SAVE AND CHOOSE",
    "nutrition.custom.backToCatalog": "BACK TO CATALOGUE",

    "nutrition.lookup.found":
      "Found in Open Food Facts — check the macros on the package before saving.",
    "nutrition.lookup.scanned":
      "Barcode scanned. Fill in the values from the package.",
    "nutrition.lookup.notFound":
      "The product was not found in the open database. Fill in the values from the package.",
    "nutrition.lookup.failed":
      "Could not reach the open database. Fill in the values manually.",

    "nutrition.alert.photoPickFailedTitle": "Could not pick a photo",
    "nutrition.alert.photoPickFailedMessage": "Try another image.",
    "nutrition.photo.tooLarge": "Choose a photo up to 8 MB.",
    "nutrition.photo.cameraPermission":
      "Camera access is required — allow it in the device settings.",
    "nutrition.alert.photoSourceTitle": "Product photo",
    "nutrition.alert.photoSourceMessage": "Where should the image come from?",
    "nutrition.alert.cancel": "Cancel",
    "nutrition.alert.fromGallery": "From the gallery",
    "nutrition.alert.takePhoto": "Take a photo",
    "nutrition.alert.deleteProductTitle": "Delete the product?",
    "nutrition.alert.deleteProductMessage":
      "“{name}” disappears from the catalogue but stays in the history of meals you already added.",
    "nutrition.alert.delete": "Delete",

    "nutrition.scanner.eyebrow": "CAMERA",
    "nutrition.scanner.title": "Scan a barcode",
    "nutrition.scanner.checking": "Checking camera access…",
    "nutrition.scanner.permissionTitle": "Camera access needed",
    "nutrition.scanner.permissionText":
      "The camera is used only to read the barcode on the package.",
    "nutrition.scanner.permissionCta": "ALLOW CAMERA",
    "nutrition.scanner.hint": "Point the camera at the product barcode",

    "nutrition.templates.title": "MEAL TEMPLATES",
    "nutrition.templates.hint":
      "Save the current meal and add it to any day in one tap",
    "nutrition.templates.creatorTitle": "SAVE THE CURRENT MEAL",
    "nutrition.templates.namePlaceholder": "For example, my breakfast",
    "nutrition.templates.save": "SAVE · {count} ITEMS",
    "nutrition.templates.saveEmpty": "NO ITEMS IN THIS MEAL",
    "nutrition.templates.itemMeta": "{meal} · {count} items · {kcal} kcal",
    "nutrition.templates.emptyTitle": "No templates yet",
    "nutrition.templates.emptyText":
      "Add products to a meal, enter a name above and save it as a template.",

    "nutrition.import.headerTitle": "Nutrition import",
    "nutrition.import.eyebrow": "CSV FROM TRACKERS",
    "nutrition.import.title": "Load your diary",
    "nutrition.import.hint":
      "Typical CSV exports from MyFitnessPal, Cronometer and FatSecret are supported: date, meal, product, weight, calories and macros. All data stays on the device.",
    "nutrition.import.readErrorTitle": "Could not read the file",
    "nutrition.import.readErrorMessage":
      "Choose a CSV export of the nutrition diary.",
    "nutrition.import.pickBusy": "READING THE FILE…",
    "nutrition.import.pickCta": "CHOOSE A CSV FILE",
    "nutrition.import.previewTitle": "PREVIEW",
    "nutrition.import.positions": "ENTRIES",
    "nutrition.import.kcal": "KCAL",
    "nutrition.import.skipped": "Rows skipped: {count}",
    "nutrition.import.fallbackProduct": "Product",
    "nutrition.import.itemMeta": "{date} · {meal} · {grams} g",
    "nutrition.import.more": "And {count} more",
    "nutrition.import.commit": "ADD TO THE DIARY",
    "nutrition.import.doneTitle": "Import complete",
    "nutrition.import.doneMessage":
      "Entries added: {count}. Duplicate records were skipped.",
    "nutrition.import.doneEmpty": "Every row is already in the diary.",
    "nutrition.import.done": "Done",

    "nutrition.report.eyebrow": "NUTRITION · 7 DAYS",
    "nutrition.report.title": "Weekly report",
    "nutrition.report.kcalTotal": "KCAL IN 7 DAYS",
    "nutrition.report.daysWithEntries": "DAYS WITH ENTRIES",
    "nutrition.report.caloriesByDay": "CALORIES BY DAY",
    "nutrition.report.macrosByDay": "MACROS BY DAY",
    "nutrition.report.macrosHint": "Grams for each of the last 7 days",
    "nutrition.report.note":
      "The report is built only from nutrition records stored locally. Zero days are not hidden, so the trend stays honest.",
    "nutrition.report.planLine": "Plan: {calories} kcal per day",
    "nutrition.report.average": "{value} AVG",
    "nutrition.report.macroGoal": "{name} · GOAL {value} G",
  },
});
