// Английские подписи справочника упражнений: группы мышц, оборудование,
// стили иллюстраций и названия самих упражнений.
//
// Каталог упражнений (lib/workout-data.ts) ведёт отдельный домен: он кладёт
// nameEn прямо в объект упражнения. Этот файл — страховка для экранов: если
// nameEn ещё не заполнен, показываем русское название, а справочные словари
// групп/оборудования/стилей живут здесь, чтобы не трогать workout-data.ts.
import { translate } from "./index";
import type { DictKey } from "./index";
import type { Lang } from "./types";

/** Группы мышц (значения из lib/workout-data.ts muscleGroups). */
export const MUSCLE_GROUP_EN: Record<string, string> = {
  Все: "All",
  Грудь: "Chest",
  Спина: "Back",
  Ноги: "Legs",
  Плечи: "Shoulders",
  Бицепс: "Biceps",
  Трицепс: "Triceps",
  Корпус: "Core",
  Кардио: "Cardio",
};

/** Оборудование, которое встречается в каталоге. */
export const EQUIPMENT_EN: Record<string, string> = {
  Штанга: "Barbell",
  Гантели: "Dumbbells",
  Тренажёр: "Machine",
  "Без оборудования": "No equipment",
  "Вес тела": "Bodyweight",
  Диск: "Weight plate",
  Скамья: "Bench",
  Гиря: "Kettlebell",
  Ролик: "Ab wheel",
  Скакалка: "Jump rope",
  Сани: "Sled",
  Канаты: "Battle ropes",
  Платформа: "Platform",
  Бассейн: "Pool",
  Мешок: "Heavy bag",
};

/** Стили иллюстраций упражнений (id из aiExerciseArtStyles). */
export const ART_STYLE_EN: Record<string, { label: string; hint: string }> = {
  editorial: { label: "Fitness art", hint: "Bold magazine illustration" },
  neon: { label: "Neon", hint: "High-contrast sports light" },
  minimal: { label: "Minimalism", hint: "Clean graphics without extra detail" },
};

/** Поля, которые каталог упражнений может отдать на английском. */
type Localizable = {
  name?: string;
  nameEn?: string;
  group?: string;
  groupEn?: string;
  equipment?: string;
  equipmentEn?: string;
  description?: string;
  descriptionEn?: string;
};

/** Английское поле, если каталог его уже заполнил (без падения на старых данных). */
function pick(item: Localizable, ru: string | undefined, en: string | undefined, lang: Lang): string | undefined {
  if (lang !== "en") return ru;
  return en && en.trim() ? en : ru;
}

/** Название упражнения под выбранный язык. */
export function exerciseName(item: Localizable | undefined, lang: Lang): string {
  if (!item) return "";
  return pick(item, item.name, item.nameEn, lang) ?? "";
}

/** Группа мышц под выбранный язык. */
export function muscleGroupLabel(group: string | undefined, lang: Lang): string {
  if (!group) return "";
  return lang === "en" ? (MUSCLE_GROUP_EN[group] ?? group) : group;
}

/** Оборудование под выбранный язык. */
export function equipmentLabel(equipment: string | undefined, lang: Lang): string {
  if (!equipment) return "";
  return lang === "en" ? (EQUIPMENT_EN[equipment] ?? equipment) : equipment;
}

/** Описание упражнения под выбранный язык. */
export function exerciseDescription(item: Localizable | undefined, lang: Lang): string {
  if (!item) return "";
  return pick(item, item.description, item.descriptionEn, lang) ?? "";
}

/**
 * Подпись пользовательского ракурса. Магазин тренировок хранит русские
 * подписи («Моё изображение», «Моё фото 2») прямо в данных галереи, поэтому
 * узнаём их по шаблону и переводим при показе, не переписывая сохранённое.
 */
export function userPhotoLabel(label: string, lang: Lang): string {
  if (label === "Моё изображение") return translate(lang, "catalog.detail.photoMine");
  const numbered = /^Моё фото (\d+)$/.exec(label);
  if (numbered) return translate(lang, "catalog.detail.photoMineN", { index: numbered[1] });
  return label;
}

/** Название стиля иллюстрации: сначала labelEn из данных, затем словарь. */
export function artStyleLabel(style: { id: string; label: string; labelEn?: string }, lang: Lang): string {
  if (lang !== "en") return style.label;
  return style.labelEn ?? ART_STYLE_EN[style.id]?.label ?? style.label;
}

/** Подсказка стиля иллюстрации. */
export function artStyleHint(style: { id: string; hint: string; hintEn?: string }, lang: Lang): string {
  if (lang !== "en") return style.hint;
  return style.hintEn ?? ART_STYLE_EN[style.id]?.hint ?? style.hint;
}

/**
 * Ключи словаря для библиотеки обложек программ. Записи этой библиотеки
 * живут в данных (`lib/workout-data.ts`) с полем `labelEn`; карта по id —
 * страховка для записей, собранных без английской подписи.
 */
const ILLUSTRATION_LIBRARY_KEYS: Record<string, DictKey> = {
  strength: "catalog.illustration.strength",
  volume: "catalog.illustration.volume",
  "full-body": "catalog.illustration.fullBody",
  conditioning: "catalog.illustration.conditioning",
};

/**
 * Подписи кандидатов изображения упражнения. Ключ карты — русская подпись
 * из данных: id кандидата динамический (`ai-<id упражнения>`,
 * `open-photo-<id>`), а сама подпись — стабильная константа, поэтому узнаём
 * её так же, как userPhotoLabel узнаёт метки пользовательских ракурсов.
 */
const CANDIDATE_LABEL_KEYS: Record<string, DictKey> = {
  "Отдельная AI-иллюстрация": "catalog.candidate.individualAi",
  "Ранее созданная иллюстрация техники": "catalog.candidate.generatedTechnique",
  "Открытое фото упражнения · free-exercise-db": "catalog.candidate.openPhotoExercise",
  "Открытое фото группы · free-exercise-db": "catalog.candidate.openPhotoGroup",
  "AI-иллюстрация группы": "catalog.candidate.aiGroup",
  "AI-иллюстрация рук": "catalog.candidate.aiArms",
  "Иллюстрация упражнения": "catalog.candidate.illustration",
  Техника: "catalog.candidate.technique",
};

/**
 * Подпись картинки из библиотеки обложек программ: сначала labelEn из
 * данных, затем словарь по id, затем русская подпись.
 */
export function illustrationLibraryLabel(item: { id: string; label: string; labelEn?: string }, lang: Lang): string {
  if (lang !== "en") return item.label;
  const key = ILLUSTRATION_LIBRARY_KEYS[item.id];
  return item.labelEn ?? (key ? translate(lang, key) : item.label);
}

/**
 * Подпись кандидата изображения упражнения: сначала labelEn из данных,
 * затем словарь по русской подписи. Подпись группы («AI-иллюстрация группы:
 * Грудь») переводится с названием группы. Незнакомые подписи — как есть:
 * метки пользовательских фото переводит отдельная userPhotoLabel().
 */
export function candidateLabel(item: { label: string; labelEn?: string }, lang: Lang): string {
  if (lang !== "en") return item.label;
  if (item.labelEn) return item.labelEn;
  const namedGroup = /^AI-иллюстрация группы: (.+)$/.exec(item.label);
  if (namedGroup) {
    return translate(lang, "catalog.candidate.aiGroupNamed", {
      group: MUSCLE_GROUP_EN[namedGroup[1]] ?? namedGroup[1],
    });
  }
  const key = CANDIDATE_LABEL_KEYS[item.label];
  return key ? translate(lang, key) : item.label;
}
