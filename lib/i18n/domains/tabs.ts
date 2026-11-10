import { defineDomain } from "../types";

// Домен «Главный экран „Сегодня“» (app/(tabs)/index.tsx).
// Ключи плоские: "tabs.<блок>.<смысл>". Набор ключей ru и en обязан совпадать —
// это проверяет defineDomain на этапе компиляции и тест tests/i18n.test.ts.
//
// Плейсхолдеры подставляются t("ключ", { name: value }): {weekday}, {day},
// {month}, {count}, {minutes}, {quote}, {athlete}, {discipline}, {value},
// {goal}.
export const tabs = defineDomain({
  ru: {
    "tabs.hero.eyebrow": "Дневник тренировок",
    "tabs.hero.greetingNight": "Доброй ночи",
    "tabs.hero.greetingMorning": "Доброе утро",
    "tabs.hero.greetingDay": "Добрый день",
    "tabs.hero.greetingEvening": "Добрый вечер",
    "tabs.hero.date": "{weekday}, {day} {month}",
    "tabs.hero.brand": "IronRise · by Vasily Lukin",
    "tabs.hero.rights": "© All rights reserved",

    "tabs.today.kicker": "Тренировка дня",
    "tabs.today.setsBadge": "{count} подходов",
    "tabs.today.exerciseCount": "{count} упражнений",
    "tabs.today.estimateMinutes": "≈ {minutes} мин",
    "tabs.today.exerciseFallback": "Упражнение",
    "tabs.today.moreExercises": "+ ещё {count}",
    "tabs.today.startCta": "Начать тренировку",
    "tabs.today.startA11y": "Начать тренировку",
    "tabs.today.emptyText": "На сегодня программа не запланирована.",
    "tabs.today.emptyCta": "Запланировать",

    "tabs.quote.kicker": "ЦИТАТА ДНЯ",
    "tabs.quote.text": "«{quote}»",
    "tabs.quote.author": "{athlete} · {discipline}",

    "tabs.trend.title": "ОБЪЁМ · КГ",
    "tabs.trend.statsLink": "Статистика",
    "tabs.trend.caption": "ЗАВЕРШЁННЫЕ ТРЕНИРОВКИ",
    "tabs.trend.empty": "Завершите тренировку, чтобы увидеть динамику объёма.",

    "tabs.metrics.workouts": "ТРЕНИРОВОК",
    "tabs.metrics.volume": "ОБЪЁМ",
    "tabs.metrics.volumeSuffix": " т",
    "tabs.metrics.time": "ВРЕМЯ",
    "tabs.metrics.duration": "{hours} ч {minutes} мин",
    "tabs.metrics.durationHours": "{hours} ч",

    "tabs.week.title": "Неделя",
    "tabs.week.workouts": "Тренировки",
    "tabs.week.volume": "Объём, кг",
    "tabs.week.volumeValue": "{value}т",
    "tabs.week.minutes": "Минуты",
    "tabs.week.dayA11y": "День {day}",

    "tabs.energy.title": "РАСХОД · СЕГОДНЯ",
    "tabs.energy.unit": "ККАЛ",
    "tabs.energy.resting": "Покой",
    "tabs.energy.movement": "Движение",
    "tabs.energy.workout": "Тренировка",
    "tabs.energy.hintPersonal":
      "Основано на профиле тела и завершённых тренировках.",
    "tabs.energy.hintFillProfile":
      "Добавьте рост и возраст в профиле для более точной оценки.",
    "tabs.energyTrend.title": "РАСХОД · 7 ДНЕЙ",
    "tabs.energyTrend.average": "ККАЛ В СРЕДНЕМ",
    "tabs.energyTrend.hint": "Акцент — дни с завершённой тренировкой.",

    "tabs.nutrition.title": "ПИТАНИЕ · ЦЕЛЬ ДНЯ",
    "tabs.nutrition.goalSuffix": "/ {goal} ККАЛ",
    "tabs.nutrition.proteinShort": "Б",
    "tabs.nutrition.fatShort": "Ж",
    "tabs.nutrition.carbsShort": "У",
    "tabs.nutrition.macroValue": "{value}/{goal}г",

    "tabs.actions.calendar": "Календарь",
    "tabs.actions.exercises": "Упражнения",

    "tabs.dragHint.eyebrow": "НАСТРОЙТЕ «СЕГОДНЯ» ПОД СЕБЯ",
    "tabs.dragHint.title": "Перемещайте виджеты",
    "tabs.dragHint.text":
      "Зажмите маркер ⠿ на карточке и потяните её вверх или вниз. Соседние блоки плавно освободят место, а новый порядок сохранится автоматически.",
    "tabs.dragHint.cta": "ПОНЯТНО",
    "tabs.widget.handleA11y": "Перетащить виджет",
  },
  en: {
    "tabs.hero.eyebrow": "Workout diary",
    "tabs.hero.greetingNight": "Good night",
    "tabs.hero.greetingMorning": "Good morning",
    "tabs.hero.greetingDay": "Good afternoon",
    "tabs.hero.greetingEvening": "Good evening",
    "tabs.hero.date": "{weekday}, {month} {day}",
    "tabs.hero.brand": "IronRise · by Vasily Lukin",
    "tabs.hero.rights": "© All rights reserved",

    "tabs.today.kicker": "Workout of the day",
    "tabs.today.setsBadge": "{count} sets",
    "tabs.today.exerciseCount": "{count} exercises",
    "tabs.today.estimateMinutes": "≈ {minutes} min",
    "tabs.today.exerciseFallback": "Exercise",
    "tabs.today.moreExercises": "+ {count} more",
    "tabs.today.startCta": "Start workout",
    "tabs.today.startA11y": "Start workout",
    "tabs.today.emptyText": "No program scheduled for today.",
    "tabs.today.emptyCta": "Schedule",

    "tabs.quote.kicker": "QUOTE OF THE DAY",
    "tabs.quote.text": "“{quote}”",
    "tabs.quote.author": "{athlete} · {discipline}",

    "tabs.trend.title": "VOLUME · KG",
    "tabs.trend.statsLink": "Stats",
    "tabs.trend.caption": "COMPLETED WORKOUTS",
    "tabs.trend.empty": "Finish a workout to see your volume trend.",

    "tabs.metrics.workouts": "WORKOUTS",
    "tabs.metrics.volume": "VOLUME",
    "tabs.metrics.volumeSuffix": " t",
    "tabs.metrics.time": "TIME",
    "tabs.metrics.duration": "{hours} h {minutes} min",
    "tabs.metrics.durationHours": "{hours} h",

    "tabs.week.title": "Week",
    "tabs.week.workouts": "Workouts",
    "tabs.week.volume": "Volume, kg",
    "tabs.week.volumeValue": "{value}t",
    "tabs.week.minutes": "Minutes",
    "tabs.week.dayA11y": "Day {day}",

    "tabs.energy.title": "BURN · TODAY",
    "tabs.energy.unit": "KCAL",
    "tabs.energy.resting": "Resting",
    "tabs.energy.movement": "Movement",
    "tabs.energy.workout": "Workout",
    "tabs.energy.hintPersonal":
      "Based on your body profile and completed workouts.",
    "tabs.energy.hintFillProfile":
      "Add your height and age in the profile for a more accurate estimate.",
    "tabs.energyTrend.title": "BURN · 7 DAYS",
    "tabs.energyTrend.average": "KCAL ON AVERAGE",
    "tabs.energyTrend.hint": "Highlighted bars are days with a workout.",

    "tabs.nutrition.title": "NUTRITION · DAILY GOAL",
    "tabs.nutrition.goalSuffix": "/ {goal} KCAL",
    "tabs.nutrition.proteinShort": "P",
    "tabs.nutrition.fatShort": "F",
    "tabs.nutrition.carbsShort": "C",
    "tabs.nutrition.macroValue": "{value}/{goal} g",

    "tabs.actions.calendar": "Calendar",
    "tabs.actions.exercises": "Exercises",

    "tabs.dragHint.eyebrow": "MAKE “TODAY” YOUR OWN",
    "tabs.dragHint.title": "Rearrange your widgets",
    "tabs.dragHint.text":
      "Hold the ⠿ handle on a card and drag it up or down. Neighbouring blocks make room as you go, and the new order is saved automatically.",
    "tabs.dragHint.cta": "GOT IT",
    "tabs.widget.handleA11y": "Drag widget",
  },
});
