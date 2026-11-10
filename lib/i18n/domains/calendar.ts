import { defineDomain } from "../types";

// Домен «Календарь тренировок» (app/(tabs)/calendar.tsx).
// Ключи плоские: "calendar.<блок>.<смысл>". Набор ключей ru и en обязан
// совпадать — это проверяет defineDomain на этапе компиляции и тест
// tests/i18n.test.ts.
//
// Плейсхолдеры подставляются t("ключ", { name: value }): {planned}, {done},
// {count}, {name}, {description}, {minutes}, {value}, {weight}, {reps},
// {date}, {time}, {index}, {length}, {day}.
export const calendar = defineDomain({
  ru: {
    "calendar.header.title": "Планер тренировок",
    "calendar.header.today": "Сегодня",
    "calendar.month.sub": "{planned} запланировано · {done} выполнено",
    "calendar.dragHint":
      "Свайпайте календарь влево или вправо для смены месяца. Для переноса удерживайте только запланированную тренировку и ведите вертикально.",

    "calendar.weekday.mon": "Пн",
    "calendar.weekday.tue": "Вт",
    "calendar.weekday.wed": "Ср",
    "calendar.weekday.thu": "Чт",
    "calendar.weekday.fri": "Пт",
    "calendar.weekday.sat": "Сб",
    "calendar.weekday.sun": "Вс",
    "calendar.day.dropLabel": "сюда",

    "calendar.program.fallback": "Тренировка",
    "calendar.program.meta": "{count} упражнений · {description}",

    "calendar.result.eyebrow": "ВЫПОЛНЕННАЯ ПРОГРАММА",
    "calendar.result.durationValue": "{minutes} мин",
    "calendar.result.durationLabel": "ДЛИТЕЛЬНОСТЬ",
    "calendar.result.volumeValue": "{value} кг",
    "calendar.result.volumeLabel": "ОБЪЁМ",
    "calendar.result.setsLabel": "ПОДХОДОВ",
    "calendar.result.recordsEyebrow": "НОВЫЕ ЛИЧНЫЕ РЕКОРДЫ · {count}",
    "calendar.result.recordMeta": "{weight} кг × {reps}",
    "calendar.result.recordOneRm": "1RM {value} кг",
    "calendar.result.viewResults": "Просмотреть результаты",
    "calendar.result.delete": "Удалить из расписания",

    "calendar.planned.label": "ЗАПЛАНИРОВАННАЯ ПРОГРАММА",
    "calendar.planned.change": "Изменить",

    "calendar.empty.title": "Тренировка на эту дату не запланирована",
    "calendar.empty.hint":
      "Выберите программу — параметры напоминания берутся из вкладки «Настройки».",
    "calendar.empty.cta": "Запланировать тренировку",

    "calendar.start.notYet": "Тренировка ещё не началась",
    "calendar.start.cta": "Начать тренировку сейчас",
    "calendar.start.futureHint": "Запуск будет доступен {date}.",

    "calendar.searchSheet.title": "Запланировать тренировку",
    "calendar.searchSheet.subtitle": "Выберите программу на {date}",
    "calendar.searchSheet.placeholder": "Поиск программы",
    "calendar.searchSheet.empty": "По запросу программы не найдены.",
    "calendar.searchSheet.confirm": "Запланировать: {name}",
    "calendar.searchSheet.confirmEmpty": "Выберите программу",

    "calendar.pickerSheet.title": "Выберите программу",
    "calendar.pickerSheet.subtitle": "План на {date}",

    "calendar.resultSheet.title": "Результаты тренировки",
    "calendar.resultSheet.subtitle": "{name} · {date}",
    "calendar.resultSheet.setsValue": "{count} подходов",
    "calendar.resultSheet.editResult": "Редактировать результат",
    "calendar.resultSheet.share": "Поделиться достижениями",
    "calendar.resultSheet.setTitle": "Подход {index}",
    "calendar.resultSheet.setValue": "{weight} кг × {reps}",
    "calendar.resultSheet.noSets":
      "Подробные подходы недоступны для этой записи.",

    "calendar.shareSheet.title": "Поделиться достижением",
    "calendar.shareSheet.subtitle": "Карточка и текст готовы для публикации",
    "calendar.shareSheet.themeLabel": "ТЕМА КАРТОЧКИ",
    "calendar.shareSheet.themeDark": "Тёмная",
    "calendar.shareSheet.themeLight": "Светлая",
    "calendar.shareSheet.noteLabel": "ЛИЧНАЯ ЗАМЕТКА НА КАРТОЧКЕ",
    "calendar.shareSheet.notePlaceholder":
      "Например: новый вес дался уверенно",
    "calendar.shareSheet.noteLimit": "{length}/120",
    "calendar.shareSheet.templateTelegram": "Telegram",
    "calendar.shareSheet.templateInstagram": "Instagram",
    "calendar.shareSheet.shareImage": "Поделиться карточкой PNG",
    "calendar.shareSheet.shareText": "Поделиться текстом",
    "calendar.shareSheet.dialogTitle": "Поделиться карточкой IronRise",

    "calendar.alert.scheduledTitle": "Тренировка запланирована",
    "calendar.alert.scheduledMessage": "{name} · {date} в {time}",
    "calendar.alert.scheduleFailedTitle": "Не удалось запланировать",
    "calendar.alert.scheduleFailedMessage":
      "Проверь разрешение на уведомления.",
    "calendar.alert.deletedTitle": "Тренировка удалена",
    "calendar.alert.deletedMessage": "Напоминание также отменено.",
    "calendar.alert.deleteResultTitle": "Удалить выполненную тренировку?",
    "calendar.alert.deleteResultMessage":
      "Результат будет удалён из истории, личные рекорды пересчитаются, а зелёная галочка исчезнет из календаря. После этого дату можно снова запланировать.",
    "calendar.alert.cancel": "Отмена",
    "calendar.alert.deleteConfirm": "Удалить из расписания",
    "calendar.alert.alreadyDoneTitle": "Тренировка уже выполнена",
    "calendar.alert.alreadyDoneMessage":
      "Выполненную тренировку нельзя переносить. Создайте новую запись в расписании.",
    "calendar.alert.dateBusyTitle": "Дата занята",
    "calendar.alert.dateBusyMessage":
      "Выберите свободный день для переноса тренировки.",
    "calendar.alert.movedTitle": "Тренировка перенесена",
    "calendar.alert.movedMessage": "{name} перенесена на {date}.",
    "calendar.alert.moveFailedTitle": "Не удалось перенести",
    "calendar.alert.moveFailedMessage":
      "Проверь подключение и разрешения для уведомлений.",
    "calendar.alert.achievementsTitle": "Достижения готовы",
    "calendar.alert.shareFailedTitle": "Не удалось поделиться",
    "calendar.alert.shareFailedMessage":
      "Попробуйте ещё раз — результаты тренировки сохранены.",
    "calendar.alert.shareUnavailableTitle": "Обмен недоступен",
    "calendar.alert.shareUnavailableMessage":
      "На этом устройстве не удалось открыть системное меню обмена.",
    "calendar.alert.cardFailedTitle": "Не удалось подготовить карточку",
    "calendar.alert.cardFailedMessage":
      "Попробуйте поделиться текстовым шаблоном.",
  },
  en: {
    "calendar.header.title": "Workout planner",
    "calendar.header.today": "Today",
    "calendar.month.sub": "{planned} planned · {done} done",
    "calendar.dragHint":
      "Swipe the calendar left or right to change the month. To move a workout, hold only a scheduled one and drag it vertically.",

    "calendar.weekday.mon": "Mo",
    "calendar.weekday.tue": "Tu",
    "calendar.weekday.wed": "We",
    "calendar.weekday.thu": "Th",
    "calendar.weekday.fri": "Fr",
    "calendar.weekday.sat": "Sa",
    "calendar.weekday.sun": "Su",
    "calendar.day.dropLabel": "here",

    "calendar.program.fallback": "Workout",
    "calendar.program.meta": "{count} exercises · {description}",

    "calendar.result.eyebrow": "COMPLETED PROGRAM",
    "calendar.result.durationValue": "{minutes} min",
    "calendar.result.durationLabel": "DURATION",
    "calendar.result.volumeValue": "{value} kg",
    "calendar.result.volumeLabel": "VOLUME",
    "calendar.result.setsLabel": "SETS",
    "calendar.result.recordsEyebrow": "NEW PERSONAL RECORDS · {count}",
    "calendar.result.recordMeta": "{weight} kg × {reps}",
    "calendar.result.recordOneRm": "1RM {value} kg",
    "calendar.result.viewResults": "View results",
    "calendar.result.delete": "Remove from schedule",

    "calendar.planned.label": "SCHEDULED PROGRAM",
    "calendar.planned.change": "Change",

    "calendar.empty.title": "No workout scheduled for this date",
    "calendar.empty.hint":
      "Pick a program — reminder settings come from the “Settings” tab.",
    "calendar.empty.cta": "Schedule a workout",

    "calendar.start.notYet": "The workout has not started yet",
    "calendar.start.cta": "Start the workout now",
    "calendar.start.futureHint": "Available from {date}.",

    "calendar.searchSheet.title": "Schedule a workout",
    "calendar.searchSheet.subtitle": "Pick a program for {date}",
    "calendar.searchSheet.placeholder": "Search programs",
    "calendar.searchSheet.empty": "No programs match your search.",
    "calendar.searchSheet.confirm": "Schedule: {name}",
    "calendar.searchSheet.confirmEmpty": "Pick a program",

    "calendar.pickerSheet.title": "Pick a program",
    "calendar.pickerSheet.subtitle": "Plan for {date}",

    "calendar.resultSheet.title": "Workout results",
    "calendar.resultSheet.subtitle": "{name} · {date}",
    "calendar.resultSheet.setsValue": "{count} sets",
    "calendar.resultSheet.editResult": "Edit the result",
    "calendar.resultSheet.share": "Share achievements",
    "calendar.resultSheet.setTitle": "Set {index}",
    "calendar.resultSheet.setValue": "{weight} kg × {reps}",
    "calendar.resultSheet.noSets":
      "Detailed sets are not available for this entry.",

    "calendar.shareSheet.title": "Share an achievement",
    "calendar.shareSheet.subtitle": "The card and the text are ready to post",
    "calendar.shareSheet.themeLabel": "CARD THEME",
    "calendar.shareSheet.themeDark": "Dark",
    "calendar.shareSheet.themeLight": "Light",
    "calendar.shareSheet.noteLabel": "PERSONAL NOTE ON THE CARD",
    "calendar.shareSheet.notePlaceholder":
      "For example: the new weight felt solid",
    "calendar.shareSheet.noteLimit": "{length}/120",
    "calendar.shareSheet.templateTelegram": "Telegram",
    "calendar.shareSheet.templateInstagram": "Instagram",
    "calendar.shareSheet.shareImage": "Share a PNG card",
    "calendar.shareSheet.shareText": "Share text",
    "calendar.shareSheet.dialogTitle": "Share an IronRise card",

    "calendar.alert.scheduledTitle": "Workout scheduled",
    "calendar.alert.scheduledMessage": "{name} · {date} at {time}",
    "calendar.alert.scheduleFailedTitle": "Could not schedule",
    "calendar.alert.scheduleFailedMessage":
      "Check the notification permission.",
    "calendar.alert.deletedTitle": "Workout deleted",
    "calendar.alert.deletedMessage": "The reminder was cancelled too.",
    "calendar.alert.deleteResultTitle": "Delete the completed workout?",
    "calendar.alert.deleteResultMessage":
      "The result will be removed from the history, personal records will be recalculated and the green check will disappear from the calendar. After that the date can be scheduled again.",
    "calendar.alert.cancel": "Cancel",
    "calendar.alert.deleteConfirm": "Remove from schedule",
    "calendar.alert.alreadyDoneTitle": "The workout is already done",
    "calendar.alert.alreadyDoneMessage":
      "A completed workout cannot be moved. Create a new entry in the schedule.",
    "calendar.alert.dateBusyTitle": "This date is taken",
    "calendar.alert.dateBusyMessage":
      "Pick a free day to move the workout to.",
    "calendar.alert.movedTitle": "Workout moved",
    "calendar.alert.movedMessage": "{name} moved to {date}.",
    "calendar.alert.moveFailedTitle": "Could not move the workout",
    "calendar.alert.moveFailedMessage":
      "Check your connection and notification permissions.",
    "calendar.alert.achievementsTitle": "Achievements are ready",
    "calendar.alert.shareFailedTitle": "Could not share",
    "calendar.alert.shareFailedMessage":
      "Try again — your workout results are saved.",
    "calendar.alert.shareUnavailableTitle": "Sharing is unavailable",
    "calendar.alert.shareUnavailableMessage":
      "The system share menu could not be opened on this device.",
    "calendar.alert.cardFailedTitle": "Could not prepare the card",
    "calendar.alert.cardFailedMessage":
      "Try sharing the text template instead.",
  },
});
