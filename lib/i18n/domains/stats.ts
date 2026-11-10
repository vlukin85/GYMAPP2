import { defineDomain } from "../types";

// Домен «Статистика» (app/(tabs)/stats.tsx).
// Ключи плоские: "stats.<блок>.<смысл>". Набор ключей ru и en обязан совпадать —
// это проверяет defineDomain на этапе компиляции и тест tests/i18n.test.ts.
//
// Плейсхолдеры подставляются t("ключ", { name: value }): {value}, {period},
// {group}, {date}, {weight}, {reps}, {total}, {source}, {count}, {title},
// {current}, {average}, {peak}, {km}, {arrow}, {percent}, {previous},
// {exercise}, {day}.
export const stats = defineDomain({
  ru: {
    "stats.header.eyebrow": "Анализ прогресса",
    "stats.header.title": "Статистика",
    "stats.header.edit": "Редактировать",
    "stats.header.editDone": "Готово",
    "stats.header.editA11y": "Редактировать виджеты статистики",
    "stats.header.editDoneA11y": "Завершить редактирование виджетов",

    "stats.period.week": "Неделя",
    "stats.period.month": "Месяц",
    "stats.period.year": "Год",
    "stats.period.date": "Дата",
    "stats.period.custom": "Диапазон",
    "stats.period.last30": "30 дней",
    "stats.period.last90": "90 дней",
    "stats.period.fallback": "месяц",

    "stats.weekday.mon": "Пн",
    "stats.weekday.tue": "Вт",
    "stats.weekday.wed": "Ср",
    "stats.weekday.thu": "Чт",
    "stats.weekday.fri": "Пт",
    "stats.weekday.sat": "Сб",
    "stats.weekday.sun": "Вс",

    "stats.summary.sessions": "сессий",
    "stats.summary.workouts": "тренировок",
    "stats.summary.exerciseVolume": "объём упражнения",
    "stats.summary.totalVolume": "общий объём",
    "stats.summary.minutes": "минут",
    "stats.summary.volumeValue": "{value}т",

    "stats.exerciseFilter.label": "УПРАЖНЕНИЕ",
    "stats.exerciseFilter.all": "Все упражнения",
    "stats.exerciseFilter.choose": "Выбрать",
    "stats.exerciseFilter.clear": "Сбросить",
    "stats.exercisePicker.title": "Фильтр упражнения",
    "stats.exercisePicker.hint":
      "Показывает объём и рекорды выбранного движения.",
    "stats.exercisePicker.searchPlaceholder": "Поиск упражнения",
    "stats.exercisePicker.showAll": "Показать все упражнения",

    "stats.dateForm.singleLabel": "КОНКРЕТНАЯ ДАТА",
    "stats.dateForm.rangeLabel": "ПОЛЬЗОВАТЕЛЬСКИЙ ДИАПАЗОН",
    "stats.dateForm.from": "ОТ",
    "stats.dateForm.to": "ДО",
    "stats.dateForm.rangeHint": "Нажмите дату, чтобы выбрать её в календаре.",
    "stats.calendarSheet.titleDate": "Выберите дату",
    "stats.calendarSheet.titleStart": "Начало диапазона",
    "stats.calendarSheet.titleEnd": "Конец диапазона",
    "stats.calendarSheet.hint": "Статистика будет пересчитана автоматически",

    "stats.records.title": "Личные рекорды",
    "stats.records.hint":
      "Последние зафиксированные или обновлённые за {period}.",
    "stats.records.groupFallback": "Упражнение",
    "stats.records.meta": "{group} · обновлён {date}",
    "stats.records.weightReps": "{weight} кг × {reps}",
    "stats.records.oneRm": "1RM {value} кг",
    "stats.records.emptyTitle": "Нет обновлений за этот период",
    "stats.records.emptyText":
      "Завершите тренировку с новым результатом, и он появится здесь.",

    "stats.cardio.title": "КАРДИО · 7 ДНЕЙ",
    "stats.cardio.hint": "Время кардио по дням недели",
    "stats.cardio.total": "{total} МИН",

    "stats.activity.title": "Активность · сегодня",
    "stats.activity.hint": "Шаги, калории и пульс из {source}",
    "stats.activity.badgeGoogleFit": "GF",
    "stats.activity.badgeHealthConnect": "HC",
    "stats.activity.loading": "Загружаем данные {source}…",
    "stats.activity.notConnected": "{source} не подключён",
    "stats.activity.googleFitHint":
      "Подключите Google Fit в настройках — он основной источник данных, Health Connect остаётся резервом.",
    "stats.activity.googleFitConnect": "Подключить Google Fit",
    "stats.activity.googleFitConnectA11y":
      "Подключить Google Fit в настройках",
    "stats.activity.healthConnectHint":
      "Разрешите IronRise читать активность и пульс — данные приходят из приложения «Здоровье».",
    "stats.activity.healthConnectSetup": "Настроить Health Connect",
    "stats.activity.healthConnectSetupA11y":
      "Настроить Health Connect в настройках",
    "stats.activity.noDataTitle": "Нет данных за сегодня",
    "stats.activity.noDataGoogleFit":
      "Откройте приложение Google Fit, чтобы оно синхронизировало шаги, калории и пульс.",
    "stats.activity.noDataHealthConnect":
      "Откройте приложение «Здоровье», чтобы оно синхронизировало шаги, калории и пульс в Health Connect.",
    "stats.activity.steps": "Шаги",
    "stats.activity.activeKcal": "Активные ккал",
    "stats.activity.distance": "Дистанция",
    "stats.activity.distanceValue": "{value} км",
    "stats.activity.heartRate":
      "Пульс: сейчас {current} · среднее {average} · пик {peak}",

    "stats.comparison.title": "Сравнение с {period}",
    "stats.comparison.periodWeek": "прошлой неделей",
    "stats.comparison.periodMonth": "прошлым месяцем",
    "stats.comparison.hint": "Текущий период и предыдущий на одном экране",
    "stats.comparison.badgeWeek": "НЕДЕЛЯ",
    "stats.comparison.badgeMonth": "МЕСЯЦ",
    "stats.comparison.workouts": "Тренировки",
    "stats.comparison.volume": "Объём",
    "stats.comparison.volumeSuffix": " т",
    "stats.comparison.time": "Время",
    "stats.comparison.timeSuffix": " мин",
    "stats.comparison.previous": "было {value}",
    "stats.comparison.trendNew": "Новые",
    "stats.comparison.trendSame": "Без изменений",
    "stats.comparison.trendChange": "{arrow} {percent}%",

    "stats.oneRm.title": "Динамика 1RM",
    "stats.oneRm.hint": "{exercise} · точки — новые личные рекорды",
    "stats.oneRm.current": "ТЕКУЩИЙ",
    "stats.oneRm.currentValue": "{value} кг",
    "stats.oneRm.axisHint": "Нажмите точку, чтобы редактировать",
    "stats.oneRm.emptyTitle": "Пока нет личного рекорда",
    "stats.oneRm.emptyText":
      "Завершите подход с улучшением 1RM — точка появится на графике.",

    "stats.hidden.title": "Скрытые виджеты",
    "stats.hidden.hint":
      "Скрытые блоки не показываются на экране, вернуть можно в любой момент.",
    "stats.hidden.empty": "Скрытых виджетов нет — все блоки на месте.",
    "stats.hidden.restore": "Вернуть",
    "stats.hidden.restoreA11y": "Вернуть виджет «{title}»",
    "stats.hidden.hideA11y": "Скрыть виджет «{title}»",

    "stats.dragHint.eyebrow": "НАСТРОЙТЕ СТАТИСТИКУ ПОД СЕБЯ",
    "stats.dragHint.title": "Перемещайте виджеты",
    "stats.dragHint.text":
      "Зажмите маркер ⠿ на карточке и потяните её вверх или вниз. Кнопка × скрывает ненужный блок — вернуть его можно в списке «Скрытые виджеты». Новый порядок сохранится автоматически.",
    "stats.dragHint.cta": "ПОНЯТНО",
    "stats.widget.handleA11y": "Перетащить виджет",
  },
  en: {
    "stats.header.eyebrow": "Progress analysis",
    "stats.header.title": "Statistics",
    "stats.header.edit": "Edit",
    "stats.header.editDone": "Done",
    "stats.header.editA11y": "Edit statistics widgets",
    "stats.header.editDoneA11y": "Finish editing widgets",

    "stats.period.week": "Week",
    "stats.period.month": "Month",
    "stats.period.year": "Year",
    "stats.period.date": "Date",
    "stats.period.custom": "Range",
    "stats.period.last30": "30 days",
    "stats.period.last90": "90 days",
    "stats.period.fallback": "month",

    "stats.weekday.mon": "Mo",
    "stats.weekday.tue": "Tu",
    "stats.weekday.wed": "We",
    "stats.weekday.thu": "Th",
    "stats.weekday.fri": "Fr",
    "stats.weekday.sat": "Sa",
    "stats.weekday.sun": "Su",

    "stats.summary.sessions": "sessions",
    "stats.summary.workouts": "workouts",
    "stats.summary.exerciseVolume": "exercise volume",
    "stats.summary.totalVolume": "total volume",
    "stats.summary.minutes": "minutes",
    "stats.summary.volumeValue": "{value}t",

    "stats.exerciseFilter.label": "EXERCISE",
    "stats.exerciseFilter.all": "All exercises",
    "stats.exerciseFilter.choose": "Choose",
    "stats.exerciseFilter.clear": "Reset",
    "stats.exercisePicker.title": "Exercise filter",
    "stats.exercisePicker.hint":
      "Shows the volume and records of the chosen movement.",
    "stats.exercisePicker.searchPlaceholder": "Search exercise",
    "stats.exercisePicker.showAll": "Show all exercises",

    "stats.dateForm.singleLabel": "SPECIFIC DATE",
    "stats.dateForm.rangeLabel": "CUSTOM RANGE",
    "stats.dateForm.from": "FROM",
    "stats.dateForm.to": "TO",
    "stats.dateForm.rangeHint": "Tap a date to pick it in the calendar.",
    "stats.calendarSheet.titleDate": "Pick a date",
    "stats.calendarSheet.titleStart": "Range start",
    "stats.calendarSheet.titleEnd": "Range end",
    "stats.calendarSheet.hint": "Statistics will be recalculated automatically",

    "stats.records.title": "Personal records",
    "stats.records.hint": "Set or updated during {period}.",
    "stats.records.groupFallback": "Exercise",
    "stats.records.meta": "{group} · updated {date}",
    "stats.records.weightReps": "{weight} kg × {reps}",
    "stats.records.oneRm": "1RM {value} kg",
    "stats.records.emptyTitle": "No updates in this period",
    "stats.records.emptyText":
      "Finish a workout with a new result and it will show up here.",

    "stats.cardio.title": "CARDIO · 7 DAYS",
    "stats.cardio.hint": "Cardio time by day of the week",
    "stats.cardio.total": "{total} MIN",

    "stats.activity.title": "Activity · today",
    "stats.activity.hint": "Steps, calories and heart rate from {source}",
    "stats.activity.badgeGoogleFit": "GF",
    "stats.activity.badgeHealthConnect": "HC",
    "stats.activity.loading": "Loading {source} data…",
    "stats.activity.notConnected": "{source} is not connected",
    "stats.activity.googleFitHint":
      "Connect Google Fit in settings — it is the primary source, Health Connect stays as backup.",
    "stats.activity.googleFitConnect": "Connect Google Fit",
    "stats.activity.googleFitConnectA11y": "Connect Google Fit in settings",
    "stats.activity.healthConnectHint":
      "Allow IronRise to read activity and heart rate — the data comes from the “Health” app.",
    "stats.activity.healthConnectSetup": "Set up Health Connect",
    "stats.activity.healthConnectSetupA11y":
      "Set up Health Connect in settings",
    "stats.activity.noDataTitle": "No data for today",
    "stats.activity.noDataGoogleFit":
      "Open the Google Fit app so it syncs your steps, calories and heart rate.",
    "stats.activity.noDataHealthConnect":
      "Open the “Health” app so it syncs your steps, calories and heart rate to Health Connect.",
    "stats.activity.steps": "Steps",
    "stats.activity.activeKcal": "Active kcal",
    "stats.activity.distance": "Distance",
    "stats.activity.distanceValue": "{value} km",
    "stats.activity.heartRate":
      "Heart rate: now {current} · avg {average} · peak {peak}",

    "stats.comparison.title": "Compared with {period}",
    "stats.comparison.periodWeek": "last week",
    "stats.comparison.periodMonth": "last month",
    "stats.comparison.hint": "Current and previous period side by side",
    "stats.comparison.badgeWeek": "WEEK",
    "stats.comparison.badgeMonth": "MONTH",
    "stats.comparison.workouts": "Workouts",
    "stats.comparison.volume": "Volume",
    "stats.comparison.volumeSuffix": " t",
    "stats.comparison.time": "Time",
    "stats.comparison.timeSuffix": " min",
    "stats.comparison.previous": "was {value}",
    "stats.comparison.trendNew": "New",
    "stats.comparison.trendSame": "No change",
    "stats.comparison.trendChange": "{arrow} {percent}%",

    "stats.oneRm.title": "1RM trend",
    "stats.oneRm.hint": "{exercise} · dots are new personal records",
    "stats.oneRm.current": "CURRENT",
    "stats.oneRm.currentValue": "{value} kg",
    "stats.oneRm.axisHint": "Tap a dot to edit",
    "stats.oneRm.emptyTitle": "No personal record yet",
    "stats.oneRm.emptyText":
      "Finish a set with a better 1RM and the dot will appear on the chart.",

    "stats.hidden.title": "Hidden widgets",
    "stats.hidden.hint":
      "Hidden blocks are not shown on the screen and can be brought back at any time.",
    "stats.hidden.empty": "No hidden widgets — every block is in place.",
    "stats.hidden.restore": "Restore",
    "stats.hidden.restoreA11y": "Restore the “{title}” widget",
    "stats.hidden.hideA11y": "Hide the “{title}” widget",

    "stats.dragHint.eyebrow": "MAKE STATISTICS YOUR OWN",
    "stats.dragHint.title": "Rearrange your widgets",
    "stats.dragHint.text":
      "Hold the ⠿ handle on a card and drag it up or down. The × button hides a block you do not need — bring it back from the “Hidden widgets” list. The new order is saved automatically.",
    "stats.dragHint.cta": "GOT IT",
    "stats.widget.handleA11y": "Drag widget",
  },
});
