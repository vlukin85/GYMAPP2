import { exercises, getExercise, type SetType } from "./workout-data";

export type CsvImportError = { line: number; message: string };

export type ImportedSetRow = {
  sourceLine: number;
  date: string;
  programId: string;
  programName: string;
  sessionKey: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  durationMinutes: number;
  setType: SetType;
};

export type ParsedTrainingCsv = {
  detectedColumns: string[];
  rows: ImportedSetRow[];
  errors: CsvImportError[];
  delimiter: "," | ";";
};

export type ImportedWorkoutSession = {
  key: string;
  date: string;
  programId: string;
  programName: string;
  durationMinutes: number;
  sets: ImportedSetRow[];
  totalVolumeKg: number;
};

type CsvRecord = { cells: string[]; line: number };

const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["дата", "date", "completedat", "completeddate"],
  program: ["программа", "program", "workout", "programname", "programid"],
  exerciseId: ["exerciseid", "idупражнения", "идупражнения", "exercise_id"],
  exerciseName: ["упражнение", "exercise", "name", "exercisename", "названиеупражнения"],
  setNumber: ["подход", "set", "setnumber", "setno", "сет"],
  reps: ["повторы", "повторения", "reps", "repetitions", "rep"],
  weightKg: ["вескг", "вес", "weight", "weightkg", "kg"],
  durationMinutes: ["длительность", "длительностьмин", "duration", "durationminutes", "минуты"],
  sessionKey: ["sessionid", "session", "trainingid", "сессия", "idтренировки"],
  setType: ["типподхода", "settype", "тип"],
};

function normalize(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLocaleLowerCase("ru-RU").replace(/[^a-zа-яё0-9]+/g, "");
}

function readRecords(text: string, delimiter: "," | ";"): CsvRecord[] {
  const records: CsvRecord[] = [];
  let cells: string[] = [];
  let current = "";
  let quoted = false;
  let line = 1;
  let recordLine = 1;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { current += '"'; index += 1; }
      else quoted = !quoted;
      continue;
    }
    if (char === "\r") continue;
    if (char === "\n") {
      if (quoted) { current += "\n"; line += 1; continue; }
      cells.push(current.trim());
      if (cells.some((cell) => cell.length > 0)) records.push({ cells, line: recordLine });
      cells = [];
      current = "";
      line += 1;
      recordLine = line;
      continue;
    }
    if (char === delimiter && !quoted) { cells.push(current.trim()); current = ""; continue; }
    current += char;
  }
  cells.push(current.trim());
  if (cells.some((cell) => cell.length > 0)) records.push({ cells, line: recordLine });
  return records;
}

function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  return (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
}

function parseNumber(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string) {
  const iso = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const ru = value.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  const parts = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : ru ? [Number(ru[3].length === 2 ? `20${ru[3]}` : ru[3]), Number(ru[2]), Number(ru[1])] : null;
  if (!parts) return null;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function slugify(value: string) {
  const result = normalize(value).slice(0, 60);
  return result || "imported-workout";
}

function parseSetType(value: string): SetType {
  const normalized = normalize(value);
  if (["warmup", "разминка"].includes(normalized)) return "warmup";
  if (["drop", "dropset", "дропсет"].includes(normalized)) return "drop";
  if (["failure", "отказ", "отказной"].includes(normalized)) return "failure";
  return "working";
}

function findColumnIndex(headers: string[], key: string) {
  const aliases = COLUMN_ALIASES[key] ?? [];
  return headers.findIndex((header) => aliases.includes(normalize(header)));
}

export function parseTrainingCsv(text: string): ParsedTrainingCsv {
  const delimiter = detectDelimiter(text);
  const records = readRecords(text, delimiter);
  if (records.length < 2) return { detectedColumns: records[0]?.cells ?? [], rows: [], errors: [{ line: 1, message: "В CSV должны быть строка заголовков и хотя бы один подход." }], delimiter };
  const headers = records[0].cells;
  const indexes = Object.fromEntries(Object.keys(COLUMN_ALIASES).map((key) => [key, findColumnIndex(headers, key)])) as Record<string, number>;
  const required = ["date", "reps", "weightKg"];
  const missing = required.filter((key) => indexes[key] < 0);
  if (indexes.exerciseId < 0 && indexes.exerciseName < 0) missing.push("упражнение");
  if (missing.length) return { detectedColumns: headers, rows: [], errors: [{ line: records[0].line, message: `Не найдены обязательные колонки: ${missing.join(", ")}.` }], delimiter };

  const exerciseByName = new Map(exercises.map((exercise) => [normalize(exercise.name), exercise]));
  const rows: ImportedSetRow[] = [];
  const errors: CsvImportError[] = [];
  const nextSetNumber = new Map<string, number>();
  records.slice(1, 501).forEach((record) => {
    const value = (key: string) => indexes[key] >= 0 ? (record.cells[indexes[key]] ?? "").trim() : "";
    const date = parseDate(value("date"));
    const inputId = value("exerciseId");
    const inputName = value("exerciseName");
    const exercise = (inputId ? getExercise(inputId) : undefined) ?? (inputName ? getExercise(inputName) : undefined) ?? (inputName ? exerciseByName.get(normalize(inputName)) : undefined);
    const reps = parseNumber(value("reps"));
    const weightKg = parseNumber(value("weightKg"));
    if (!date) { errors.push({ line: record.line, message: "Не удалось распознать дату. Используй ГГГГ-ММ-ДД или ДД.ММ.ГГГГ." }); return; }
    if (!exercise) { errors.push({ line: record.line, message: `Упражнение «${inputName || inputId || "без названия"}» не найдено в каталоге.` }); return; }
    if (reps === null || reps <= 0 || !Number.isInteger(reps)) { errors.push({ line: record.line, message: "Повторы должны быть положительным целым числом." }); return; }
    if (weightKg === null || weightKg < 0) { errors.push({ line: record.line, message: "Вес должен быть числом от 0 кг." }); return; }
    const programName = value("program") || "Импортированная тренировка";
    const sessionKey = value("sessionKey") || `${date}|${programName}`;
    const setCounterKey = `${sessionKey}|${exercise.id}`;
    const parsedSetNumber = parseNumber(value("setNumber"));
    const setNumber = parsedSetNumber && parsedSetNumber > 0 && Number.isInteger(parsedSetNumber) ? parsedSetNumber : (nextSetNumber.get(setCounterKey) ?? 0) + 1;
    nextSetNumber.set(setCounterKey, Math.max(nextSetNumber.get(setCounterKey) ?? 0, setNumber));
    const durationMinutes = parseNumber(value("durationMinutes"));
    rows.push({ sourceLine: record.line, date, programId: `imported-${slugify(programName)}`, programName, sessionKey, exerciseId: exercise.id, exerciseName: exercise.name, setNumber, reps, weightKg, durationMinutes: durationMinutes && durationMinutes >= 0 ? Math.round(durationMinutes) : 0, setType: parseSetType(value("setType")) });
  });
  if (records.length - 1 > 500) errors.push({ line: 502, message: "Импорт ограничен первыми 500 строками CSV." });
  return { detectedColumns: headers, rows, errors, delimiter };
}

export function groupImportedSessions(rows: ImportedSetRow[]): ImportedWorkoutSession[] {
  const sessions = new Map<string, ImportedWorkoutSession>();
  rows.forEach((row) => {
    const session = sessions.get(row.sessionKey) ?? { key: row.sessionKey, date: row.date, programId: row.programId, programName: row.programName, durationMinutes: row.durationMinutes, sets: [], totalVolumeKg: 0 };
    session.durationMinutes = Math.max(session.durationMinutes, row.durationMinutes);
    session.sets.push(row);
    session.totalVolumeKg += row.weightKg * row.reps;
    sessions.set(row.sessionKey, session);
  });
  return Array.from(sessions.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export type ComparableHistorySet = {
  sessionId: number | string;
  date: Date | string;
  programId: string;
  durationMinutes: number;
  exerciseId: string;
  reps: number;
  weightCentiKg: number;
  volumeCentiKg: number;
  oneRepMaxCentiKg: number;
};

export type WorkoutSessionSummary = {
  id: string;
  date: Date | string;
  programId: string;
  durationMinutes: number;
  setCount: number;
  totalVolumeKg: number;
  oneRmByExercise: Record<string, number>;
};

export type WorkoutComparison = {
  first: WorkoutSessionSummary;
  second: WorkoutSessionSummary;
  volumeDeltaKg: number;
  durationDeltaMinutes: number;
  setCountDelta: number;
  exerciseDeltas: { exerciseId: string; firstOneRmKg: number | null; secondOneRmKg: number | null; deltaKg: number | null }[];
};

export function groupWorkoutSessions(rows: ComparableHistorySet[]): WorkoutSessionSummary[] {
  const grouped = new Map<string, WorkoutSessionSummary>();
  rows.forEach((row) => {
    const id = String(row.sessionId);
    const session = grouped.get(id) ?? { id, date: row.date, programId: row.programId, durationMinutes: row.durationMinutes, setCount: 0, totalVolumeKg: 0, oneRmByExercise: {} };
    session.setCount += 1;
    session.totalVolumeKg += row.volumeCentiKg / 100;
    session.oneRmByExercise[row.exerciseId] = Math.max(session.oneRmByExercise[row.exerciseId] ?? 0, row.oneRepMaxCentiKg / 100);
    grouped.set(id, session);
  });
  return Array.from(grouped.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function buildWorkoutComparison(first: WorkoutSessionSummary, second: WorkoutSessionSummary): WorkoutComparison {
  const exerciseIds = Array.from(new Set([...Object.keys(first.oneRmByExercise), ...Object.keys(second.oneRmByExercise)])).sort();
  return { first, second, volumeDeltaKg: second.totalVolumeKg - first.totalVolumeKg, durationDeltaMinutes: second.durationMinutes - first.durationMinutes, setCountDelta: second.setCount - first.setCount, exerciseDeltas: exerciseIds.map((exerciseId) => { const firstOneRmKg = first.oneRmByExercise[exerciseId] ?? null; const secondOneRmKg = second.oneRmByExercise[exerciseId] ?? null; return { exerciseId, firstOneRmKg, secondOneRmKg, deltaKg: firstOneRmKg === null || secondOneRmKg === null ? null : secondOneRmKg - firstOneRmKg }; }) };
}
