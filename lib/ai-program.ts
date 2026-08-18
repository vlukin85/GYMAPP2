import type { Exercise, ProgramExercise, SetType, WorkoutProgram } from "./workout-data";

export type AiProgramParameters = {
  prompt: string;
  daysPerWeek: number;
  experience: "beginner" | "intermediate" | "advanced";
  equipment: "full-gym" | "machines" | "free-weights" | "home";
  sessionMinutes: number;
  limitations?: string;
};

type UnknownObject = Record<string, unknown>;

const SET_TYPES: SetType[] = ["warmup", "working", "drop", "failure"];

function asObject(value: unknown): UnknownObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as UnknownObject : null;
}

function asText(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed * 2) / 2)) : fallback;
}

function normalizeKey(value: string) {
  return value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/[^а-яa-z0-9]+/gi, " ").trim();
}

function resolveExerciseId(item: UnknownObject, catalog: Exercise[]) {
  const requested = typeof item.exerciseId === "string" ? item.exerciseId : typeof item.exerciseName === "string" ? item.exerciseName : "";
  if (!requested) return undefined;
  const direct = catalog.find((exercise) => exercise.id === requested);
  if (direct) return direct.id;
  const normalized = normalizeKey(requested);
  return catalog.find((exercise) => normalizeKey(exercise.name) === normalized)?.id;
}

export function normalizeAiProgram(raw: unknown, catalog: Exercise[]): Omit<WorkoutProgram, "id"> {
  const source = asObject(raw);
  if (!source || !Array.isArray(source.exercises)) throw new Error("ИИ вернул программу в неверном формате.");

  const seen = new Set<string>();
  const exercises: ProgramExercise[] = source.exercises.flatMap((candidate) => {
    const item = asObject(candidate);
    if (!item) return [];
    const exerciseId = resolveExerciseId(item, catalog);
    if (!exerciseId || seen.has(exerciseId)) return [];
    seen.add(exerciseId);
    const setType = typeof item.setType === "string" && SET_TYPES.includes(item.setType as SetType) ? item.setType as SetType : "working";
    return [{
      exerciseId,
      sets: clampInteger(item.sets, 3, 1, 8),
      reps: clampInteger(item.reps, 8, 1, 30),
      weight: clampNumber(item.weight, 0, 0, 500),
      rest: clampInteger(item.rest, 90, 30, 300),
      setType,
      supersetGroup: typeof item.supersetGroup === "string" && /^[A-Z]$/.test(item.supersetGroup) ? item.supersetGroup : undefined,
    }];
  }).slice(0, 12);

  if (exercises.length < 2) throw new Error("ИИ не подобрал достаточно упражнений из каталога. Уточни запрос и попробуй ещё раз.");

  return {
    name: asText(source.name, "ИИ-программа тренировок", 80),
    description: asText(source.description, "Индивидуальная программа, сформированная по вашему запросу.", 220),
    exercises,
  };
}

export function buildAiProgramPrompt(input: AiProgramParameters, catalog: Exercise[]) {
  const catalogSummary = catalog.map(({ id, name, group, equipment }) => ({ id, name, group, equipment }));
  return `Сформируй безопасную, практичную программу для тренажёрного зала на русском языке. Это не медицинская рекомендация: не назначай лечение и не игнорируй ограничения пользователя. Используй ТОЛЬКО упражнения из списка allowedExercises и указывай их точные id. Верни только JSON-объект без markdown по форме {"name":"string","description":"string","exercises":[{"exerciseId":"string","sets":number,"reps":number,"weight":number,"rest":number,"setType":"warmup|working|drop|failure","supersetGroup":"A|B"}]}. Включи 3–8 разных упражнений, разумные подходы/повторы, вес в кг (0 для упражнений с весом тела или если вес должен подбираться пользователем), отдых 30–300 секунд. Не используй больше двух упражнений в одной supersetGroup.

Параметры пользователя:
- Свободный запрос: ${input.prompt}
- Тренировок в неделю: ${input.daysPerWeek}
- Уровень: ${input.experience}
- Доступное оборудование: ${input.equipment}
- Длительность одной тренировки: ${input.sessionMinutes} минут
- Ограничения или пожелания: ${input.limitations || "не указаны"}

allowedExercises: ${JSON.stringify(catalogSummary)}`;
}

function matchesEquipment(exercise: Exercise, equipment: AiProgramParameters["equipment"]) {
  if (equipment === "full-gym") return true;
  const value = exercise.equipment.toLocaleLowerCase("ru-RU");
  if (equipment === "machines") return value.includes("тренаж") || value.includes("блок") || value.includes("кроссовер");
  if (equipment === "free-weights") return value.includes("штанг") || value.includes("гантел") || value.includes("гир") || value.includes("вес тела");
  return value.includes("вес тела") || value.includes("гантел") || value.includes("резин") || value.includes("коврик");
}

/** Creates an editable on-device template without network, credentials, or model calls. */
export function generateLocalProgram(input: AiProgramParameters, catalog: Exercise[]): Omit<WorkoutProgram, "id"> {
  const normalized = `${input.prompt} ${input.limitations ?? ""}`.toLocaleLowerCase("ru-RU");
  const filtered = catalog.filter((exercise) => matchesEquipment(exercise, input.equipment));
  const safeCatalog = filtered.length >= 2 ? filtered : catalog;
  const avoidLegs = /без.*ног|колен|присед/.test(normalized);
  const avoidBack = /без.*спин|поясниц/.test(normalized);
  const preferredGroups = ["Грудь", "Спина", "Ноги", "Плечи", "Руки", "Корпус", "Кардио"];
  const candidates = preferredGroups.flatMap((group) => safeCatalog.filter((exercise) => exercise.group === group));
  const unique = candidates.filter((exercise, index, list) => list.findIndex((item) => item.id === exercise.id) === index)
    .filter((exercise) => !(avoidLegs && exercise.group === "Ноги"))
    .filter((exercise) => !(avoidBack && exercise.group === "Спина"));
  const targetCount = Math.min(input.sessionMinutes <= 45 ? 4 : input.sessionMinutes >= 75 ? 7 : 6, 8);
  const selected = (unique.length >= 2 ? unique : safeCatalog).slice(0, targetCount);
  const strengthFocus = /сил|strength|мощн/.test(normalized);
  const enduranceFocus = /вынослив|endurance|кардио/.test(normalized);
  const sets = input.experience === "beginner" ? 3 : input.experience === "advanced" ? 4 : 3;
  const reps = strengthFocus ? 6 : enduranceFocus ? 14 : 10;
  const rest = strengthFocus ? 150 : enduranceFocus ? 60 : 90;
  return {
    name: `Локальный план · ${input.daysPerWeek}× в неделю`,
    description: "Редактируемый план собран на устройстве по выбранным параметрам. Проверьте упражнения и нагрузку перед тренировкой.",
    exercises: selected.map((exercise) => ({
      exerciseId: exercise.id,
      sets,
      reps: exercise.equipment.toLocaleLowerCase("ru-RU").includes("вес тела") ? Math.max(reps, 10) : reps,
      weight: 0,
      rest,
      setType: "working" as SetType,
    })),
  };
}
