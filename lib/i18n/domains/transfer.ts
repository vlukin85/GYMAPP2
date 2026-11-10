import { defineDomain } from "../types";

// Домен «Перенос данных»: экспорт истории тренировок в CSV (app/export.tsx)
// и импорт истории из CSV (app/import.tsx).
//
// Плейсхолдеры: {uri}, {count}, {line}, {message}, {source}, {delimiter},
// {weight}, {reps}, {templates}.
export const transfer = defineDomain({
  ru: {
    "transfer.backA11y": "Назад",
    "transfer.cancel": "Отмена",
    "transfer.done": "Готово",

    "transfer.export.headerTitle": "Экспорт CSV",
    "transfer.export.heroEyebrow": "ИСТОРИЯ ТРЕНИРОВОК",
    "transfer.export.heroTitle": "Открой данные в Excel",
    "transfer.export.heroText":
      "Выгрузка включает дату, программу, упражнение, подход, вес, повторы, объём и расчётный 1RM.",
    "transfer.export.summaryLabel":
      "локально сохранённых подходов в файле",
    "transfer.export.cta": "Скачать CSV",
    "transfer.export.note":
      "На Android откроется системное меню: можно сохранить файл на устройство, отправить его по почте или открыть в табличном приложении.",
    "transfer.export.emptyTitle": "Нет данных",
    "transfer.export.emptyMessage":
      "Заверши хотя бы одну тренировку, чтобы выгрузить историю в CSV.",
    "transfer.export.createdTitle": "Файл создан",
    "transfer.export.createdMessage": "CSV сохранён: {uri}",
    "transfer.export.dialogTitle": "Экспорт истории тренировок",
    "transfer.export.errorTitle": "Не удалось создать CSV",
    "transfer.export.errorMessage":
      "Попробуй ещё раз после проверки подключения и свободного места на устройстве.",

    "transfer.import.headerTitle": "Импорт CSV",
    "transfer.import.heroEyebrow": "ПЕРЕНОС ИСТОРИИ",
    "transfer.import.heroTitle": "Загрузи старые тренировки",
    "transfer.import.heroText":
      "Распознаются выгрузки Дневника тренировок, Strong и Hevy. Перед загрузкой приложение локально исключит уже добавленные занятия.",
    "transfer.import.formatsTitle": "Поддерживаемые шаблоны",
    "transfer.import.formatsText":
      "Дневник тренировок: дата, упражнение, повторы, вес.\nStrong: Date, Workout Name, Exercise Name, Set Order.\nHevy: title, start_time, exercise_title, weight_lbs, reps.",
    "transfer.import.pickCta": "Выбрать CSV-файл",
    "transfer.import.pickBusy": "Читаем файл…",
    "transfer.import.tooLargeTitle": "Файл слишком большой",
    "transfer.import.tooLargeMessage":
      "Выбери CSV размером не более 2 МБ и до 500 строк подходов.",
    "transfer.import.readErrorTitle": "Не удалось прочитать файл",
    "transfer.import.readErrorMessage":
      "Проверь, что это текстовый CSV-файл в кодировке UTF-8.",
    "transfer.import.sourceNative": "CSV приложения",
    "transfer.import.recognized": "Распознан шаблон: {source} · разделитель: {delimiter}",
    "transfer.import.delimiterSemicolon": "точка с запятой",
    "transfer.import.delimiterComma": "запятая",
    "transfer.import.validSets": "валидных подходов",
    "transfer.import.errorLines": "строк с ошибками",
    "transfer.import.workouts": "тренировок",
    "transfer.import.duplicatesTitle": "Найдены повторы: {count}",
    "transfer.import.duplicatesText":
      "Эти тренировки уже есть в локальной истории и не будут добавлены повторно.",
    "transfer.import.errorsTitle": "Требуют внимания",
    "transfer.import.errorLine": "Строка {line}: {message}",
    "transfer.import.errorsMore":
      "И ещё {count} строк — они не будут загружены.",
    "transfer.import.previewTitle": "Предпросмотр",
    "transfer.import.rowValue": "{weight} кг × {reps}",
    "transfer.import.previewMore":
      "Показаны первые 5 из {count} валидных подходов.",
    "transfer.import.importCta": "Импортировать {count} тренировок",
    "transfer.import.allImported": "Все тренировки уже импортированы",
    "transfer.import.note":
      "Будут добавлены только валидные и новые тренировки. Отпечатки импортов хранятся на этом устройстве, поэтому повторный импорт не создаст копий.",
    "transfer.import.doneTitle": "Импорт завершён",
    "transfer.import.doneMessage":
      "Добавлено тренировок: {count}; подходов: {sets}.{skipped}",
    "transfer.import.doneSkipped": " Повторов не добавлено: {count}.",
  },
  en: {
    "transfer.backA11y": "Back",
    "transfer.cancel": "Cancel",
    "transfer.done": "Done",

    "transfer.export.headerTitle": "CSV export",
    "transfer.export.heroEyebrow": "WORKOUT HISTORY",
    "transfer.export.heroTitle": "Open the data in Excel",
    "transfer.export.heroText":
      "The export includes the date, program, exercise, set, weight, reps, volume and estimated 1RM.",
    "transfer.export.summaryLabel": "sets stored locally in the file",
    "transfer.export.cta": "Download CSV",
    "transfer.export.note":
      "On Android the system menu opens: you can save the file on the device, send it by email or open it in a spreadsheet app.",
    "transfer.export.emptyTitle": "No data",
    "transfer.export.emptyMessage":
      "Finish at least one workout to export the history to CSV.",
    "transfer.export.createdTitle": "File created",
    "transfer.export.createdMessage": "CSV saved: {uri}",
    "transfer.export.dialogTitle": "Export workout history",
    "transfer.export.errorTitle": "Could not create the CSV",
    "transfer.export.errorMessage":
      "Try again after checking the connection and free space on the device.",

    "transfer.import.headerTitle": "CSV import",
    "transfer.import.heroEyebrow": "MOVING HISTORY",
    "transfer.import.heroTitle": "Load your old workouts",
    "transfer.import.heroText":
      "Exports from the Training Diary, Strong and Hevy are recognized. Before loading, the app excludes workouts you already have.",
    "transfer.import.formatsTitle": "Supported templates",
    "transfer.import.formatsText":
      "Training Diary: date, exercise, reps, weight.\nStrong: Date, Workout Name, Exercise Name, Set Order.\nHevy: title, start_time, exercise_title, weight_lbs, reps.",
    "transfer.import.pickCta": "Choose a CSV file",
    "transfer.import.pickBusy": "Reading the file…",
    "transfer.import.tooLargeTitle": "The file is too large",
    "transfer.import.tooLargeMessage":
      "Choose a CSV up to 2 MB with no more than 500 set rows.",
    "transfer.import.readErrorTitle": "Could not read the file",
    "transfer.import.readErrorMessage":
      "Check that this is a UTF-8 text CSV file.",
    "transfer.import.sourceNative": "App CSV",
    "transfer.import.recognized": "Template recognized: {source} · delimiter: {delimiter}",
    "transfer.import.delimiterSemicolon": "semicolon",
    "transfer.import.delimiterComma": "comma",
    "transfer.import.validSets": "valid sets",
    "transfer.import.errorLines": "rows with errors",
    "transfer.import.workouts": "workouts",
    "transfer.import.duplicatesTitle": "Duplicates found: {count}",
    "transfer.import.duplicatesText":
      "These workouts are already in the local history and will not be added again.",
    "transfer.import.errorsTitle": "Needs attention",
    "transfer.import.errorLine": "Row {line}: {message}",
    "transfer.import.errorsMore":
      "And {count} more rows — they will not be loaded.",
    "transfer.import.previewTitle": "Preview",
    "transfer.import.rowValue": "{weight} kg × {reps}",
    "transfer.import.previewMore":
      "Showing the first 5 of {count} valid sets.",
    "transfer.import.importCta": "Import {count} workouts",
    "transfer.import.allImported": "All workouts are already imported",
    "transfer.import.note":
      "Only valid and new workouts are added. Import fingerprints are stored on this device, so a repeated import creates no copies.",
    "transfer.import.doneTitle": "Import complete",
    "transfer.import.doneMessage":
      "Workouts added: {count}; sets: {sets}.{skipped}",
    "transfer.import.doneSkipped": " Duplicates skipped: {count}.",
  },
});
