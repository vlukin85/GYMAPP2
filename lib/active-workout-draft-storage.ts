import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProgramExercise, SetType } from "./workout-data";

const ACTIVE_WORKOUT_DRAFT_KEY = "ironrise.active-workout-draft.v1";

export type WorkoutDraftSet = {
  reps: string;
  weight: string;
  type: SetType;
  dropSubsets?: { reps: string; weight: string }[];
};

export type ActiveWorkoutDraftSnapshot = {
  programId: string;
  startedAt: number;
  activeId: string | null;
  draft: WorkoutDraftSet[];
  setsByExercise: Record<string, WorkoutDraftSet[]>;
  replacements: Record<string, string>;
  removedExerciseIds: string[];
  done: Record<string, boolean>;
  addedSessionExercises: ProgramExercise[];
  sessionOrder: string[];
  restEndAt: number | null;
  restTotal: number;
  savedAt: number | null;
  machineSetup: string;
  note: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Guards persisted data so an old or malformed cache never blocks workout startup. */
export function normalizeActiveWorkoutDraft(value: unknown): ActiveWorkoutDraftSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<ActiveWorkoutDraftSnapshot>;
  if (typeof draft.programId !== "string" || !isFiniteNumber(draft.startedAt)) return null;
  return {
    programId: draft.programId,
    startedAt: draft.startedAt,
    activeId: typeof draft.activeId === "string" ? draft.activeId : null,
    draft: Array.isArray(draft.draft) ? draft.draft as WorkoutDraftSet[] : [],
    setsByExercise: draft.setsByExercise && typeof draft.setsByExercise === "object" ? draft.setsByExercise as Record<string, WorkoutDraftSet[]> : {},
    replacements: draft.replacements && typeof draft.replacements === "object" ? draft.replacements as Record<string, string> : {},
    removedExerciseIds: Array.isArray(draft.removedExerciseIds) ? draft.removedExerciseIds.filter((id): id is string => typeof id === "string") : [],
    done: draft.done && typeof draft.done === "object" ? draft.done as Record<string, boolean> : {},
    addedSessionExercises: Array.isArray(draft.addedSessionExercises) ? draft.addedSessionExercises as ProgramExercise[] : [],
    sessionOrder: Array.isArray(draft.sessionOrder) ? draft.sessionOrder.filter((id): id is string => typeof id === "string") : [],
    restEndAt: isFiniteNumber(draft.restEndAt) ? draft.restEndAt : null,
    restTotal: isFiniteNumber(draft.restTotal) ? Math.max(0, draft.restTotal) : 0,
    savedAt: isFiniteNumber(draft.savedAt) ? draft.savedAt : null,
    machineSetup: typeof draft.machineSetup === "string" ? draft.machineSetup : "",
    note: typeof draft.note === "string" ? draft.note : "",
  };
}

export function isDraftForProgram(snapshot: ActiveWorkoutDraftSnapshot | null, programId: string) {
  return snapshot?.programId === programId;
}

export async function loadActiveWorkoutDraft() {
  const raw = await AsyncStorage.getItem(ACTIVE_WORKOUT_DRAFT_KEY);
  if (!raw) return null;
  try {
    return normalizeActiveWorkoutDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveActiveWorkoutDraft(snapshot: ActiveWorkoutDraftSnapshot) {
  await AsyncStorage.setItem(ACTIVE_WORKOUT_DRAFT_KEY, JSON.stringify(snapshot));
}

export async function clearActiveWorkoutDraft() {
  await AsyncStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
}
