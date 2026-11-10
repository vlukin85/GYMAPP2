import { defineDomain } from "../types";

// Домен «Тело» (app/(tabs)/body.tsx).
// Ключи плоские: "body.<блок>.<смысл>". Набор ключей ru и en обязан совпадать —
// это проверяет defineDomain на этапе компиляции и тест tests/i18n.test.ts.
//
// Подписи и единицы самих метрик (Вес/Жир/Грудь/… , кг/см, ВЕС/ЖИР/…) живут в
// lib/body-store.tsx (label/labelEn, unit/unitEn, short/shortEn) и здесь не
// дублируются — их выбирают через bodyMetricLabel/bodyMetricUnit/bodyMetricShort.
//
// Плейсхолдеры подставляются t("ключ", { name: value }): {date}, {value},
// {count}.
export const body = defineDomain({
  ru: {
    "body.header.eyebrow": "ЛОКАЛЬНЫЙ ЖУРНАЛ",
    "body.header.title": "ТЕЛО",
    "body.header.subtitle": "Вес, обхваты и композиция",
    "body.header.addCta": "+ ЗАМЕР",

    "body.latest.kicker": "ПОСЛЕДНИЙ ЗАМЕР · {date}",
    "body.latest.empty": "Добавьте первый замер, чтобы видеть динамику тела.",
    "body.latest.noRecords": "нет записей",
    "body.composition.muscle": "Мышцы {value} кг",
    "body.composition.bone": "Кости {value} кг",
    "body.composition.water": "Вода {value} кг",
    "body.composition.bmi": "ИМТ {value}",

    "body.bmi.title": "ИНДЕКС МАССЫ ТЕЛА",
    "body.bmi.unit": "ИМТ",
    "body.bmi.hintMissing": "Добавьте вес в замере и рост в настройках.",
    "body.bmi.categoryMissing": "Нужны вес и рост",
    "body.bmi.categoryBelow": "Ниже диапазона",
    "body.bmi.categoryNormal": "Референсный диапазон",
    "body.bmi.categoryAbove": "Выше диапазона",
    "body.bmi.categoryHigh": "Высокий показатель",

    "body.photos.title": "ВИЗУАЛЬНЫЙ ПРОГРЕСС",
    "body.photos.subtitle": "Фото по датам замеров",
    "body.photos.empty":
      "Прикрепите фото к любой записи в истории, чтобы сравнивать изменения визуально.",
    "body.photos.deleteTitle": "Удалить фотографию?",
    "body.photos.deleteMessage":
      "Фото будет удалено из визуальной истории прогресса.",
    "body.photos.addErrorTitle": "Не удалось добавить фото",
    "body.photos.addErrorMessage": "Попробуйте выбрать другое изображение.",
    "body.photos.tooLarge": "Выберите фотографию размером до 8 МБ.",

    "body.history.title": "ИСТОРИЯ",
    "body.history.countOne": "{count} запись",
    "body.history.countMany": "{count} записей",
    "body.history.empty": "История пока пуста.",
    "body.history.sourceScale": " · весы",
    "body.history.addPhoto": "+ ФОТО К ЗАМЕРУ",
    "body.history.addPhotoBusy": "ДОБАВЛЯЕМ ФОТО…",
    "body.history.deleteTitle": "Удалить замер?",
    "body.history.deleteMessage":
      "Запись исчезнет только из локального журнала. Прикреплённые фото останутся в визуальной истории.",

    "body.editor.eyebrow": "НОВАЯ ЗАПИСЬ",
    "body.editor.title": "Замеры тела",
    "body.editor.dateLabel": "Дата · ГГГГ-ММ-ДД",
    "body.editor.datePlaceholder": "2026-08-19",
    "body.editor.saveCta": "СОХРАНИТЬ ЗАМЕР",
    "body.editor.emptyValuesTitle": "Добавьте параметр",
    "body.editor.emptyValuesMessage": "Укажите хотя бы вес или один обхват.",

    "body.comparison.title": "СРАВНЕНИЕ ПРОГРЕССА",
    "body.comparison.subtitle": "Две даты · реальные изменения",
    "body.comparison.from": "ОТ",
    "body.comparison.to": "ДО",
    "body.comparison.noPhoto": "НЕТ\nФОТО",

    "body.chart.kicker": "ДИНАМИКА",
    "body.chart.singleMeasurement": "1 ЗАМЕР",
    "body.chart.goal": "ЦЕЛЬ · {value} {unit}",
    "body.chart.empty":
      "Добавьте ещё один замер «{name}», чтобы увидеть линию изменения.",

    "body.silhouette.kicker": "КАРТА ЗАМЕРОВ · {profile}",
    "body.silhouette.profileFemale": "ЖЕНСКИЙ ПРОФИЛЬ",
    "body.silhouette.profileMale": "МУЖСКОЙ ПРОФИЛЬ",
    "body.silhouette.title": "Силуэт тела",
    "body.silhouette.front": "СПЕРЕДИ",
    "body.silhouette.back": "СЗАДИ",
    "body.silhouette.showFrontA11y": "Показать силуэт спереди",
    "body.silhouette.showBackA11y": "Показать силуэт сзади",
    "body.silhouette.viewFront": "спереди",
    "body.silhouette.viewBack": "сзади",
    "body.silhouette.imageA11yFemale": "Реалистичный женский силуэт, вид {view}",
    "body.silhouette.imageA11yMale": "Реалистичный мужской силуэт, вид {view}",
    "body.silhouette.zoomOutA11y": "Уменьшить силуэт",
    "body.silhouette.zoomInA11y": "Увеличить силуэт",
    "body.silhouette.empty":
      "Силуэт покажет актуальные обхваты после первого сохранённого замера.",

    "body.common.cancel": "Отмена",
    "body.common.delete": "Удалить",
  },
  en: {
    "body.header.eyebrow": "LOCAL LOG",
    "body.header.title": "BODY",
    "body.header.subtitle": "Weight, girths and composition",
    "body.header.addCta": "+ MEASURE",

    "body.latest.kicker": "LATEST MEASUREMENT · {date}",
    "body.latest.empty": "Add your first measurement to see how your body changes.",
    "body.latest.noRecords": "no records",
    "body.composition.muscle": "Muscle {value} kg",
    "body.composition.bone": "Bone {value} kg",
    "body.composition.water": "Water {value} kg",
    "body.composition.bmi": "BMI {value}",

    "body.bmi.title": "BODY MASS INDEX",
    "body.bmi.unit": "BMI",
    "body.bmi.hintMissing": "Add weight in a measurement and height in settings.",
    "body.bmi.categoryMissing": "Weight and height needed",
    "body.bmi.categoryBelow": "Below range",
    "body.bmi.categoryNormal": "Reference range",
    "body.bmi.categoryAbove": "Above range",
    "body.bmi.categoryHigh": "High value",

    "body.photos.title": "VISUAL PROGRESS",
    "body.photos.subtitle": "Photos by measurement date",
    "body.photos.empty":
      "Attach a photo to any history entry to compare changes visually.",
    "body.photos.deleteTitle": "Delete the photo?",
    "body.photos.deleteMessage":
      "The photo will be removed from the visual progress history.",
    "body.photos.addErrorTitle": "Could not add the photo",
    "body.photos.addErrorMessage": "Try choosing another image.",
    "body.photos.tooLarge": "Choose a photo up to 8 MB.",

    "body.history.title": "HISTORY",
    "body.history.countOne": "{count} record",
    "body.history.countMany": "{count} records",
    "body.history.empty": "The history is empty for now.",
    "body.history.sourceScale": " · scale",
    "body.history.addPhoto": "+ PHOTO TO MEASUREMENT",
    "body.history.addPhotoBusy": "ADDING PHOTO…",
    "body.history.deleteTitle": "Delete the measurement?",
    "body.history.deleteMessage":
      "The entry disappears from the local log only. Attached photos stay in the visual history.",

    "body.editor.eyebrow": "NEW ENTRY",
    "body.editor.title": "Body measurements",
    "body.editor.dateLabel": "Date · YYYY-MM-DD",
    "body.editor.datePlaceholder": "2026-08-19",
    "body.editor.saveCta": "SAVE MEASUREMENT",
    "body.editor.emptyValuesTitle": "Add a value",
    "body.editor.emptyValuesMessage": "Enter at least your weight or one girth.",

    "body.comparison.title": "PROGRESS COMPARISON",
    "body.comparison.subtitle": "Two dates · real changes",
    "body.comparison.from": "FROM",
    "body.comparison.to": "TO",
    "body.comparison.noPhoto": "NO\nPHOTO",

    "body.chart.kicker": "TREND",
    "body.chart.singleMeasurement": "1 MEASUREMENT",
    "body.chart.goal": "GOAL · {value} {unit}",
    "body.chart.empty": "Add one more “{name}” measurement to see the trend line.",

    "body.silhouette.kicker": "MEASUREMENT MAP · {profile}",
    "body.silhouette.profileFemale": "FEMALE PROFILE",
    "body.silhouette.profileMale": "MALE PROFILE",
    "body.silhouette.title": "Body silhouette",
    "body.silhouette.front": "FRONT",
    "body.silhouette.back": "BACK",
    "body.silhouette.showFrontA11y": "Show the front silhouette",
    "body.silhouette.showBackA11y": "Show the back silhouette",
    "body.silhouette.viewFront": "front",
    "body.silhouette.viewBack": "back",
    "body.silhouette.imageA11yFemale": "Realistic female silhouette, {view} view",
    "body.silhouette.imageA11yMale": "Realistic male silhouette, {view} view",
    "body.silhouette.zoomOutA11y": "Zoom the silhouette out",
    "body.silhouette.zoomInA11y": "Zoom the silhouette in",
    "body.silhouette.empty":
      "The silhouette shows current girths after the first saved measurement.",

    "body.common.cancel": "Cancel",
    "body.common.delete": "Delete",
  },
});
