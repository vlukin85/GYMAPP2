import { defineDomain } from "../types";

// Домен «Каталог упражнений»: вкладка «Упражнения», карточка упражнения
// (app/exercise/[id].tsx) и экран замены упражнения (app/replace-exercise.tsx).
// Названия упражнений, групп мышц и оборудования приходят из каталога
// (lib/workout-data.ts + lib/i18n/exercise-labels.ts), здесь — только обвязка.
//
// Плейсхолдеры: {name}, {angle}, {rating}, {count}, {weight}, {reps}, {value},
// {program}.
export const catalog = defineDomain({
  ru: {
    "catalog.tab.eyebrow": "База движений",
    "catalog.tab.title": "Упражнения",
    "catalog.tab.subtitle":
      "Находите движения, создавайте свои и добавляйте их в планы.",
    "catalog.tab.createA11y": "Создать своё упражнение",
    "catalog.search.placeholder": "Поиск по названию или оборудованию",
    "catalog.search.clearA11y": "Очистить поиск упражнений",
    "catalog.filters.all": "Все",
    "catalog.meta.found": "Найдено упражнений",
    "catalog.card.mine": " · МОЁ",
    "catalog.card.addToProgram": "В программу",
    "catalog.card.addToProgramA11y": "Добавить «{name}» в программу",
    "catalog.empty":
      "Ничего не найдено. Измените поиск или создайте упражнение вручную.",

    "catalog.picker.eyebrow": "Добавление в программу",
    "catalog.picker.hint":
      "Выберите программу. Поиск работает по названию и описанию.",
    "catalog.picker.searchPlaceholder": "Найти программу",
    "catalog.picker.exercisesCount": "{count} упражнений",
    "catalog.picker.cancel": "Отмена",
    "catalog.picker.addedTitle": "Упражнение добавлено",
    "catalog.picker.existsTitle": "Уже в программе",
    "catalog.picker.addedMessage": "«{name}» добавлено в «{program}».",
    "catalog.picker.existsMessage": "«{name}» уже есть в «{program}».",
    "catalog.picker.fallbackProgram": "программу",
    "catalog.picker.fallbackProgramGen": "программе",

    "catalog.manual.eyebrow": "Личный каталог",
    "catalog.manual.title": "Новое упражнение",
    "catalog.manual.namePlaceholder": "Название упражнения",
    "catalog.manual.groupLabel": "Группа мышц",
    "catalog.manual.equipmentPlaceholder": "Оборудование",
    "catalog.manual.descriptionPlaceholder":
      "Краткая подсказка по технике (необязательно)",
    "catalog.manual.cancel": "Отмена",
    "catalog.manual.save": "Создать",
    "catalog.manual.errorTitle": "Не удалось добавить",
    "catalog.manual.duplicate":
      "Упражнение с таким названием уже есть в личном каталоге.",
    "catalog.manual.nameRequired": "Укажите название упражнения.",
    "catalog.manual.createdTitle": "Упражнение создано",
    "catalog.manual.createdMessage":
      "Оно добавлено в личный каталог. Теперь выберите программу, куда его добавить.",
    "catalog.manual.later": "Позже",
    "catalog.manual.chooseProgram": "Выбрать программу",
    "catalog.manual.fallbackName": "Новое упражнение",

    "catalog.detail.backA11y": "Назад",
    "catalog.detail.navTitle": "КАРТОЧКА{br}УПРАЖНЕНИЯ",
    "catalog.detail.equipment": "ОБОРУДОВАНИЕ",
    "catalog.detail.angle": "РАКУРС",
    "catalog.detail.imageA11y": "{name}: ракурс {angle}",
    "catalog.detail.ratingTitle": "ОЦЕНКА ИЛЛЮСТРАЦИИ",
    "catalog.detail.ratingValue": "Ваша оценка: {rating}/5",
    "catalog.detail.ratingHint": "Оцените, чтобы сохранить предпочтение",
    "catalog.detail.favoriteA11y": "Добавить ракурс в избранное",
    "catalog.detail.styleTitle": "ВИЗУАЛЬНЫЙ СТИЛЬ",
    "catalog.detail.imagesTitle": "ВСЕ ИЗОБРАЖЕНИЯ",
    "catalog.detail.offlineAvailable": "ДОСТУПНО ОФЛАЙН · {count} РАКУРСА",
    "catalog.detail.offlinePending":
      "ФОТОГРАФИИ БУДУТ ДОСТУПНЫ ПОСЛЕ ЗАГРУЗКИ",
    "catalog.detail.photoMain": "Основной",
    "catalog.detail.photoMine": "Моё изображение",
    "catalog.detail.photoMineN": "Моё фото {index}",
    "catalog.detail.moveLeftA11y": "Сдвинуть фотографию влево",
    "catalog.detail.moveRightA11y": "Сдвинуть фотографию вправо",
    "catalog.detail.deletePhotoTitle": "Удалить фотографию?",
    "catalog.detail.deletePhotoMessage":
      "Это действие удалит загруженное фото из карточки упражнения.",
    "catalog.detail.cancel": "Отмена",
    "catalog.detail.delete": "Удалить",
    "catalog.detail.deleteCta": "УДАЛИТЬ",
    "catalog.detail.changeMain": "ИЗМЕНИТЬ ГЛАВНОЕ",
    "catalog.detail.addPhoto": "＋ ДОБАВИТЬ ФОТО",
    "catalog.detail.recordTitle": "ЛИЧНЫЙ РЕКОРД",
    "catalog.detail.recordWeightReps": "{weight} кг × {reps}",
    "catalog.detail.recordKgOnly": "{weight} кг",
    "catalog.detail.recordSeconds": "{reps} сек",
    "catalog.detail.recordOneRm": "1RM {value} кг",
    "catalog.detail.recordBest": "лучший результат · {reps} повторов",
    "catalog.detail.historyTitle": "ИСТОРИЯ РЕКОРДОВ",
    "catalog.detail.historyHint":
      "Только тренировки, в которых результат стал лучше",
    "catalog.detail.historyEmpty":
      "Здесь появятся новые личные рекорды после завершения тренировок.",
    "catalog.detail.techniqueTitle": "ПОЛНЫЙ РАЗБОР ТЕХНИКИ",
    "catalog.detail.watchVideo": "СМОТРЕТЬ ВИДЕО",
    "catalog.detail.watchVideoHint": "Открыть подробный вариант выполнения",
    "catalog.detail.addToProgram": "＋ ДОБАВИТЬ В ПРОГРАММУ",
    "catalog.detail.mediaTitleNew": "Новое фото: {name}",
    "catalog.detail.mediaTitleReplace": "Изображение: {name}",

    // Библиотека обложек программ (id из programCoverIllustrationLibrary).
    "catalog.illustration.strength": "Сила",
    "catalog.illustration.volume": "Объём",
    "catalog.illustration.fullBody": "Full Body",
    "catalog.illustration.conditioning": "Выносливость",

    // Кандидаты изображения упражнения (подписи из
    // getExerciseIllustrationCandidates). Метки «Моё изображение» живут
    // отдельно — в catalog.detail.photoMine*.
    "catalog.candidate.individualAi": "Отдельная AI-иллюстрация",
    "catalog.candidate.generatedTechnique":
      "Ранее созданная иллюстрация техники",
    "catalog.candidate.openPhotoExercise":
      "Открытое фото упражнения · free-exercise-db",
    "catalog.candidate.openPhotoGroup":
      "Открытое фото группы · free-exercise-db",
    "catalog.candidate.aiGroup": "AI-иллюстрация группы",
    "catalog.candidate.aiGroupNamed": "AI-иллюстрация группы: {group}",
    "catalog.candidate.aiArms": "AI-иллюстрация рук",
    "catalog.candidate.illustration": "Иллюстрация упражнения",
    "catalog.candidate.technique": "Техника",

    "catalog.replace.title": "Заменить упражнение",
    "catalog.replace.subtitle":
      "Вместо «{name}» выберите вариант из всей базы. Плановые подходы, фактические данные и заметки сохранятся.",
    "catalog.replace.fallbackName": "упражнение",
    "catalog.replace.searchPlaceholder":
      "Поиск по названию, группе или оборудованию",
    "catalog.replace.counter": "{count} упражнений",
    "catalog.replace.empty": "Ничего не найдено. Попробуйте другой запрос.",
  },
  en: {
    "catalog.tab.eyebrow": "Movement library",
    "catalog.tab.title": "Exercises",
    "catalog.tab.subtitle":
      "Find movements, create your own and add them to your plans.",
    "catalog.tab.createA11y": "Create your own exercise",
    "catalog.search.placeholder": "Search by name or equipment",
    "catalog.search.clearA11y": "Clear exercise search",
    "catalog.filters.all": "All",
    "catalog.meta.found": "Exercises found",
    "catalog.card.mine": " · MINE",
    "catalog.card.addToProgram": "Add to program",
    "catalog.card.addToProgramA11y": "Add “{name}” to a program",
    "catalog.empty":
      "Nothing found. Change the search or create an exercise manually.",

    "catalog.picker.eyebrow": "Adding to a program",
    "catalog.picker.hint":
      "Pick a program. Search works by name and description.",
    "catalog.picker.searchPlaceholder": "Find a program",
    "catalog.picker.exercisesCount": "{count} exercises",
    "catalog.picker.cancel": "Cancel",
    "catalog.picker.addedTitle": "Exercise added",
    "catalog.picker.existsTitle": "Already in the program",
    "catalog.picker.addedMessage": "“{name}” was added to “{program}”.",
    "catalog.picker.existsMessage": "“{name}” is already in “{program}”.",
    "catalog.picker.fallbackProgram": "the program",
    "catalog.picker.fallbackProgramGen": "the program",

    "catalog.manual.eyebrow": "Personal catalog",
    "catalog.manual.title": "New exercise",
    "catalog.manual.namePlaceholder": "Exercise name",
    "catalog.manual.groupLabel": "Muscle group",
    "catalog.manual.equipmentPlaceholder": "Equipment",
    "catalog.manual.descriptionPlaceholder":
      "Short technique hint (optional)",
    "catalog.manual.cancel": "Cancel",
    "catalog.manual.save": "Create",
    "catalog.manual.errorTitle": "Could not add",
    "catalog.manual.duplicate":
      "An exercise with this name is already in your personal catalog.",
    "catalog.manual.nameRequired": "Enter the exercise name.",
    "catalog.manual.createdTitle": "Exercise created",
    "catalog.manual.createdMessage":
      "It was added to your personal catalog. Now pick the program to add it to.",
    "catalog.manual.later": "Later",
    "catalog.manual.chooseProgram": "Choose a program",
    "catalog.manual.fallbackName": "New exercise",

    "catalog.detail.backA11y": "Back",
    "catalog.detail.navTitle": "EXERCISE{br}CARD",
    "catalog.detail.equipment": "EQUIPMENT",
    "catalog.detail.angle": "ANGLE",
    "catalog.detail.imageA11y": "{name}: angle {angle}",
    "catalog.detail.ratingTitle": "ILLUSTRATION RATING",
    "catalog.detail.ratingValue": "Your rating: {rating}/5",
    "catalog.detail.ratingHint": "Rate it to save your preference",
    "catalog.detail.favoriteA11y": "Add the angle to favorites",
    "catalog.detail.styleTitle": "VISUAL STYLE",
    "catalog.detail.imagesTitle": "ALL IMAGES",
    "catalog.detail.offlineAvailable": "AVAILABLE OFFLINE · {count} ANGLES",
    "catalog.detail.offlinePending": "PHOTOS WILL BE AVAILABLE AFTER DOWNLOAD",
    "catalog.detail.photoMain": "Main",
    "catalog.detail.photoMine": "My image",
    "catalog.detail.photoMineN": "My photo {index}",
    "catalog.detail.moveLeftA11y": "Move the photo left",
    "catalog.detail.moveRightA11y": "Move the photo right",
    "catalog.detail.deletePhotoTitle": "Delete the photo?",
    "catalog.detail.deletePhotoMessage":
      "This removes the uploaded photo from the exercise card.",
    "catalog.detail.cancel": "Cancel",
    "catalog.detail.delete": "Delete",
    "catalog.detail.deleteCta": "DELETE",
    "catalog.detail.changeMain": "CHANGE MAIN",
    "catalog.detail.addPhoto": "＋ ADD PHOTO",
    "catalog.detail.recordTitle": "PERSONAL RECORD",
    "catalog.detail.recordWeightReps": "{weight} kg × {reps}",
    "catalog.detail.recordKgOnly": "{weight} kg",
    "catalog.detail.recordSeconds": "{reps} sec",
    "catalog.detail.recordOneRm": "1RM {value} kg",
    "catalog.detail.recordBest": "best result · {reps} reps",
    "catalog.detail.historyTitle": "RECORD HISTORY",
    "catalog.detail.historyHint": "Only workouts where the result improved",
    "catalog.detail.historyEmpty":
      "New personal records will appear here once you finish workouts.",
    "catalog.detail.techniqueTitle": "FULL TECHNIQUE BREAKDOWN",
    "catalog.detail.watchVideo": "WATCH VIDEO",
    "catalog.detail.watchVideoHint": "Open the detailed execution",
    "catalog.detail.addToProgram": "＋ ADD TO PROGRAM",
    "catalog.detail.mediaTitleNew": "New photo: {name}",
    "catalog.detail.mediaTitleReplace": "Image: {name}",

    // Program cover library (ids from programCoverIllustrationLibrary).
    "catalog.illustration.strength": "Strength",
    "catalog.illustration.volume": "Volume",
    "catalog.illustration.fullBody": "Full body",
    "catalog.illustration.conditioning": "Endurance",

    // Exercise image candidates (labels from
    // getExerciseIllustrationCandidates). The "My image" labels live
    // separately — in catalog.detail.photoMine*.
    "catalog.candidate.individualAi": "Dedicated AI illustration",
    "catalog.candidate.generatedTechnique":
      "Previously generated technique illustration",
    "catalog.candidate.openPhotoExercise":
      "Open exercise photo · free-exercise-db",
    "catalog.candidate.openPhotoGroup":
      "Open group photo · free-exercise-db",
    "catalog.candidate.aiGroup": "AI group illustration",
    "catalog.candidate.aiGroupNamed": "AI group illustration: {group}",
    "catalog.candidate.aiArms": "AI arm illustration",
    "catalog.candidate.illustration": "Exercise illustration",
    "catalog.candidate.technique": "Technique",

    "catalog.replace.title": "Replace exercise",
    "catalog.replace.subtitle":
      "Instead of “{name}” pick another movement from the whole library. Planned sets, actual data and notes are kept.",
    "catalog.replace.fallbackName": "the exercise",
    "catalog.replace.searchPlaceholder": "Search by name, group or equipment",
    "catalog.replace.counter": "{count} exercises",
    "catalog.replace.empty": "Nothing found. Try another query.",
  },
});
