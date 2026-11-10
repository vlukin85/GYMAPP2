import { defineDomain } from "../types";

// Домен «Настройки» (app/settings.tsx).
// Ключи плоские: "settings.<секция>.<смысл>". Набор ключей ru и en обязан
// совпадать — это проверяет defineDomain на этапе компиляции и тест
// tests/i18n.test.ts на этапе прогона.
//
// Плейсхолдеры подставляются t("ключ", { name: value }): {step}, {minutes},
// {version}, {percent}, {completed}, {total}, {count}, {date}, {entries},
// {photos}, {size}, {calories}, {categories}, {title}, {purged}.
export const settings = defineDomain({
  ru: {
    "settings.header.title": "Настройки",
    "settings.search.placeholder": "Поиск настроек",
    "settings.search.clearA11y": "Очистить поиск настроек",
    "settings.search.resultHint": "Подходящие категории: {categories}",
    "settings.search.emptyHint": "Ничего не найдено. Попробуйте другой запрос.",
    "settings.search.emptyTitle": "Ничего не найдено",
    "settings.search.emptyExamples":
      "Попробуйте «вибрация», «калории», «уведомления» или «экспорт».",
    "settings.search.clearCta": "ОЧИСТИТЬ ПОИСК",

    "settings.category.training": "Тренировка",
    "settings.category.home": "Главный экран",
    "settings.category.appearance": "Внешний вид",
    "settings.category.body": "Питание и тело",
    "settings.category.reminders": "Напоминания",
    "settings.category.data": "Данные и сервисы",

    "settings.common.cancel": "Отмена",
    "settings.common.delete": "Удалить",
    "settings.common.retry": "Повтори попытку.",
    "settings.common.retryFormal": "Попробуйте ещё раз.",
    "settings.common.retryFormalShort": "Повторите попытку.",

    "settings.language.sectionTitle": "Язык / Language",
    "settings.language.optionRu": "Русский",
    "settings.language.optionEn": "English",
    "settings.language.hint":
      "Применяется мгновенно ко всем экранам и сохраняется на устройстве.",
    "settings.language.selectedA11y": "Выбранный язык: {language}",

    "settings.strength.sectionTitle": "Расчёт силы",
    "settings.strength.formulaTitle": "Формула 1RM",
    "settings.strength.formulaHint":
      "Выбор применяется к зонам нагрузки, истории и личным рекордам.",
    "settings.strength.formula.epley.title": "Эпли",
    "settings.strength.formula.epley.formula": "Вес × (1 + повторы / 30)",
    "settings.strength.formula.epley.description":
      "Универсальная оценка для большинства рабочих подходов.",
    "settings.strength.formula.brzycki.title": "Бржицки",
    "settings.strength.formula.brzycki.formula": "Вес × 36 / (37 − повторы)",
    "settings.strength.formula.brzycki.description":
      "Удобна для небольшого числа повторений.",
    "settings.strength.stepWeightLabel": "ШАГ ВЕСА",
    "settings.strength.stepKg": "{step} кг",

    "settings.appearance.themeTitle": "Стиль интерфейса",
    "settings.appearance.themeSubtitle": "Светлая или тёмная тема",
    "settings.appearance.themeHint":
      "Выберите режим оформления приложения. Выбор сохранится на устройстве и применится ко всем экранам.",
    "settings.appearance.themeLightBadge": "СВЕТЛАЯ",
    "settings.appearance.themeDarkBadge": "ТЁМНАЯ",
    "settings.appearance.themeLightHint": "Кремовый фон и контрастный текст",
    "settings.appearance.themeDarkHint": "Графитовый фон и мягкий свет",
    "settings.appearance.variantsTitle": "Варианты дизайна",
    "settings.appearance.variantsHint":
      "Готовые оформления из кликабельных прототипов. Выбор сохранится на устройстве и применится ко всем экранам.",
    "settings.appearance.densityTitle": "Плотность интерфейса",
    "settings.appearance.densitySubtitle":
      "Размер текста и расстояние между блоками",
    "settings.appearance.densityHint":
      "Выберите представление, которое комфортнее для тренировок и чтения статистики.",
    "settings.appearance.svgTitle": "SVG-иконки",
    "settings.appearance.svgColorTitle": "Цвет интерфейсных иконок",
    "settings.appearance.svgColorHint":
      "Меняет акцентные SVG-иконки в web-версии без повторной загрузки шрифтов.",

    "settings.nutrition.sectionTitle": "Питание",
    "settings.nutrition.activityTitle": "Повседневная активность",
    "settings.nutrition.activityHint":
      "Выбор влияет на строку «Движение» в суммарном расходе калорий на главном экране. Тренировка учитывается отдельно.",
    "settings.nutrition.goalsTitle": "Дневные цели калорий и БЖУ",
    "settings.nutrition.goalsHint":
      "Плановый калораж за сутки и цели БЖУ сохраняются на устройстве и используются в визуальном прогрессе дневника питания.",
    "settings.nutrition.autoGuideBadge": "АВТОМАТИЧЕСКИЙ ОРИЕНТИР",
    "settings.nutrition.autoGuideMissing": "Нужны профиль, возраст, рост и вес",
    "settings.nutrition.autoGuideValue": "{calories} ккал / день",
    "settings.nutrition.autoGuideWeightSource":
      "Вес берётся из последнего замера на вкладке «Тело».",
    "settings.nutrition.autoGuideFormula":
      "Mifflin–St Jeor × 1,4 · ориентир поддержки, не медицинское назначение.",
    "settings.nutrition.applyGuide": "ПРИМЕНИТЬ",
    "settings.nutrition.calorieGoalLabel": "Цель, ккал",
    "settings.nutrition.proteinLabel": "Белки, г",
    "settings.nutrition.fatLabel": "Жиры, г",
    "settings.nutrition.carbsLabel": "Углеводы, г",

    "settings.home.sectionTitle": "Главный экран",
    "settings.home.widgetsTitle": "Виджеты на экране «Сегодня»",
    "settings.home.widgetsHint":
      "Тяните маркер ⠿, чтобы изменить порядок. Основной блок с планом дня остаётся всегда.",
    "settings.home.dragHapticsTitle": "Виброотклик при переносе",
    "settings.home.dragHapticsHintOn":
      "Лёгкое подтверждение при захвате виджета.",
    "settings.home.dragHapticsHintOff": "Захват виджета проходит без вибрации.",
    "settings.home.resetWidgetsConfirmTitle": "Сбросить виджеты?",
    "settings.home.resetWidgetsConfirmMessage":
      "Вернутся исходный порядок, обычный размер и видимость всех блоков.",
    "settings.home.resetWidgetsConfirmAction": "Сбросить",
    "settings.home.resetWidgetsCta": "СБРОСИТЬ НАСТРОЙКИ ВИДЖЕТОВ",
    "settings.home.tabsTitle": "Вкладки в нижней панели",
    "settings.home.tabsHint":
      "Тяните маркер ⠿, чтобы менять порядок. Скрытые разделы исчезают из нижней навигации и свайпов. «Главное», «План» и «Настройки» остаются доступными всегда.",
    "settings.home.compactMode": "Компактный режим",
    "settings.home.compactHintOn": "Только иконки — больше места для экранов.",
    "settings.home.compactHintOff": "Иконки и короткие названия вкладок.",
    "settings.home.resetTabsConfirmTitle": "Вернуть все вкладки?",
    "settings.home.resetTabsConfirmMessage":
      "Вернутся исходный порядок, подписи, а все необязательные разделы снова появятся в нижней панели.",
    "settings.home.resetTabsConfirmAction": "Вернуть",
    "settings.home.showAllTabsCta": "ПОКАЗАТЬ ВСЕ ВКЛАДКИ",
    "settings.home.compactBadge": "Компактный режим",
    "settings.home.normalSizeBadge": "Обычный размер",
    "settings.home.alwaysAvailable": "Всегда доступна",

    "settings.restTimer.sectionTitle": "Таймер отдыха",
    "settings.restTimer.soundTitle": "Звук окончания отдыха",
    "settings.restTimer.soundHintOn":
      "Выберите сигнал для Android-уведомления по завершении отдыха.",
    "settings.restTimer.soundHintOff":
      "Окончание отдыха будет без звукового сигнала.",
    "settings.restTimer.signalTitle": "Сигнал завершения",
    "settings.restTimer.previewCta": "Предпрослушать сигнал",
    "settings.restTimer.vibrationTitle": "Вибрация вместе со звуком",
    "settings.restTimer.vibrationHintOn":
      "Короткий тактильный сигнал дополнит звук окончания отдыха.",
    "settings.restTimer.vibrationHintOff":
      "Окончание отдыха пройдёт только со звуком.",
    "settings.restTimer.vibrationHintDisabled":
      "Сначала включите звуковой сигнал завершения отдыха.",
    "settings.restTimer.vibrationPatternTitle": "Паттерн вибрации",
    "settings.restTimer.setHapticTitle": "Вибрация при завершении подхода",
    "settings.restTimer.setHapticHint":
      "Интенсивность сохраняется на этом устройстве. В веб-просмотре вибрация не запускается.",
    "settings.restTimer.volumeTitle": "Громкость сигнала",
    "settings.restTimer.volumeA11y": "Громкость сигнала {percent} процентов",
    "settings.restTimer.volumeHint":
      "Регулирует громкость IronRise внутри доступного системного уровня Android.",
    "settings.restTimer.soundOption.female.title": "Женский голос",
    "settings.restTimer.soundOption.female.description":
      "Короткая голосовая команда о завершении отдыха",
    "settings.restTimer.soundOption.male.title": "Мужской голос",
    "settings.restTimer.soundOption.male.description":
      "Уверенная голосовая команда о следующем подходе",
    "settings.restTimer.soundOption.siren.title": "Сирена",
    "settings.restTimer.soundOption.siren.description":
      "Короткий заметный электронный сигнал",
    "settings.restTimer.vibrationOption.short.title": "Короткая",
    "settings.restTimer.vibrationOption.short.description":
      "Один короткий импульс",
    "settings.restTimer.vibrationOption.long.title": "Длинная",
    "settings.restTimer.vibrationOption.long.description":
      "Один заметный длинный импульс",
    "settings.restTimer.vibrationOption.pulse.title": "Пульсирующая",
    "settings.restTimer.vibrationOption.pulse.description":
      "Три коротких последовательных импульса",
    "settings.hapticOption.light.title": "Лёгкая",
    "settings.hapticOption.light.description":
      "Короткое деликатное подтверждение",
    "settings.hapticOption.medium.title": "Средняя",
    "settings.hapticOption.medium.description": "Более заметный отклик",
    "settings.hapticOption.heavy.title": "Сильная",
    "settings.hapticOption.heavy.description": "Выраженное подтверждение",

    "settings.reminders.sectionTitle": "Напоминания о тренировках",
    "settings.reminders.localTitle": "Локальные уведомления",
    "settings.reminders.localHintOn":
      "Новые планы в календаре получат напоминание по этим настройкам.",
    "settings.reminders.localHintOff":
      "Новые планы сохраняются без системного напоминания.",
    "settings.reminders.defaultTime": "Время по умолчанию",
    "settings.reminders.remindBefore": "Напомнить за",
    "settings.reminders.minutesShort": "{minutes}м",

    "settings.bodyweight.sectionTitle": "Упражнения с весом тела",
    "settings.bodyweight.hint":
      "Для тоннажа приложение использует заданную долю массы тела: например, приседания или отжимания.",
    "settings.bodyweight.weightLabel": "Вес тела, кг",
    "settings.bodyweight.percentLabel": "Учитывать, %",

    "settings.bodyProfile.sectionTitle": "Профиль тела",
    "settings.bodyProfile.cardTitle": "Силуэт и расчёты",
    "settings.bodyProfile.cardHint":
      "Профиль, рост и возраст используются только в локальных расчётах ИМТ и калорийного ориентира.",
    "settings.bodyProfile.male": "Мужчина",
    "settings.bodyProfile.maleHint": "Широкие плечи · узкая талия",
    "settings.bodyProfile.female": "Женщина",
    "settings.bodyProfile.femaleHint": "Мягкая линия плеч · акцент на бёдра",
    "settings.bodyProfile.height": "Рост, см",
    "settings.bodyProfile.age": "Возраст, лет",
    "settings.bodyGoals.sectionTitle": "Цели параметров тела",
    "settings.bodyGoals.cardTitle": "Вес и обхваты",
    "settings.bodyGoals.hint":
      "Целевые линии появятся в графиках на вкладке «Тело». Оставьте поле пустым, чтобы скрыть ориентир.",

    "settings.groq.sectionTitle": "Личный API-ключ Groq",
    "settings.groq.saveErrorTitle": "Не удалось сохранить ключ",
    "settings.groq.deleteConfirmTitle": "Удалить личный ключ Groq?",
    "settings.groq.deleteConfirmMessage":
      "ИИ-режим станет недоступен, пока ты не добавишь новый ключ.",
    "settings.groq.deleteErrorTitle": "Не удалось удалить ключ",
    "settings.groq.keySavedHint":
      "Ключ сохранён на этом устройстве. Можно заменить его в любой момент.",
    "settings.groq.keyMissingHint":
      "Добавь ключ, чтобы создавать программы через Groq AI.",
    "settings.groq.badgeReady": "ГОТОВО",
    "settings.groq.badgeMissing": "НЕТ КЛЮЧА",
    "settings.groq.updateCta": "Обновить ключ",
    "settings.groq.addCta": "Добавить ключ",
    "settings.groq.webHint": "Не вводи рабочий ключ в веб-просмотре.",
    "settings.groq.storageHint":
      "Ключ хранится в защищённом системном хранилище Android и не добавляется в APK.",
    "settings.groq.sheetTitleUpdate": "Обновить ключ Groq",
    "settings.groq.sheetTitleAdd": "Добавить ключ Groq",
    "settings.groq.sheetHint":
      "Новый ключ заменит предыдущий на этом устройстве.",
    "settings.groq.saving": "Сохраняем…",
    "settings.groq.saveCta": "Сохранить на устройстве",

    "settings.googleFit.sectionTitle": "Активность и вес из Google Fit",
    "settings.googleFit.authError":
      "Не удалось авторизоваться в Google Fit. Проверь настройку OAuth-клиента и попробуй ещё раз.",
    "settings.googleFit.badgeReady": "ГОТОВ",
    "settings.googleFit.badgeUnauthorized": "НЕ АВТОРИЗОВАН",
    "settings.googleFit.badgeNotConfigured": "НЕ НАСТРОЕНО",
    "settings.googleFit.checking": "Проверяем Google Fit…",
    "settings.googleFit.connecting": "Подключаем…",
    "settings.googleFit.checkCta": "Проверить Google Fit",
    "settings.googleFit.connectCta": "Подключить Google Fit",
    "settings.googleFit.sourcePrimaryHint":
      "Google Fit — основной источник, Health Connect остаётся резервом.",
    "settings.googleFit.sourceBackupHint":
      "Health Connect выбран как основной, Google Fit подключён как резерв.",
    "settings.googleFit.oauthHint":
      "Для OAuth нужен Client ID типа Android с package name и SHA-1 подписи — пошаговая инструкция в docs/setup-google-fit.md. Пока клиент не настроен или Google Fit не авторизован, карточка «Активность» и взвешивания читаются через Health Connect.",
    "settings.healthSource.title": "Основной источник данных",
    "settings.healthSource.a11y": "Основной источник данных: {title}",

    "settings.health.sectionTitle": "Пульс со смарт-часов",
    "settings.health.badgeReady": "ГОТОВО",
    "settings.health.badgeHeartRate": "ПУЛЬС",
    "settings.health.badgeActivity": "АКТИВНОСТЬ",
    "settings.health.badgeNoAccess": "НЕТ ДОСТУПА",
    "settings.health.connectCta": "Подключить активность и пульс",
    "settings.health.checkCta": "Проверить Health Connect",
    "settings.health.lockScreenTitle": "Пульс на экране блокировки",
    "settings.health.lockScreenHintOn":
      "Текущая ЧСС видна рядом с целью во время отдыха.",
    "settings.health.lockScreenHintOff":
      "ЧСС скрыта из уведомления таймера отдыха.",
    "settings.health.hint":
      "IronRise читает шаги, активные калории, дистанцию и пульс и сохраняет сводные значения локально. Записи появляются после синхронизации приложения «Здоровье» с Health Connect.",
    "settings.health.checking": "Проверяем Health Connect…",

    "settings.bodyScale.sectionTitle": "Умные весы (OKOK · Health Connect)",
    "settings.bodyScale.cardTitle": "Вес и состав тела с весов",
    "settings.bodyScale.checking": "Проверяем умные весы…",
    "settings.bodyScale.googleFitRequired":
      "Подключите Google Fit — он основной источник взвешиваний. Health Connect остаётся резервом.",
    "settings.bodyScale.permissionRequired":
      "Разрешите IronRise читать вес и состав тела в Health Connect.",
    "settings.bodyScale.syncNeedsFit":
      "Подключи Google Fit, чтобы синхронизировать взвешивания.",
    "settings.bodyScale.syncNeedsScale":
      "Подключи весы, чтобы синхронизировать данные.",
    "settings.bodyScale.syncCreated": "Создано {count} взвешиваний",
    "settings.bodyScale.syncNoNew": "Новых взвешиваний нет.",
    "settings.bodyScale.syncError":
      "Не удалось синхронизировать данные весов. Попробуй ещё раз.",
    "settings.bodyScale.badgeGranted": "ПОДКЛЮЧЕНЫ",
    "settings.bodyScale.badgeNeedsPermission": "НУЖНЫ РАЗРЕШЕНИЯ",
    "settings.bodyScale.checkCta": "Проверить весы",
    "settings.bodyScale.connectCta": "Подключить весы",
    "settings.bodyScale.syncing": "Синхронизируем…",
    "settings.bodyScale.syncNowCta": "Синхронизировать сейчас",
    "settings.bodyScale.autoSyncTitle": "Автосинхронизация при запуске",
    "settings.bodyScale.autoSyncHintOn":
      "Взвешивания подтягиваются при запуске и на вкладке «Тело».",
    "settings.bodyScale.autoSyncHintOff":
      "Данные весов загружаются только по кнопке «Синхронизировать сейчас».",
    "settings.bodyScale.chainHint":
      "Цепочка данных: весы → OKOK International → Google Fit → Health Connect. Включите синхронизацию с Google Fit в настройках OKOK и тумблер «Синхронизировать Fit с Health Connect» в Google Fit — после этого взвешивания будут появляться здесь автоматически после каждого взвешивания на весах.",
    "settings.bodyScale.appHint":
      "Приложение OKOK International синхронизирует весы в Health Connect, IronRise читает вес и состав тела (жир, мышцы, кости, вода) и создаёт замеры автоматически. Если состав недоступен, сохранится только вес. Дубликаты на ту же дату с тем же весом не создаются.",

    "settings.storage.sectionTitle": "Локальное хранилище",
    "settings.storage.cardTitle": "Данные на этом устройстве",
    "settings.storage.calculating": "Считаем размер тренировок, фото и кэша…",
    "settings.storage.error":
      "Не удалось прочитать объём. Попробуйте обновить.",
    "settings.storage.hint":
      "Тренировки, настройки и офлайн-файлы хранятся только локально.",
    "settings.storage.refreshA11y": "Обновить объём хранилища",
    "settings.storage.appUsed": "ЗАНЯТО ПРИЛОЖЕНИЕМ",
    "settings.storage.deviceFree": "СВОБОДНО НА УСТРОЙСТВЕ",
    "settings.storage.appLine": "Приложение: {percent}%",
    "settings.storage.deviceLine": "Устройство: {used} / {total}",
    "settings.storage.workoutsLine": "Данные тренировок: {size}",
    "settings.storage.filesLine": "Файлы и офлайн-фото: {size}",

    "settings.backup.sectionTitle": "Резервная копия",
    "settings.backup.cardTitle": "Файл для переноса данных",
    "settings.backup.cardHint":
      "Сохраните ZIP через системное меню в «Загрузки» или другую папку телефона. Файл не удаляется вместе с приложением.",
    "settings.backup.savedTitle": "Резервная копия сохранена",
    "settings.backup.savedMessage":
      "Файл автоматически сохранён в выбранной папке. Его можно найти в списке резервных копий.{purged}",
    "settings.backup.purgedSuffix":
      " Внутренняя папка очищена: удалено старых копий — {count}.",
    "settings.backup.createErrorTitle": "Не удалось создать копию",
    "settings.backup.progressCreating": "Подготавливаем резервную копию…",
    "settings.backup.progressRestoring": "Подготавливаем восстановление…",
    "settings.backup.restoredTitle": "Данные восстановлены",
    "settings.backup.restoredMessage":
      "Полностью закройте и снова откройте IronRise, чтобы все экраны загрузили восстановленные данные.",
    "settings.backup.restoreErrorTitle": "Не удалось восстановить данные",
    "settings.backup.restoreErrorMessage": "Исходные данные не были изменены.",
    "settings.backup.reminderUpdateErrorTitle":
      "Не удалось обновить напоминание",
    "settings.backup.reminderUpdateErrorMessage":
      "Проверьте разрешение на уведомления и повторите попытку.",
    "settings.backup.confirmTitle": "Восстановить эту копию?",
    "settings.backup.confirmMessage":
      "Копия от {date}: {entries} записей и {photos} фото. Текущие локальные данные будут заменены.",
    "settings.backup.confirmRestore": "Восстановить",
    "settings.backup.badFileTitle": "Файл не подходит",
    "settings.backup.badFileMessage":
      "Выберите ZIP-файл резервной копии IronRise.",
    "settings.backup.folderErrorTitle": "Не удалось открыть папку",
    "settings.backup.folderErrorMessage":
      "Выберите папку с ZIP-копиями IronRise и повторите попытку.",
    "settings.backup.noCopyTitle": "Нет созданной копии",
    "settings.backup.noCopyMessage":
      "Сначала создайте резервную копию, затем её можно будет отправить в мессенджер или на почту.",
    "settings.backup.shareErrorTitle": "Не удалось открыть меню «Поделиться»",
    "settings.backup.lastPreview":
      "Последняя выбранная копия: {entries} записей · {photos} фото",
    "settings.backup.lastSuccess": "Последняя успешная копия: {date}",
    "settings.backup.never": "Резервная копия ещё не создавалась.",
    "settings.backup.reminderHintWeekly":
      "IronRise напомнит о новой копии раз в неделю системным уведомлением.",
    "settings.backup.reminderHintMonthly":
      "IronRise напомнит о новой копии раз в месяц системным уведомлением.",
    "settings.backup.reminderHintOff":
      "Системные напоминания о резервной копии отключены.",
    "settings.backup.reminderTitle": "Напоминать о копии",
    "settings.backup.reminderTime":
      "Системное уведомление в 10:00 по местному времени.",
    "settings.backup.frequencyWeekly": "Раз в неделю",
    "settings.backup.frequencyMonthly": "Раз в месяц",
    "settings.backup.busyCreating": "ПОДГОТОВКА…",
    "settings.backup.createCta": "СОЗДАТЬ КОПИЮ",
    "settings.backup.restoreFromFileCta": "ВОССТАНОВИТЬ ИЗ ФАЙЛА",
    "settings.backup.shareLatestCta": "ПОДЕЛИТЬСЯ ПОСЛЕДНЕЙ КОПИЕЙ",
    "settings.backup.recentTitle": "Три последние копии",
    "settings.backup.recentHint":
      "Выберите папку «Загрузки» или другую папку с ZIP-файлами IronRise. В списке показываются только три самые новые копии.",
    "settings.backup.chooseFolderBusy": "ПРОВЕРЯЕМ ПАПКУ…",
    "settings.backup.chooseFolderCta": "ВЫБРАТЬ ПАПКУ С КОПИЯМИ",
    "settings.backup.emptyList":
      "В доступных папках пока нет совместимых ZIP-копий.",
    "settings.backup.itemMeta": "{entries} записей · {photos} фото · {size}",
    "settings.backup.sourceFolder": "ПАПКА",
    "settings.backup.sourceApp": "В ПРИЛОЖЕНИИ",

    "settings.offline.sectionTitle": "Офлайн-фотографии",
    "settings.offline.downloadAll": "Скачать все ракурсы по Wi‑Fi",
    "settings.offline.wifiBadge": "Wi‑Fi",
    "settings.offline.loading": "Загружаем фотографии…",
    "settings.offline.downloadCta": "Скачать для офлайн-режима",
    "settings.offline.initialMessage":
      "Скачивай все фото по Wi‑Fi для просмотра без интернета.",
    "settings.offline.checkingWifi": "Проверяем подключение Wi‑Fi…",
    "settings.offline.progress": "Загружено {completed} из {total} фотографий…",
    "settings.offline.hint":
      "Загрузка запускается только через Wi‑Fi с доступом в интернет. Мобильные данные не используются.",

    "settings.tools.sectionTitle": "Данные и инструменты",
    "settings.tools.note":
      "Тренировки, настройки, рекорды и экспортируемые файлы сохраняются на этом устройстве. Для переноса используйте экспорт в CSV или ZIP.",

    "settings.about.sectionTitle": "О приложении",
    "settings.about.version": "Версия {version}",
    "settings.about.tagline": "Дневник тренировок, питания и прогресса",

    "settings.links.barbell.title": "Профиль штанги и блинов",
    "settings.links.barbell.subtitle": "Вес грифа и доступные номиналы",
    "settings.links.recommendations.title": "Рекомендации следующей тренировки",
    "settings.links.recommendations.subtitle":
      "Рабочий вес с объяснением расчёта",
    "settings.links.progress.title": "График прогресса 1RM",
    "settings.links.progress.subtitle":
      "Изменение силового показателя по датам",
    "settings.links.export.title": "Экспорт истории CSV",
    "settings.links.export.subtitle": "Файл для Excel и других таблиц",
    "settings.links.import.title": "Импорт истории CSV",
    "settings.links.import.subtitle": "Загрузка подходов из других приложений",
    "settings.links.compare.title": "Сравнение тренировок",
    "settings.links.compare.subtitle": "Объём, длительность и прогресс 1RM",
    "settings.links.report.title": "Месячный PDF-отчёт",
    "settings.links.report.subtitle": "Красивые итоги и таблица подходов",
  },
  en: {
    "settings.header.title": "Settings",
    "settings.search.placeholder": "Search settings",
    "settings.search.clearA11y": "Clear settings search",
    "settings.search.resultHint": "Matching categories: {categories}",
    "settings.search.emptyHint": "Nothing found. Try another query.",
    "settings.search.emptyTitle": "Nothing found",
    "settings.search.emptyExamples":
      "Try “vibration”, “calories”, “notifications” or “export”.",
    "settings.search.clearCta": "CLEAR SEARCH",

    "settings.category.training": "Training",
    "settings.category.home": "Home screen",
    "settings.category.appearance": "Appearance",
    "settings.category.body": "Nutrition & body",
    "settings.category.reminders": "Reminders",
    "settings.category.data": "Data & services",

    "settings.common.cancel": "Cancel",
    "settings.common.delete": "Delete",
    "settings.common.retry": "Try again.",
    "settings.common.retryFormal": "Please try again.",
    "settings.common.retryFormalShort": "Please try again.",

    "settings.language.sectionTitle": "Language / Язык",
    "settings.language.optionRu": "Русский",
    "settings.language.optionEn": "English",
    "settings.language.hint":
      "Applies instantly to every screen and is saved on this device.",
    "settings.language.selectedA11y": "Selected language: {language}",

    "settings.strength.sectionTitle": "Strength estimate",
    "settings.strength.formulaTitle": "1RM formula",
    "settings.strength.formulaHint":
      "The choice applies to load zones, history and personal records.",
    "settings.strength.formula.epley.title": "Epley",
    "settings.strength.formula.epley.formula": "Weight × (1 + reps / 30)",
    "settings.strength.formula.epley.description":
      "A universal estimate for most working sets.",
    "settings.strength.formula.brzycki.title": "Brzycki",
    "settings.strength.formula.brzycki.formula": "Weight × 36 / (37 − reps)",
    "settings.strength.formula.brzycki.description":
      "Handy for a low rep range.",
    "settings.strength.stepWeightLabel": "WEIGHT STEP",
    "settings.strength.stepKg": "{step} kg",

    "settings.appearance.themeTitle": "Interface style",
    "settings.appearance.themeSubtitle": "Light or dark theme",
    "settings.appearance.themeHint":
      "Choose the app appearance. The choice is saved on this device and applies to every screen.",
    "settings.appearance.themeLightBadge": "LIGHT",
    "settings.appearance.themeDarkBadge": "DARK",
    "settings.appearance.themeLightHint": "Cream background, contrast text",
    "settings.appearance.themeDarkHint": "Graphite background, soft light",
    "settings.appearance.variantsTitle": "Design variants",
    "settings.appearance.variantsHint":
      "Ready-made looks from the clickable prototypes. The choice is saved on this device and applies to every screen.",
    "settings.appearance.densityTitle": "Interface density",
    "settings.appearance.densitySubtitle":
      "Text size and spacing between blocks",
    "settings.appearance.densityHint":
      "Pick the layout that feels better for training and reading stats.",
    "settings.appearance.svgTitle": "SVG icons",
    "settings.appearance.svgColorTitle": "Interface icon color",
    "settings.appearance.svgColorHint":
      "Changes accent SVG icons in the web version without reloading fonts.",

    "settings.nutrition.sectionTitle": "Nutrition",
    "settings.nutrition.activityTitle": "Everyday activity",
    "settings.nutrition.activityHint":
      "The choice affects the “Movement” line of the total calorie burn on the home screen. Training is counted separately.",
    "settings.nutrition.goalsTitle": "Daily calorie and macro goals",
    "settings.nutrition.goalsHint":
      "The daily calorie plan and macro goals are saved on this device and used in the nutrition diary progress.",
    "settings.nutrition.autoGuideBadge": "AUTOMATIC GUIDANCE",
    "settings.nutrition.autoGuideMissing":
      "Profile, age, height and weight required",
    "settings.nutrition.autoGuideValue": "{calories} kcal / day",
    "settings.nutrition.autoGuideWeightSource":
      "Weight is taken from the latest measurement on the “Body” tab.",
    "settings.nutrition.autoGuideFormula":
      "Mifflin–St Jeor × 1.4 · maintenance guidance, not a medical prescription.",
    "settings.nutrition.applyGuide": "APPLY",
    "settings.nutrition.calorieGoalLabel": "Goal, kcal",
    "settings.nutrition.proteinLabel": "Protein, g",
    "settings.nutrition.fatLabel": "Fat, g",
    "settings.nutrition.carbsLabel": "Carbs, g",

    "settings.home.sectionTitle": "Home screen",
    "settings.home.widgetsTitle": "Widgets on the “Today” screen",
    "settings.home.widgetsHint":
      "Drag the ⠿ handle to change the order. The main block with the daily plan always stays.",
    "settings.home.dragHapticsTitle": "Haptic feedback on drag",
    "settings.home.dragHapticsHintOn":
      "A light confirmation when a widget is grabbed.",
    "settings.home.dragHapticsHintOff":
      "Grabbing a widget happens without vibration.",
    "settings.home.resetWidgetsConfirmTitle": "Reset widgets?",
    "settings.home.resetWidgetsConfirmMessage":
      "The original order, normal size and visibility of all blocks will return.",
    "settings.home.resetWidgetsConfirmAction": "Reset",
    "settings.home.resetWidgetsCta": "RESET WIDGET SETTINGS",
    "settings.home.tabsTitle": "Bottom bar tabs",
    "settings.home.tabsHint":
      "Drag the ⠿ handle to change the order. Hidden sections disappear from the bottom navigation and swipes. “Home”, “Plan” and “Settings” always stay available.",
    "settings.home.compactMode": "Compact mode",
    "settings.home.compactHintOn": "Icons only — more room for screens.",
    "settings.home.compactHintOff": "Icons and short tab names.",
    "settings.home.resetTabsConfirmTitle": "Bring back all tabs?",
    "settings.home.resetTabsConfirmMessage":
      "The original order and labels return, and all optional sections appear in the bottom bar again.",
    "settings.home.resetTabsConfirmAction": "Restore",
    "settings.home.showAllTabsCta": "SHOW ALL TABS",
    "settings.home.compactBadge": "Compact mode",
    "settings.home.normalSizeBadge": "Normal size",
    "settings.home.alwaysAvailable": "Always available",

    "settings.restTimer.sectionTitle": "Rest timer",
    "settings.restTimer.soundTitle": "Rest completion sound",
    "settings.restTimer.soundHintOn":
      "Pick a signal for the Android notification when rest ends.",
    "settings.restTimer.soundHintOff": "Rest will end without a sound signal.",
    "settings.restTimer.signalTitle": "Completion signal",
    "settings.restTimer.previewCta": "Preview the signal",
    "settings.restTimer.vibrationTitle": "Vibration with the sound",
    "settings.restTimer.vibrationHintOn":
      "A short haptic signal will complement the rest completion sound.",
    "settings.restTimer.vibrationHintOff": "Rest will end with sound only.",
    "settings.restTimer.vibrationHintDisabled":
      "Turn on the rest completion sound first.",
    "settings.restTimer.vibrationPatternTitle": "Vibration pattern",
    "settings.restTimer.setHapticTitle": "Vibration on set completion",
    "settings.restTimer.setHapticHint":
      "The intensity is saved on this device. Vibration does not run in the web preview.",
    "settings.restTimer.volumeTitle": "Signal volume",
    "settings.restTimer.volumeA11y": "Signal volume {percent} percent",
    "settings.restTimer.volumeHint":
      "Adjusts IronRise volume within the available Android system level.",
    "settings.restTimer.soundOption.female.title": "Female voice",
    "settings.restTimer.soundOption.female.description":
      "A short voice command about the end of rest",
    "settings.restTimer.soundOption.male.title": "Male voice",
    "settings.restTimer.soundOption.male.description":
      "A confident voice command about the next set",
    "settings.restTimer.soundOption.siren.title": "Siren",
    "settings.restTimer.soundOption.siren.description":
      "A short, noticeable electronic signal",
    "settings.restTimer.vibrationOption.short.title": "Short",
    "settings.restTimer.vibrationOption.short.description": "One short pulse",
    "settings.restTimer.vibrationOption.long.title": "Long",
    "settings.restTimer.vibrationOption.long.description":
      "One noticeable long pulse",
    "settings.restTimer.vibrationOption.pulse.title": "Pulsing",
    "settings.restTimer.vibrationOption.pulse.description":
      "Three short pulses in a row",
    "settings.hapticOption.light.title": "Light",
    "settings.hapticOption.light.description": "A short, delicate confirmation",
    "settings.hapticOption.medium.title": "Medium",
    "settings.hapticOption.medium.description": "A more noticeable response",
    "settings.hapticOption.heavy.title": "Strong",
    "settings.hapticOption.heavy.description": "A pronounced confirmation",

    "settings.reminders.sectionTitle": "Workout reminders",
    "settings.reminders.localTitle": "Local notifications",
    "settings.reminders.localHintOn":
      "New calendar plans will get a reminder with these settings.",
    "settings.reminders.localHintOff":
      "New plans are saved without a system reminder.",
    "settings.reminders.defaultTime": "Default time",
    "settings.reminders.remindBefore": "Remind in advance",
    "settings.reminders.minutesShort": "{minutes}m",

    "settings.bodyweight.sectionTitle": "Bodyweight exercises",
    "settings.bodyweight.hint":
      "For volume the app uses a given share of body mass: for example squats or push-ups.",
    "settings.bodyweight.weightLabel": "Body weight, kg",
    "settings.bodyweight.percentLabel": "Count, %",

    "settings.bodyProfile.sectionTitle": "Body profile",
    "settings.bodyProfile.cardTitle": "Silhouette and estimates",
    "settings.bodyProfile.cardHint":
      "Profile, height and age are used only in local BMI and calorie guidance estimates.",
    "settings.bodyProfile.male": "Male",
    "settings.bodyProfile.maleHint": "Wide shoulders · narrow waist",
    "settings.bodyProfile.female": "Female",
    "settings.bodyProfile.femaleHint": "Soft shoulder line · focus on the hips",
    "settings.bodyProfile.height": "Height, cm",
    "settings.bodyProfile.age": "Age, years",
    "settings.bodyGoals.sectionTitle": "Body parameter goals",
    "settings.bodyGoals.cardTitle": "Weight and girths",
    "settings.bodyGoals.hint":
      "Target lines will appear in the charts on the “Body” tab. Leave a field empty to hide the guidance.",

    "settings.groq.sectionTitle": "Personal Groq API key",
    "settings.groq.saveErrorTitle": "Could not save the key",
    "settings.groq.deleteConfirmTitle": "Delete the personal Groq key?",
    "settings.groq.deleteConfirmMessage":
      "AI mode will be unavailable until you add a new key.",
    "settings.groq.deleteErrorTitle": "Could not delete the key",
    "settings.groq.keySavedHint":
      "The key is saved on this device. You can replace it at any time.",
    "settings.groq.keyMissingHint":
      "Add a key to create programs through Groq AI.",
    "settings.groq.badgeReady": "READY",
    "settings.groq.badgeMissing": "NO KEY",
    "settings.groq.updateCta": "Update key",
    "settings.groq.addCta": "Add key",
    "settings.groq.webHint": "Do not enter a live key in the web preview.",
    "settings.groq.storageHint":
      "The key is stored in Android secure system storage and is not added to the APK.",
    "settings.groq.sheetTitleUpdate": "Update Groq key",
    "settings.groq.sheetTitleAdd": "Add Groq key",
    "settings.groq.sheetHint":
      "A new key replaces the previous one on this device.",
    "settings.groq.saving": "Saving…",
    "settings.groq.saveCta": "Save on this device",

    "settings.googleFit.sectionTitle": "Activity and weight from Google Fit",
    "settings.googleFit.authError":
      "Could not sign in to Google Fit. Check the OAuth client setup and try again.",
    "settings.googleFit.badgeReady": "READY",
    "settings.googleFit.badgeUnauthorized": "NOT AUTHORIZED",
    "settings.googleFit.badgeNotConfigured": "NOT CONFIGURED",
    "settings.googleFit.checking": "Checking Google Fit…",
    "settings.googleFit.connecting": "Connecting…",
    "settings.googleFit.checkCta": "Check Google Fit",
    "settings.googleFit.connectCta": "Connect Google Fit",
    "settings.googleFit.sourcePrimaryHint":
      "Google Fit is the primary source, Health Connect stays as backup.",
    "settings.googleFit.sourceBackupHint":
      "Health Connect is selected as primary, Google Fit is connected as backup.",
    "settings.googleFit.oauthHint":
      "OAuth needs an Android-type Client ID with the package name and the signing SHA-1 — a step-by-step guide is in docs/setup-google-fit.md. While the client is not configured or Google Fit is not authorized, the “Activity” card and weigh-ins are read through Health Connect.",
    "settings.healthSource.title": "Primary data source",
    "settings.healthSource.a11y": "Primary data source: {title}",

    "settings.health.sectionTitle": "Heart rate from a smartwatch",
    "settings.health.badgeReady": "READY",
    "settings.health.badgeHeartRate": "HEART RATE",
    "settings.health.badgeActivity": "ACTIVITY",
    "settings.health.badgeNoAccess": "NO ACCESS",
    "settings.health.connectCta": "Connect activity and heart rate",
    "settings.health.checkCta": "Check Health Connect",
    "settings.health.lockScreenTitle": "Heart rate on the lock screen",
    "settings.health.lockScreenHintOn":
      "Current heart rate is visible next to the target during rest.",
    "settings.health.lockScreenHintOff":
      "Heart rate is hidden from the rest timer notification.",
    "settings.health.hint":
      "IronRise reads steps, active calories, distance and heart rate and stores summary values locally. Records appear after the “Health” app syncs with Health Connect.",
    "settings.health.checking": "Checking Health Connect…",

    "settings.bodyScale.sectionTitle": "Smart scale (OKOK · Health Connect)",
    "settings.bodyScale.cardTitle":
      "Weight and body composition from the scale",
    "settings.bodyScale.checking": "Checking the smart scale…",
    "settings.bodyScale.googleFitRequired":
      "Connect Google Fit — it is the primary source of weigh-ins. Health Connect stays as backup.",
    "settings.bodyScale.permissionRequired":
      "Allow IronRise to read weight and body composition in Health Connect.",
    "settings.bodyScale.syncNeedsFit": "Connect Google Fit to sync weigh-ins.",
    "settings.bodyScale.syncNeedsScale": "Connect the scale to sync the data.",
    "settings.bodyScale.syncCreated": "{count} weigh-ins created",
    "settings.bodyScale.syncNoNew": "No new weigh-ins.",
    "settings.bodyScale.syncError": "Could not sync the scale data. Try again.",
    "settings.bodyScale.badgeGranted": "CONNECTED",
    "settings.bodyScale.badgeNeedsPermission": "PERMISSIONS NEEDED",
    "settings.bodyScale.checkCta": "Check the scale",
    "settings.bodyScale.connectCta": "Connect the scale",
    "settings.bodyScale.syncing": "Syncing…",
    "settings.bodyScale.syncNowCta": "Sync now",
    "settings.bodyScale.autoSyncTitle": "Auto-sync on launch",
    "settings.bodyScale.autoSyncHintOn":
      "Weigh-ins are pulled on launch and on the “Body” tab.",
    "settings.bodyScale.autoSyncHintOff":
      "Scale data is loaded only with the “Sync now” button.",
    "settings.bodyScale.chainHint":
      "Data chain: scale → OKOK International → Google Fit → Health Connect. Enable Google Fit sync in the OKOK settings and the “Sync Fit with Health Connect” toggle in Google Fit — after that weigh-ins will appear here automatically after every weighing.",
    "settings.bodyScale.appHint":
      "The OKOK International app syncs the scale to Health Connect, IronRise reads weight and body composition (fat, muscle, bone, water) and creates measurements automatically. If composition is unavailable, only weight is saved. Duplicates for the same date with the same weight are not created.",

    "settings.storage.sectionTitle": "Local storage",
    "settings.storage.cardTitle": "Data on this device",
    "settings.storage.calculating": "Measuring workouts, photos and cache…",
    "settings.storage.error": "Could not read the size. Try refreshing.",
    "settings.storage.hint":
      "Workouts, settings and offline files are stored locally only.",
    "settings.storage.refreshA11y": "Refresh storage usage",
    "settings.storage.appUsed": "USED BY THE APP",
    "settings.storage.deviceFree": "FREE ON THE DEVICE",
    "settings.storage.appLine": "App: {percent}%",
    "settings.storage.deviceLine": "Device: {used} / {total}",
    "settings.storage.workoutsLine": "Workout data: {size}",
    "settings.storage.filesLine": "Files and offline photos: {size}",

    "settings.backup.sectionTitle": "Backup",
    "settings.backup.cardTitle": "File to move your data",
    "settings.backup.cardHint":
      "Save the ZIP through the system menu into “Downloads” or another phone folder. The file is not deleted together with the app.",
    "settings.backup.savedTitle": "Backup saved",
    "settings.backup.savedMessage":
      "The file was saved automatically in the selected folder. You can find it in the backup list.{purged}",
    "settings.backup.purgedSuffix":
      " The internal folder was cleaned up: old copies removed — {count}.",
    "settings.backup.createErrorTitle": "Could not create the backup",
    "settings.backup.progressCreating": "Preparing the backup…",
    "settings.backup.progressRestoring": "Preparing the restore…",
    "settings.backup.restoredTitle": "Data restored",
    "settings.backup.restoredMessage":
      "Close IronRise completely and open it again so every screen loads the restored data.",
    "settings.backup.restoreErrorTitle": "Could not restore the data",
    "settings.backup.restoreErrorMessage": "The original data was not changed.",
    "settings.backup.reminderUpdateErrorTitle": "Could not update the reminder",
    "settings.backup.reminderUpdateErrorMessage":
      "Check the notification permission and try again.",
    "settings.backup.confirmTitle": "Restore this backup?",
    "settings.backup.confirmMessage":
      "Backup from {date}: {entries} records and {photos} photos. The current local data will be replaced.",
    "settings.backup.confirmRestore": "Restore",
    "settings.backup.badFileTitle": "The file is not suitable",
    "settings.backup.badFileMessage": "Choose an IronRise backup ZIP file.",
    "settings.backup.folderErrorTitle": "Could not open the folder",
    "settings.backup.folderErrorMessage":
      "Choose a folder with IronRise ZIP backups and try again.",
    "settings.backup.noCopyTitle": "No backup created yet",
    "settings.backup.noCopyMessage":
      "Create a backup first, then you can send it to a messenger or by email.",
    "settings.backup.shareErrorTitle": "Could not open the “Share” menu",
    "settings.backup.lastPreview":
      "Last selected backup: {entries} records · {photos} photos",
    "settings.backup.lastSuccess": "Last successful backup: {date}",
    "settings.backup.never": "No backup has been created yet.",
    "settings.backup.reminderHintWeekly":
      "IronRise will remind you about a new backup once a week with a system notification.",
    "settings.backup.reminderHintMonthly":
      "IronRise will remind you about a new backup once a month with a system notification.",
    "settings.backup.reminderHintOff":
      "System backup reminders are turned off.",
    "settings.backup.reminderTitle": "Remind about the backup",
    "settings.backup.reminderTime": "System notification at 10:00 local time.",
    "settings.backup.frequencyWeekly": "Once a week",
    "settings.backup.frequencyMonthly": "Once a month",
    "settings.backup.busyCreating": "PREPARING…",
    "settings.backup.createCta": "CREATE BACKUP",
    "settings.backup.restoreFromFileCta": "RESTORE FROM FILE",
    "settings.backup.shareLatestCta": "SHARE THE LATEST BACKUP",
    "settings.backup.recentTitle": "The three latest backups",
    "settings.backup.recentHint":
      "Choose the “Downloads” folder or another folder with IronRise ZIP files. The list shows only the three newest backups.",
    "settings.backup.chooseFolderBusy": "CHECKING THE FOLDER…",
    "settings.backup.chooseFolderCta": "CHOOSE A FOLDER WITH BACKUPS",
    "settings.backup.emptyList":
      "There are no compatible ZIP backups in the available folders yet.",
    "settings.backup.itemMeta": "{entries} records · {photos} photos · {size}",
    "settings.backup.sourceFolder": "FOLDER",
    "settings.backup.sourceApp": "IN THE APP",

    "settings.offline.sectionTitle": "Offline photos",
    "settings.offline.downloadAll": "Download all angles over Wi‑Fi",
    "settings.offline.wifiBadge": "Wi‑Fi",
    "settings.offline.loading": "Downloading photos…",
    "settings.offline.downloadCta": "Download for offline use",
    "settings.offline.initialMessage":
      "Download all photos over Wi‑Fi to view them without the internet.",
    "settings.offline.checkingWifi": "Checking the Wi‑Fi connection…",
    "settings.offline.progress": "Downloaded {completed} of {total} photos…",
    "settings.offline.hint":
      "The download starts only over Wi‑Fi with internet access. Mobile data is not used.",

    "settings.tools.sectionTitle": "Data and tools",
    "settings.tools.note":
      "Workouts, settings, records and exported files are stored on this device. To move them, use CSV or ZIP export.",

    "settings.about.sectionTitle": "About the app",
    "settings.about.version": "Version {version}",
    "settings.about.tagline": "Workout, nutrition and progress diary",

    "settings.links.barbell.title": "Barbell and plate profile",
    "settings.links.barbell.subtitle":
      "Bar weight and available plate denominations",
    "settings.links.recommendations.title": "Next workout recommendations",
    "settings.links.recommendations.subtitle":
      "Working weight with the calculation explained",
    "settings.links.progress.title": "1RM progress chart",
    "settings.links.progress.subtitle":
      "How the strength figure changes by date",
    "settings.links.export.title": "Export history to CSV",
    "settings.links.export.subtitle": "A file for Excel and other sheets",
    "settings.links.import.title": "Import history from CSV",
    "settings.links.import.subtitle": "Load sets from other apps",
    "settings.links.compare.title": "Compare workouts",
    "settings.links.compare.subtitle": "Volume, duration and 1RM progress",
    "settings.links.report.title": "Monthly PDF report",
    "settings.links.report.subtitle": "Beautiful summaries and a set table",
  },
});
