import { exercises, type ProgramExercise, type WorkoutProgram } from "./workout-data";

export type ProgramExchangeFile = {
  format: "gym-training-diary.programs";
  version: 1;
  exportedAt: string;
  programs: WorkoutProgram[];
};

export function buildProgramExchange(programs: WorkoutProgram[]): string {
  const payload: ProgramExchangeFile = {
    format: "gym-training-diary.programs",
    version: 1,
    exportedAt: new Date().toISOString(),
    programs: programs.filter((program) => !program.archivedAt).map(({ archivedAt: _archivedAt, ...program }) => program),
  };
  return JSON.stringify(payload, null, 2);
}

function isProgramExercise(value: unknown, validExerciseIds: Set<string>): value is ProgramExercise {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.exerciseId === "string" && validExerciseIds.has(item.exerciseId) && [item.sets, item.reps, item.weight, item.rest].every((number) => typeof number === "number" && Number.isFinite(number) && number >= 0);
}

function normalizeProgram(value: unknown, validExerciseIds: Set<string>): WorkoutProgram | null {
  if (!value || typeof value !== "object") return null;
  const program = value as Record<string, unknown>;
  const exercisesValue = Array.isArray(program.exercises) ? program.exercises : [];
  if (typeof program.id !== "string" || typeof program.name !== "string" || typeof program.description !== "string" || !program.name.trim() || !exercisesValue.length || !exercisesValue.every((item) => isProgramExercise(item, validExerciseIds))) return null;
  return {
    id: program.id,
    name: program.name.trim().slice(0, 60),
    description: program.description.trim().slice(0, 260),
    exercises: exercisesValue as ProgramExercise[],
    createdAt: typeof program.createdAt === "string" ? program.createdAt : new Date().toISOString(),
  };
}

export function parseProgramExchange(content: string, existingPrograms: WorkoutProgram[]) {
  const validExerciseIds = new Set(exercises.map((exercise) => exercise.id));
  let raw: unknown;
  try { raw = JSON.parse(content); } catch { return { programs: [] as WorkoutProgram[], duplicateIds: [] as string[], error: "Файл не содержит корректный JSON." }; }
  const payload = raw as Partial<ProgramExchangeFile>;
  if (payload.format !== "gym-training-diary.programs" || payload.version !== 1 || !Array.isArray(payload.programs)) return { programs: [] as WorkoutProgram[], duplicateIds: [] as string[], error: "Неподдерживаемый формат файла программ." };
  const knownIds = new Set(existingPrograms.map((program) => program.id));
  const duplicateIds: string[] = [];
  const programs: WorkoutProgram[] = [];
  for (const value of payload.programs) {
    const program = normalizeProgram(value, validExerciseIds);
    if (!program) continue;
    if (knownIds.has(program.id) || programs.some((item) => item.id === program.id)) { duplicateIds.push(program.id); continue; }
    programs.push(program);
  }
  return { programs, duplicateIds, error: programs.length || duplicateIds.length ? undefined : "В файле нет совместимых программ." };
}
