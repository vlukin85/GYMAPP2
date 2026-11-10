import { defineDomain } from "../types";

// Домен «Программы»: вкладка «Программы» (app/(tabs)/programs.tsx), конструктор
// (app/program/new.tsx), ИИ-генерация (app/program/ai.tsx) и экран рекомендаций
// следующей тренировки (app/recommendations.tsx).
//
// Плейсхолдеры: {name}, {count}, {program}, {seconds}, {sets}, {reps}, {weight},
// {value}, {percent}, {step}, {rest}, {superset}, {extra}.
export const programs = defineDomain({
  ru: {
    "programs.tab.title": "Программы",
    "programs.tab.subtitle":
      "Собирай тренировки под цель и повторяй их с прогрессом.",
    "programs.tab.sectionTitle": "Твои планы",
    "programs.tab.aiTitle": "ИИ-конструктор",
    "programs.tab.aiCta": "Сгенерировать программу",
    "programs.tab.aiHint":
      "Опиши цель, затем доработай упражнения и подходы.",
    "programs.tab.exportTitle": "Экспорт ZIP",
    "programs.tab.filterAll": "Все",
    "programs.tab.toArchive": "В архив",
    "programs.tab.fromArchive": "Вернуть из архива",
    "programs.tab.archiveSection": "Архив программ",
    "programs.tab.archiveCount": "Архив · {count}",
    "programs.tab.archivedBadge": " · В архиве",
    "programs.tab.create": "＋  Создать новую программу",
    "programs.tab.createHint": "Настрой упражнения, вес, повторы и отдых",
    "programs.tab.start": "Начать",
    "programs.tab.edit": "Редактировать",
    "programs.tab.rename": "Переименовать",
    "programs.tab.cover": "Обложка",
    "programs.tab.delete": "Удалить",
    "programs.tab.hidden": "Скрыта из списка",
    "programs.tab.undoHint": "Можно отменить в течение 5 секунд",
    "programs.tab.undo": "Отменить",
    "programs.tab.searchPlaceholder": "Поиск по названию",
    "programs.tab.emptySearchTitle": "Ничего не найдено",
    "programs.tab.emptySearchHint":
      "Измени запрос или вернись к общему списку.",
    "programs.tab.emptyListTitle": "Список программ пуст",
    "programs.tab.emptyListHint":
      "Создай программу вручную, с помощью ИИ или импортируй готовый файл.",
    "programs.tab.noProgramsTitle": "Нет программ",
    "programs.tab.noProgramsMessage":
      "Сначала создайте или восстановите хотя бы одну программу.",
    "programs.tab.backToAll": "← Ко всем программам",
    "programs.tab.sortNewest": "Сначала новые",
    "programs.tab.sortOldest": "Сначала старые",
    "programs.tab.import": "Импорт",
    "programs.tab.importBusy": "Читаем…",
    "programs.tab.done": "Готово",
    "programs.tab.choose": "Выбрать",
    "programs.tab.cancel": "Отмена",
    "programs.tab.save": "Сохранить",
    "programs.tab.renameTitle": "Название программы",
    "programs.tab.coverTitle": "Обложка: {name}",
    "programs.tab.deleteTitle": "Удалить программу?",
    "programs.tab.deleteMessage":
      "«{name}» будет скрыта из списка. У вас будет {seconds} секунд, чтобы отменить удаление.",
    "programs.tab.importedTitle": "Импорт завершён",
    "programs.tab.importedMessage": "Добавлено программ: {count}.{extra}",
    "programs.tab.importedRestored": " Восстановлено изображений: {count}.",
    "programs.tab.importedSkipped": " Пропущено повторов: {count}.",
    "programs.tab.importReadErrorTitle": "Не удалось прочитать файл",
    "programs.tab.createdAt": "Создано {date}",
    "programs.tab.cardMeta": "{count} упражнения  ·  {sets} подходов",
    "programs.tab.selectedCount": "Выбрано: {count}",
    "programs.tab.deletedToast": "«{name}» удалена",
    "programs.tab.renamePlaceholder": "Например, Верх тела · Сила",
    "programs.tab.importFailedTitle": "Импорт не выполнен",
    "programs.tab.importReadError":
      "Выберите экспортированный ZIP или JSON-файл программ Дневника тренировок.",
    "programs.tab.tooLargeTitle": "Файл слишком большой",
    "programs.tab.tooLargeMessage":
      "Выберите ZIP или JSON-файл программ размером до 24 МБ.",
    // Ошибки разбора файла обмена — их отдаёт lib/program-exchange.ts.
    "programs.exchange.invalidJson": "Файл не содержит корректный JSON.",
    "programs.exchange.unsupportedFormat":
      "Неподдерживаемый формат файла программ.",
    "programs.exchange.noCompatible": "В файле нет совместимых программ.",
    "programs.tab.exportErrorTitle": "Не удалось экспортировать",
    "programs.tab.exportErrorMessage":
      "Попробуйте ещё раз — программы не были изменены.",
    "programs.tab.shareUnavailable":
      "На этом устройстве недоступно системное меню обмена файлами.",
    "programs.tab.shareTitle": "Поделиться программами",
    "programs.tab.fileReadyTitle": "Файл подготовлен",
    "programs.tab.fileReadyMessage":
      "Браузер начал скачивание файла программ.",

    "programs.builder.navNew": "Новая программа",
    "programs.builder.navEdit": "Редактирование",
    "programs.builder.saveTop": "Сохранить",
    "programs.builder.titleNew": "Собери свой план",
    "programs.builder.titleEdit": "Настрой программу",
    "programs.builder.subtitle":
      "Добавьте упражнения из каталога и заполните параметры прямо в каждой карточке.",
    "programs.builder.nameLabel": "НАЗВАНИЕ",
    "programs.builder.defaultName": "Моя тренировка",
    "programs.builder.exercises": "Упражнения · {count}",
    "programs.builder.durationTitle": "Расчётное время тренировки",
    "programs.builder.durationIncomplete":
      "Заполните все параметры и интервалы отдыха, чтобы рассчитать длительность.",
    "programs.builder.durationHint":
      "С учётом примерно {seconds} сек на повторение, отдыха между подходами и между упражнениями.",
    "programs.builder.selectedHint":
      "Заполните все поля в карточках. Нажмите ×, чтобы убрать упражнение из программы.",
    "programs.builder.mine": " · Моё",
    "programs.builder.supersetBadge": " · SS A",
    "programs.builder.sets": "Сеты",
    "programs.builder.reps": "Повторы",
    "programs.builder.weightKg": "Вес, кг",
    "programs.builder.restSec": "Отдых, сек",
    "programs.builder.restBetweenTitle": "Отдых между упражнениями",
    "programs.builder.restBetweenHint":
      "Обязательный интервал после последнего подхода",
    "programs.builder.secPlaceholder": "сек",
    "programs.builder.sec": "сек",
    "programs.builder.supersetOn": "Суперсет A включён",
    "programs.builder.supersetOff": "Объединить первые два упражнения",
    "programs.builder.supersetOnHint":
      "Они выполняются подряд без отдыха между ними.",
    "programs.builder.supersetOffHint": "Нажмите, чтобы создать суперсет A.",
    "programs.builder.catalogTitle": "Добавить из каталога",
    "programs.builder.catalogHint":
      "В списке только ещё не выбранные упражнения. Параметры заполняются после добавления.",
    "programs.builder.searchPlaceholder": "Поиск упражнения",
    "programs.builder.emptySearch":
      "Ничего не найдено. Измените запрос или добавьте упражнение в каталоге.",
    "programs.builder.emptyAll":
      "Все доступные упражнения уже добавлены в программу.",
    "programs.builder.setTypeLabel": "ТИП НОВЫХ ПОДХОДОВ",
    "programs.builder.setType.warmup": "Разминка",
    "programs.builder.setType.working": "Рабочий",
    "programs.builder.setType.drop": "Дроп-сет",
    "programs.builder.setType.failure": "Отказной",
    "programs.builder.saveChanges": "Сохранить изменения",
    "programs.builder.saveProgram": "Сохранить программу",
    "programs.builder.validationTitle": "Проверьте программу",
    "programs.builder.validationMessage":
      "Укажите название и добавьте хотя бы одно упражнение.",
    "programs.builder.paramsTitle": "Заполните параметры",
    "programs.builder.paramsMessage":
      "Укажите сеты, повторы, вес и отдых между подходами для упражнения «{name}».",
    "programs.builder.restTitle": "Заполните интервалы отдыха",
    "programs.builder.restMessage":
      "Укажите отдых между «{name}» и следующим упражнением.",
    "programs.builder.description": "{count} упражнения · {rest}{superset}собственный план",
    "programs.builder.descriptionRest": "{count} блока отдыха · ",
    "programs.builder.descriptionSuperset": "1 суперсет · ",
    "programs.builder.backA11y": "Назад",

    "programs.ai.navTitle": "Конструктор программ",
    "programs.ai.eyebrow": "GROQ + ЛОКАЛЬНЫЙ РЕЖИМ",
    "programs.ai.title": "Программа под твой запрос",
    "programs.ai.subtitle":
      "Groq создаёт черновик по твоему описанию, а локальный конструктор работает без сети. Перед сохранением можно отредактировать каждое упражнение.",
    "programs.ai.modeTitle": "Режим генерации",
    "programs.ai.modeBadge.groq": "GROQ",
    "programs.ai.modeBadge.local": "ОФЛАЙН",
    "programs.ai.modeButton.groq": "Groq AI",
    "programs.ai.modeButton.local": "Локально",
    "programs.ai.keyWebHint":
      "В веб-просмотре ключ хранится только для тестирования.",
    "programs.ai.keyNativeHint":
      "Ключ шифруется в защищённом хранилище Android.",
    "programs.ai.keyChange": "Изменить",
    "programs.ai.keyAdd": "Добавить",
    "programs.ai.keyDelete": "Удалить",
    "programs.ai.promptTitle": "Твой запрос",
    "programs.ai.promptPlaceholder":
      "Например: 3 тренировки в неделю для силы, без тяжёлой осевой нагрузки",
    "programs.ai.promptDefault":
      "Хочу программу для роста силы и мышц всего тела без перегрузки, с акцентом на базовые упражнения.",
    "programs.ai.levelLabel": "УРОВЕНЬ",
    "programs.ai.equipmentLabel": "ОБОРУДОВАНИЕ",
    "programs.ai.daysLabel": "ДНЕЙ В НЕДЕЛЮ",
    "programs.ai.durationLabel": "ДЛИТЕЛЬНОСТЬ",
    "programs.ai.limitationsLabel": "ОГРАНИЧЕНИЯ И ПОЖЕЛАНИЯ",
    "programs.ai.limitationsPlaceholder":
      "Например: не включать бег, предпочитаю тренажёры",
    "programs.ai.safetyTitle": "Проверяй план перед тренировкой",
    "programs.ai.safetyText":
      "Конструктор формирует редактируемый шаблон, а не медицинское назначение. При боли, травме или заболевании согласуй нагрузку со специалистом.",
    "programs.ai.generateBusy": "Groq формирует программу…",
    "programs.ai.generateGroq": "Сгенерировать через Groq",
    "programs.ai.generateLocal": "Собрать программу на устройстве",
    "programs.ai.experience.novice": "Новичок",
    "programs.ai.experience.intermediate": "Средний",
    "programs.ai.experience.advanced": "Продвинутый",
    "programs.ai.equipmentOption.fullGym": "Весь зал",
    "programs.ai.equipmentOption.machines": "Тренажёры",
    "programs.ai.equipmentOption.freeWeights": "Свободные веса",
    "programs.ai.equipmentOption.home": "Дом",
    "programs.ai.builderTitle": "Умный конструктор",
    "programs.ai.builderHint": "Настрой детали до сохранения.",
    "programs.ai.draftBadge": "ЧЕРНОВИК",
    "programs.ai.nameLabel": "НАЗВАНИЕ ПРОГРАММЫ",
    "programs.ai.exerciseFallback": "Упражнение",
    "programs.ai.remove": "Удалить",
    "programs.ai.replace": "Заменить",
    "programs.ai.setTypeShort.working": "Раб.",
    "programs.ai.setTypeShort.warmup": "Разм.",
    "programs.ai.setTypeShort.drop": "Дроп",
    "programs.ai.setTypeShort.failure": "Отказ",
    "programs.ai.field.sets": "Подходы",
    "programs.ai.field.reps": "Повторы",
    "programs.ai.field.weight": "Вес, кг",
    "programs.ai.field.rest": "Отдых, сек",
    "programs.ai.addExercise": "＋ Добавить упражнение",
    "programs.ai.saveToMy": "Сохранить в «Мои программы»",
    "programs.ai.keySheetTitle": "Личный ключ Groq",
    "programs.ai.keySheetHint": "Он нужен только для ИИ-режима генерации.",
    "programs.ai.keyPrivacyWeb":
      "В Android-сборке ключ хранится в зашифрованном системном хранилище. В веб-просмотре не вводи рабочий ключ.",
    "programs.ai.keyPrivacyNative":
      "Ключ не добавляется в APK, не отправляется в данные тренировок и хранится в зашифрованном системном хранилище Android.",
    "programs.ai.keySaving": "Сохраняем…",
    "programs.ai.keySave": "Сохранить ключ на устройстве",
    "programs.ai.pickerAddTitle": "Добавить упражнение",
    "programs.ai.pickerReplaceTitle": "Заменить упражнение",
    "programs.ai.pickerHint": "Выбери движение из каталога",
    "programs.ai.pickerSearch": "Название, группа или оборудование",
    "programs.ai.choose": "Выбрать",
    "programs.ai.keySaveErrorTitle": "Не удалось сохранить ключ",
    "programs.ai.retry": "Повтори попытку.",
    "programs.ai.keyDeleteTitle": "Удалить личный ключ?",
    "programs.ai.keyDeleteMessage":
      "После удаления режим Groq будет недоступен, пока ключ не добавлен снова.",
    "programs.ai.cancel": "Отмена",
    "programs.ai.delete": "Удалить",
    "programs.ai.keyMissingTitle": "Нужен личный ключ Groq",
    "programs.ai.keyMissingMessage":
      "Добавь ключ, чтобы сгенерировать программу через Groq. Он хранится только на этом устройстве.",
    "programs.ai.generateErrorTitle": "Не удалось сформировать программу",
    "programs.ai.generateErrorMessage":
      "Повтори попытку или выбери локальный режим.",
    "programs.ai.minExercisesTitle": "Оставь минимум два упражнения",
    "programs.ai.minExercisesMessage":
      "Так программа останется полноценной тренировкой.",
    "programs.ai.keySavedToast": "Личный ключ сохранён на устройстве",
    "programs.ai.keyMissingHint":
      "Добавь личный ключ, чтобы использовать Groq",
    "programs.ai.localBadge": "Работает полностью на устройстве",
    "programs.ai.backA11y": "Назад",

    "programs.recommendations.title": "Следующая тренировка",
    "programs.recommendations.eyebrow": "ПРОЗРАЧНЫЕ РЕКОМЕНДАЦИИ",
    "programs.recommendations.subtitle":
      "Каждая рекомендация объясняет исходный подход, расчётный 1RM, цель и выбранный шаг округления.",
    "programs.recommendations.goal": "Цель: {sets} × {reps} повторов",
    "programs.recommendations.weightKg": "{value} кг",
    "programs.recommendations.emptyValue": "—",
    "programs.recommendations.lastReference":
      "Последний ориентир: {weight} кг × {reps}",
    "programs.recommendations.estimatedOneRm": "Расчётный 1RM: {value} кг",
    "programs.recommendations.intensity":
      "Рабочая интенсивность: до {percent}% 1RM · шаг {step} кг",
    "programs.recommendations.deltaUp":
      "+{value} кг к прошлому рабочему весу",
    "programs.recommendations.deltaDown":
      "{value} кг для закрепления техники",
    "programs.recommendations.keepWeight": "Сохрани текущий рабочий вес",
  },
  en: {
    "programs.tab.title": "Programs",
    "programs.tab.subtitle":
      "Build workouts for your goal and repeat them with progress.",
    "programs.tab.sectionTitle": "Your plans",
    "programs.tab.aiTitle": "AI builder",
    "programs.tab.aiCta": "Generate a program",
    "programs.tab.aiHint": "Describe the goal, then refine exercises and sets.",
    "programs.tab.exportTitle": "ZIP export",
    "programs.tab.filterAll": "All",
    "programs.tab.toArchive": "Archive",
    "programs.tab.fromArchive": "Restore from archive",
    "programs.tab.archiveSection": "Program archive",
    "programs.tab.archiveCount": "Archive · {count}",
    "programs.tab.archivedBadge": " · Archived",
    "programs.tab.create": "＋  Create a new program",
    "programs.tab.createHint": "Set exercises, weight, reps and rest",
    "programs.tab.start": "Start",
    "programs.tab.edit": "Edit",
    "programs.tab.rename": "Rename",
    "programs.tab.cover": "Cover",
    "programs.tab.delete": "Delete",
    "programs.tab.hidden": "Hidden from the list",
    "programs.tab.undoHint": "You can undo within 5 seconds",
    "programs.tab.undo": "Undo",
    "programs.tab.searchPlaceholder": "Search by name",
    "programs.tab.emptySearchTitle": "Nothing found",
    "programs.tab.emptySearchHint":
      "Change the query or go back to the full list.",
    "programs.tab.emptyListTitle": "The program list is empty",
    "programs.tab.emptyListHint":
      "Create a program manually, with AI, or import a ready file.",
    "programs.tab.noProgramsTitle": "No programs",
    "programs.tab.noProgramsMessage":
      "Create or restore at least one program first.",
    "programs.tab.backToAll": "← Back to all programs",
    "programs.tab.sortNewest": "Newest first",
    "programs.tab.sortOldest": "Oldest first",
    "programs.tab.import": "Import",
    "programs.tab.importBusy": "Reading…",
    "programs.tab.done": "Done",
    "programs.tab.choose": "Choose",
    "programs.tab.cancel": "Cancel",
    "programs.tab.save": "Save",
    "programs.tab.renameTitle": "Program name",
    "programs.tab.coverTitle": "Cover: {name}",
    "programs.tab.deleteTitle": "Delete the program?",
    "programs.tab.deleteMessage":
      "“{name}” will be hidden from the list. You have {seconds} seconds to undo.",
    "programs.tab.importedTitle": "Import complete",
    "programs.tab.importedMessage": "Programs added: {count}.{extra}",
    "programs.tab.importedRestored": " Images restored: {count}.",
    "programs.tab.importedSkipped": " Duplicates skipped: {count}.",
    "programs.tab.importReadErrorTitle": "Could not read the file",
    "programs.tab.createdAt": "Created {date}",
    "programs.tab.cardMeta": "{count} exercises  ·  {sets} sets",
    "programs.tab.selectedCount": "Selected: {count}",
    "programs.tab.deletedToast": "“{name}” deleted",
    "programs.tab.renamePlaceholder": "For example: Upper body · Strength",
    "programs.tab.importFailedTitle": "Import failed",
    "programs.tab.importReadError":
      "Choose an exported ZIP or JSON program file from the training diary.",
    "programs.tab.tooLargeTitle": "The file is too large",
    "programs.tab.tooLargeMessage":
      "Choose a ZIP or JSON program file up to 24 MB.",
    "programs.exchange.invalidJson": "The file does not contain valid JSON.",
    "programs.exchange.unsupportedFormat":
      "Unsupported program file format.",
    "programs.exchange.noCompatible":
      "The file has no compatible programs.",
    "programs.tab.exportErrorTitle": "Could not export",
    "programs.tab.exportErrorMessage":
      "Try again — the programs were not changed.",
    "programs.tab.shareUnavailable":
      "The system file sharing menu is unavailable on this device.",
    "programs.tab.shareTitle": "Share programs",
    "programs.tab.fileReadyTitle": "File is ready",
    "programs.tab.fileReadyMessage":
      "The browser started downloading the program file.",

    "programs.builder.navNew": "New program",
    "programs.builder.navEdit": "Editing",
    "programs.builder.saveTop": "Save",
    "programs.builder.titleNew": "Build your own plan",
    "programs.builder.titleEdit": "Tune the program",
    "programs.builder.subtitle":
      "Add exercises from the catalog and fill in the parameters right in each card.",
    "programs.builder.nameLabel": "NAME",
    "programs.builder.defaultName": "My workout",
    "programs.builder.exercises": "Exercises · {count}",
    "programs.builder.durationTitle": "Estimated workout time",
    "programs.builder.durationIncomplete":
      "Fill in all parameters and rest intervals to estimate the duration.",
    "programs.builder.durationHint":
      "Based on about {seconds} sec per rep, rest between sets and rest between exercises.",
    "programs.builder.selectedHint":
      "Fill in every field in the cards. Tap × to remove an exercise from the program.",
    "programs.builder.mine": " · Mine",
    "programs.builder.supersetBadge": " · SS A",
    "programs.builder.sets": "Sets",
    "programs.builder.reps": "Reps",
    "programs.builder.weightKg": "Weight, kg",
    "programs.builder.restSec": "Rest, sec",
    "programs.builder.restBetweenTitle": "Rest between exercises",
    "programs.builder.restBetweenHint":
      "Required interval after the last set",
    "programs.builder.secPlaceholder": "sec",
    "programs.builder.sec": "sec",
    "programs.builder.supersetOn": "Superset A is on",
    "programs.builder.supersetOff": "Pair the first two exercises",
    "programs.builder.supersetOnHint":
      "They are performed back to back without rest between them.",
    "programs.builder.supersetOffHint": "Tap to create superset A.",
    "programs.builder.catalogTitle": "Add from the catalog",
    "programs.builder.catalogHint":
      "The list shows only exercises you have not picked yet. Parameters are filled in after adding.",
    "programs.builder.searchPlaceholder": "Search exercises",
    "programs.builder.emptySearch":
      "Nothing found. Change the query or add an exercise in the catalog.",
    "programs.builder.emptyAll":
      "All available exercises are already in the program.",
    "programs.builder.setTypeLabel": "NEW SET TYPE",
    "programs.builder.setType.warmup": "Warm-up",
    "programs.builder.setType.working": "Working",
    "programs.builder.setType.drop": "Drop set",
    "programs.builder.setType.failure": "To failure",
    "programs.builder.saveChanges": "Save changes",
    "programs.builder.saveProgram": "Save program",
    "programs.builder.validationTitle": "Check the program",
    "programs.builder.validationMessage":
      "Enter a name and add at least one exercise.",
    "programs.builder.paramsTitle": "Fill in the parameters",
    "programs.builder.paramsMessage":
      "Enter sets, reps, weight and rest between sets for “{name}”.",
    "programs.builder.restTitle": "Fill in the rest intervals",
    "programs.builder.restMessage":
      "Enter the rest between “{name}” and the next exercise.",
    "programs.builder.description": "{count} exercises · {rest}{superset}custom plan",
    "programs.builder.descriptionRest": "{count} rest blocks · ",
    "programs.builder.descriptionSuperset": "1 superset · ",
    "programs.builder.backA11y": "Back",

    "programs.ai.navTitle": "Program builder",
    "programs.ai.eyebrow": "GROQ + LOCAL MODE",
    "programs.ai.title": "A program for your request",
    "programs.ai.subtitle":
      "Groq drafts a plan from your description, while the local builder works offline. You can edit every exercise before saving.",
    "programs.ai.modeTitle": "Generation mode",
    "programs.ai.modeBadge.groq": "GROQ",
    "programs.ai.modeBadge.local": "OFFLINE",
    "programs.ai.modeButton.groq": "Groq AI",
    "programs.ai.modeButton.local": "On device",
    "programs.ai.keyWebHint":
      "In the web preview the key is stored for testing only.",
    "programs.ai.keyNativeHint":
      "The key is encrypted in secure Android storage.",
    "programs.ai.keyChange": "Change",
    "programs.ai.keyAdd": "Add",
    "programs.ai.keyDelete": "Delete",
    "programs.ai.promptTitle": "Your request",
    "programs.ai.promptPlaceholder":
      "For example: 3 workouts a week for strength, without heavy axial loading",
    "programs.ai.promptDefault":
      "I want a full-body program for strength and muscle growth without overtraining, focused on compound lifts.",
    "programs.ai.levelLabel": "LEVEL",
    "programs.ai.equipmentLabel": "EQUIPMENT",
    "programs.ai.daysLabel": "DAYS PER WEEK",
    "programs.ai.durationLabel": "DURATION",
    "programs.ai.limitationsLabel": "LIMITATIONS AND PREFERENCES",
    "programs.ai.limitationsPlaceholder":
      "For example: no running, I prefer machines",
    "programs.ai.safetyTitle": "Check the plan before training",
    "programs.ai.safetyText":
      "The builder produces an editable template, not a medical prescription. With pain, an injury or an illness, agree the load with a specialist.",
    "programs.ai.generateBusy": "Groq is building the program…",
    "programs.ai.generateGroq": "Generate with Groq",
    "programs.ai.generateLocal": "Build the program on device",
    "programs.ai.experience.novice": "Beginner",
    "programs.ai.experience.intermediate": "Intermediate",
    "programs.ai.experience.advanced": "Advanced",
    "programs.ai.equipmentOption.fullGym": "Full gym",
    "programs.ai.equipmentOption.machines": "Machines",
    "programs.ai.equipmentOption.freeWeights": "Free weights",
    "programs.ai.equipmentOption.home": "Home",
    "programs.ai.builderTitle": "Smart builder",
    "programs.ai.builderHint": "Tune the details before saving.",
    "programs.ai.draftBadge": "DRAFT",
    "programs.ai.nameLabel": "PROGRAM NAME",
    "programs.ai.exerciseFallback": "Exercise",
    "programs.ai.remove": "Delete",
    "programs.ai.replace": "Replace",
    "programs.ai.setTypeShort.working": "Work",
    "programs.ai.setTypeShort.warmup": "Warm",
    "programs.ai.setTypeShort.drop": "Drop",
    "programs.ai.setTypeShort.failure": "Fail",
    "programs.ai.field.sets": "Sets",
    "programs.ai.field.reps": "Reps",
    "programs.ai.field.weight": "Weight, kg",
    "programs.ai.field.rest": "Rest, sec",
    "programs.ai.addExercise": "＋ Add exercise",
    "programs.ai.saveToMy": "Save to “My programs”",
    "programs.ai.keySheetTitle": "Personal Groq key",
    "programs.ai.keySheetHint": "It is only needed for the AI generation mode.",
    "programs.ai.keyPrivacyWeb":
      "In the Android build the key is stored in encrypted system storage. Do not enter a live key in the web preview.",
    "programs.ai.keyPrivacyNative":
      "The key is not added to the APK, is not sent with workout data and is stored in encrypted Android system storage.",
    "programs.ai.keySaving": "Saving…",
    "programs.ai.keySave": "Save the key on this device",
    "programs.ai.pickerAddTitle": "Add exercise",
    "programs.ai.pickerReplaceTitle": "Replace exercise",
    "programs.ai.pickerHint": "Pick a movement from the catalog",
    "programs.ai.pickerSearch": "Name, group or equipment",
    "programs.ai.choose": "Choose",
    "programs.ai.keySaveErrorTitle": "Could not save the key",
    "programs.ai.retry": "Try again.",
    "programs.ai.keyDeleteTitle": "Delete the personal key?",
    "programs.ai.keyDeleteMessage":
      "After deletion Groq mode stays unavailable until you add a key again.",
    "programs.ai.cancel": "Cancel",
    "programs.ai.delete": "Delete",
    "programs.ai.keyMissingTitle": "A personal Groq key is required",
    "programs.ai.keyMissingMessage":
      "Add a key to generate a program with Groq. It is stored only on this device.",
    "programs.ai.generateErrorTitle": "Could not build the program",
    "programs.ai.generateErrorMessage":
      "Try again or switch to the local mode.",
    "programs.ai.minExercisesTitle": "Keep at least two exercises",
    "programs.ai.minExercisesMessage":
      "That way the program stays a complete workout.",
    "programs.ai.keySavedToast": "The personal key is saved on this device",
    "programs.ai.keyMissingHint": "Add a personal key to use Groq",
    "programs.ai.localBadge": "Runs fully on this device",
    "programs.ai.backA11y": "Back",

    "programs.recommendations.title": "Next workout",
    "programs.recommendations.eyebrow": "TRANSPARENT RECOMMENDATIONS",
    "programs.recommendations.subtitle":
      "Every recommendation explains the source set, the estimated 1RM, the goal and the rounding step chosen.",
    "programs.recommendations.goal": "Goal: {sets} × {reps} reps",
    "programs.recommendations.weightKg": "{value} kg",
    "programs.recommendations.emptyValue": "—",
    "programs.recommendations.lastReference":
      "Last reference: {weight} kg × {reps}",
    "programs.recommendations.estimatedOneRm": "Estimated 1RM: {value} kg",
    "programs.recommendations.intensity":
      "Working intensity: up to {percent}% of 1RM · step {step} kg",
    "programs.recommendations.deltaUp":
      "+{value} kg on the previous working weight",
    "programs.recommendations.deltaDown":
      "{value} kg to lock in the technique",
    "programs.recommendations.keepWeight": "Keep the current working weight",
  },
});
