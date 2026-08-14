import { exercises, getExercise, type SetType } from "./workout-data";

export type CsvImportError = { line: number; message: string };
export type CsvImportSource = "native" | "strong" | "hevy";

export type ImportedSetRow = {
  sourceLine: number;
  source: CsvImportSource;
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

export type ParsedTrainingCsv = { source: CsvImportSource; detectedColumns: string[]; rows: ImportedSetRow[]; errors: CsvImportError[]; delimiter: "," | ";" };
export type ImportedWorkoutSession = { key: string; source: CsvImportSource; date: string; programId: string; programName: string; durationMinutes: number; sets: ImportedSetRow[]; totalVolumeKg: number; fingerprint: string };
type CsvRecord = { cells: string[]; line: number };

const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["дата", "date", "completedat", "completeddate", "starttime"],
  program: ["программа", "program", "workout", "programname", "programid", "workoutname", "title"],
  exerciseId: ["exerciseid", "idупражнения", "идупражнения", "exercise_id"],
  exerciseName: ["упражнение", "exercise", "name", "exercisename", "названиеупражнения", "exercisetitle"],
  setNumber: ["подход", "set", "setnumber", "setno", "сет", "setorder", "setindex"],
  reps: ["повторы", "повторения", "reps", "repetitions", "rep"],
  weightKg: ["вескг", "вес", "weight", "weightkg", "kg"],
  weightLbs: ["weightlbs", "weightlb", "lbs", "lb"],
  durationMinutes: ["длительность", "длительностьмин", "duration", "durationminutes", "минуты"],
  durationSeconds: ["durationseconds", "seconds"],
  sessionKey: ["sessionid", "session", "trainingid", "сессия", "idтренировки", "starttime"],
  setType: ["типподхода", "settype", "тип"],
  unit: ["unit", "weightunit"],
};

const EXERCISE_ALIASES: Record<string, string> = {
  benchpress: "bench-press", benchpressbarbell: "bench-press", barbellbenchpress: "bench-press", flatbenchpress: "bench-press",
  inclinebenchpress: "incline-db-press", inclinebenchpressbarbell: "incline-db-press", inclinedumbbellpress: "incline-db-press",
  latpulldown: "lat-pulldown", pulldown: "lat-pulldown", barbellrow: "barbell-row", bentoverrow: "barbell-row",
  squat: "squat", "backsquat": "squat", barbellsquat: "squat", legpress: "leg-press", shoulderpress: "shoulder-press", dumbbellshoulderpress: "shoulder-press",
  lateralraise: "lateral-raise", dumbbelllateralraise: "lateral-raise", barbellcurl: "biceps-curl", bicepscurl: "biceps-curl",
  tricepspushdown: "triceps-pushdown", cabletricepspushdown: "triceps-pushdown", plank: "plank", treadmill: "treadmill",
  dumbbellrow: "dumbbell-row", romaniandeadlift: "romanian-deadlift", walkinglunge: "walking-lunge", dumbbelllunge: "walking-lunge",
  dip: "dips", dips: "dips", legcurl: "leg-curl", calfraise: "calf-raise", cablecrunch: "cable-crunch", rower: "rower",
};

function normalize(value: string) { return value.replace(/^\uFEFF/, "").trim().toLocaleLowerCase("ru-RU").replace(/[^a-zа-яё0-9]+/g, ""); }
function slugify(value: string) { return normalize(value).slice(0, 60) || "imported-workout"; }
function findColumnIndex(headers: string[], key: string) { return headers.findIndex((header) => (COLUMN_ALIASES[key] ?? []).includes(normalize(header))); }

function readRecords(text: string, delimiter: "," | ";"): CsvRecord[] {
  const records: CsvRecord[] = []; let cells: string[] = []; let current = ""; let quoted = false; let line = 1; let recordLine = 1;
  for (let index = 0; index < text.length; index += 1) { const char = text[index]; if (char === '"') { if (quoted && text[index + 1] === '"') { current += '"'; index += 1; } else quoted = !quoted; continue; } if (char === "\r") continue; if (char === "\n") { if (quoted) { current += "\n"; line += 1; continue; } cells.push(current.trim()); if (cells.some((cell) => cell.length > 0)) records.push({ cells, line: recordLine }); cells = []; current = ""; line += 1; recordLine = line; continue; } if (char === delimiter && !quoted) { cells.push(current.trim()); current = ""; continue; } current += char; }
  cells.push(current.trim()); if (cells.some((cell) => cell.length > 0)) records.push({ cells, line: recordLine }); return records;
}

function detectDelimiter(text: string): "," | ";" { const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? ""; return (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ","; }
function parseNumber(value: string) { const parsed = Number(value.trim().replace(/\s/g, "").replace(",", ".").replace(/[^0-9.-]/g, "")); return Number.isFinite(parsed) ? parsed : null; }
function parseDate(value: string) {
  const trimmed = value.trim(); const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); const ru = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  const parts = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : ru ? [Number(ru[3].length === 2 ? `20${ru[3]}` : ru[3]), Number(ru[2]), Number(ru[1])] : null;
  if (parts) { const [year, month, day] = parts; const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}` : null; }
  const fallback = new Date(trimmed); return Number.isNaN(fallback.getTime()) ? null : `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}-${String(fallback.getDate()).padStart(2, "0")}`;
}
function parseSetType(value: string): SetType { const normalized = normalize(value); if (["warmup", "разминка"].includes(normalized)) return "warmup"; if (["drop", "dropset", "dropsets", "дропсет"].includes(normalized)) return "drop"; if (["failure", "fail", "отказ", "отказной"].includes(normalized)) return "failure"; return "working"; }
function detectSource(headers: string[]): CsvImportSource { const names = headers.map(normalize); return names.includes("starttime") && names.includes("exercisetitle") ? "hevy" : names.includes("workoutname") && names.includes("exercisename") ? "strong" : "native"; }
function resolveExercise(inputId: string, inputName: string, byName: Map<string, typeof exercises[number]>) { const alias = EXERCISE_ALIASES[normalize(inputName)]; return (inputId ? getExercise(inputId) : undefined) ?? (inputName ? getExercise(inputName) : undefined) ?? (alias ? getExercise(alias) : undefined) ?? (inputName ? byName.get(normalize(inputName)) : undefined); }

export function parseTrainingCsv(text: string): ParsedTrainingCsv {
  const delimiter = detectDelimiter(text); const records = readRecords(text, delimiter);
  if (records.length < 2) return { source: "native", detectedColumns: records[0]?.cells ?? [], rows: [], errors: [{ line: 1, message: "В CSV должны быть строка заголовков и хотя бы один подход." }], delimiter };
  const headers = records[0].cells; const source = detectSource(headers); const indexes = Object.fromEntries(Object.keys(COLUMN_ALIASES).map((key) => [key, findColumnIndex(headers, key)])) as Record<string, number>;
  const missing = ["date", "reps"].filter((key) => indexes[key] < 0); if (indexes.weightKg < 0 && indexes.weightLbs < 0) missing.push("вес"); if (indexes.exerciseId < 0 && indexes.exerciseName < 0) missing.push("упражнение");
  if (missing.length) return { source, detectedColumns: headers, rows: [], errors: [{ line: records[0].line, message: `Не найдены обязательные колонки: ${missing.join(", ")}.` }], delimiter };
  const exerciseByName = new Map(exercises.map((exercise) => [normalize(exercise.name), exercise])); const rows: ImportedSetRow[] = []; const errors: CsvImportError[] = []; const nextSetNumber = new Map<string, number>();
  records.slice(1, 501).forEach((record) => {
    const value = (key: string) => indexes[key] >= 0 ? (record.cells[indexes[key]] ?? "").trim() : "";
    const rawDate = value("date"); const date = parseDate(rawDate); const inputId = value("exerciseId"); const inputName = value("exerciseName"); const exercise = resolveExercise(inputId, inputName, exerciseByName); const reps = parseNumber(value("reps"));
    const rawWeight = indexes.weightLbs >= 0 ? parseNumber(value("weightLbs")) : parseNumber(value("weightKg")); const usesPounds = indexes.weightLbs >= 0 || /^(lb|lbs|pounds?)$/i.test(value("unit")); const weightKg = rawWeight === null ? null : usesPounds ? rawWeight * 0.45359237 : rawWeight;
    if (!date) { errors.push({ line: record.line, message: "Не удалось распознать дату тренировки." }); return; } if (!exercise) { errors.push({ line: record.line, message: `Упражнение «${inputName || inputId || "без названия"}» не найдено в каталоге.` }); return; } if (reps === null || reps <= 0 || !Number.isInteger(reps)) { errors.push({ line: record.line, message: "Повторы должны быть положительным целым числом." }); return; } if (weightKg === null || weightKg < 0) { errors.push({ line: record.line, message: "Вес должен быть числом от 0 кг." }); return; }
    const programName = value("program") || "Импортированная тренировка"; const rawSessionKey = value("sessionKey"); const sessionKey = rawSessionKey || `${date}|${programName}`; const setCounterKey = `${sessionKey}|${exercise.id}`; const parsedSetNumber = parseNumber(value("setNumber")); const setNumber = parsedSetNumber !== null && parsedSetNumber >= 0 && Number.isInteger(parsedSetNumber) ? (source === "hevy" && indexes.setNumber >= 0 ? parsedSetNumber + 1 : Math.max(1, parsedSetNumber)) : (nextSetNumber.get(setCounterKey) ?? 0) + 1; nextSetNumber.set(setCounterKey, Math.max(nextSetNumber.get(setCounterKey) ?? 0, setNumber));
    const durationMinutes = parseNumber(value("durationMinutes")); const durationSeconds = parseNumber(value("durationSeconds")); rows.push({ sourceLine: record.line, source, date, programId: `imported-${source}-${slugify(programName)}`, programName, sessionKey, exerciseId: exercise.id, exerciseName: exercise.name, setNumber, reps, weightKg: Math.round(weightKg * 100) / 100, durationMinutes: durationMinutes && durationMinutes >= 0 ? Math.round(durationMinutes) : durationSeconds && durationSeconds >= 0 ? Math.round(durationSeconds / 60) : 0, setType: parseSetType(value("setType")) });
  });
  if (records.length - 1 > 500) errors.push({ line: 502, message: "Импорт ограничен первыми 500 строками CSV." }); return { source, detectedColumns: headers, rows, errors, delimiter };
}

function fnv1a(input: string) { let hash = 0x811c9dc5; for (let index = 0; index < input.length; index += 1) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 0x01000193); } return (hash >>> 0).toString(16).padStart(8, "0"); }
export function createImportedWorkoutFingerprint(session: Omit<ImportedWorkoutSession, "fingerprint"> | Pick<ImportedWorkoutSession, "source" | "date" | "programId" | "sets">) { const rows = [...session.sets].sort((a, b) => a.exerciseId.localeCompare(b.exerciseId) || a.setNumber - b.setNumber || a.weightKg - b.weightKg || a.reps - b.reps).map((set) => `${set.exerciseId}:${set.setNumber}:${Math.round(set.weightKg * 100)}:${set.reps}:${set.setType}`).join("|"); return `v1-${fnv1a(`${session.source}|${session.date}|${session.programId}|${rows}`)}`; }

export function groupImportedSessions(rows: ImportedSetRow[]): ImportedWorkoutSession[] {
  const sessions = new Map<string, Omit<ImportedWorkoutSession, "fingerprint">>(); rows.forEach((row) => { const session = sessions.get(row.sessionKey) ?? { key: row.sessionKey, source: row.source, date: row.date, programId: row.programId, programName: row.programName, durationMinutes: row.durationMinutes, sets: [], totalVolumeKg: 0 }; session.durationMinutes = Math.max(session.durationMinutes, row.durationMinutes); session.sets.push(row); session.totalVolumeKg += row.weightKg * row.reps; sessions.set(row.sessionKey, session); }); return Array.from(sessions.values()).map((session) => ({ ...session, fingerprint: createImportedWorkoutFingerprint(session) })).sort((a, b) => a.date.localeCompare(b.date));
}

export type ComparableHistorySet = { sessionId: number | string; date: Date | string; programId: string; durationMinutes: number; exerciseId: string; reps: number; weightCentiKg: number; volumeCentiKg: number; oneRepMaxCentiKg: number; };
export type WorkoutSessionSummary = { id: string; date: Date | string; programId: string; durationMinutes: number; setCount: number; totalVolumeKg: number; oneRmByExercise: Record<string, number>; volumeByMuscleGroup: Record<string, number>; };
export type WorkoutComparison = { first: WorkoutSessionSummary; second: WorkoutSessionSummary; volumeDeltaKg: number; durationDeltaMinutes: number; setCountDelta: number; muscleGroupDeltas: { group: string; firstVolumeKg: number; secondVolumeKg: number; deltaKg: number }[]; exerciseDeltas: { exerciseId: string; firstOneRmKg: number | null; secondOneRmKg: number | null; deltaKg: number | null }[]; };
export function groupWorkoutSessions(rows: ComparableHistorySet[]): WorkoutSessionSummary[] { const grouped = new Map<string, WorkoutSessionSummary>(); rows.forEach((row) => { const id = String(row.sessionId); const session = grouped.get(id) ?? { id, date: row.date, programId: row.programId, durationMinutes: row.durationMinutes, setCount: 0, totalVolumeKg: 0, oneRmByExercise: {}, volumeByMuscleGroup: {} }; const volumeKg = row.volumeCentiKg / 100; const group = getExercise(row.exerciseId)?.group ?? "Другое"; session.setCount += 1; session.totalVolumeKg += volumeKg; session.volumeByMuscleGroup[group] = (session.volumeByMuscleGroup[group] ?? 0) + volumeKg; session.oneRmByExercise[row.exerciseId] = Math.max(session.oneRmByExercise[row.exerciseId] ?? 0, row.oneRepMaxCentiKg / 100); grouped.set(id, session); }); return Array.from(grouped.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); }
export function buildWorkoutComparison(first: WorkoutSessionSummary, second: WorkoutSessionSummary): WorkoutComparison { const exerciseIds = Array.from(new Set([...Object.keys(first.oneRmByExercise), ...Object.keys(second.oneRmByExercise)])).sort(); const muscleGroups = Array.from(new Set([...Object.keys(first.volumeByMuscleGroup), ...Object.keys(second.volumeByMuscleGroup)])).sort(); return { first, second, volumeDeltaKg: second.totalVolumeKg - first.totalVolumeKg, durationDeltaMinutes: second.durationMinutes - first.durationMinutes, setCountDelta: second.setCount - first.setCount, muscleGroupDeltas: muscleGroups.map((group) => ({ group, firstVolumeKg: first.volumeByMuscleGroup[group] ?? 0, secondVolumeKg: second.volumeByMuscleGroup[group] ?? 0, deltaKg: (second.volumeByMuscleGroup[group] ?? 0) - (first.volumeByMuscleGroup[group] ?? 0) })), exerciseDeltas: exerciseIds.map((exerciseId) => { const firstOneRmKg = first.oneRmByExercise[exerciseId] ?? null; const secondOneRmKg = second.oneRmByExercise[exerciseId] ?? null; return { exerciseId, firstOneRmKg, secondOneRmKg, deltaKg: firstOneRmKg === null || secondOneRmKg === null ? null : secondOneRmKg - firstOneRmKg }; }) }; }
