import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProgramExercise, SetType } from "./workout-data";

const ACTIVE_WORKOUT_DRAFT_KEY = "ironrise.active-workout-draft.v1";

export type WorkoutDraftSet = {
  reps: string;
  weight: string;
  distance?: string;
  type: SetType;
  dropSubsets?: { reps: string; weight: string }[];
};

export type ActiveSetDraftTiming = {
  exerciseId: string;
  setIndex: number;
  startedAt: number;
};

export type CompletedSetDraftTiming = {
  startedAt: number;
  finishedAt: number;
  activeSeconds: number;
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
  restStartedAt: number | null;
  completedRestSeconds: number;
  restNotificationAction: "start" | "finish-exercise";
  restNotificationExerciseId: string;
  restNotificationSetIndex: number | null;
  restNotificationWeight: string;
  restNotificationReps: string;
  savedAt: number | null;
  machineSetup: string;
  note: string;
  activeSet: ActiveSetDraftTiming | null;
  setTimings: Record<string, CompletedSetDraftTiming>;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Guards persisted data so an old or malformed cache never blocks workout startup. */
export function normalizeActiveWorkoutDraft(
  value: unknown,
): ActiveWorkoutDraftSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<ActiveWorkoutDraftSnapshot>;
  if (typeof draft.programId !== "string" || !isFiniteNumber(draft.startedAt))
    return null;
  return {
    programId: draft.programId,
    startedAt: draft.startedAt,
    activeId: typeof draft.activeId === "string" ? draft.activeId : null,
    draft: Array.isArray(draft.draft) ? (draft.draft as WorkoutDraftSet[]) : [],
    setsByExercise:
      draft.setsByExercise && typeof draft.setsByExercise === "object"
        ? (draft.setsByExercise as Record<string, WorkoutDraftSet[]>)
        : {},
    replacements:
      draft.replacements && typeof draft.replacements === "object"
        ? (draft.replacements as Record<string, string>)
        : {},
    removedExerciseIds: Array.isArray(draft.removedExerciseIds)
      ? draft.removedExerciseIds.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
    done:
      draft.done && typeof draft.done === "object"
        ? (draft.done as Record<string, boolean>)
        : {},
    addedSessionExercises: Array.isArray(draft.addedSessionExercises)
      ? (draft.addedSessionExercises as ProgramExercise[])
      : [],
    sessionOrder: Array.isArray(draft.sessionOrder)
      ? draft.sessionOrder.filter((id): id is string => typeof id === "string")
      : [],
    restEndAt: isFiniteNumber(draft.restEndAt) ? draft.restEndAt : null,
    restTotal: isFiniteNumber(draft.restTotal)
      ? Math.max(0, draft.restTotal)
      : 0,
    restStartedAt: isFiniteNumber(draft.restStartedAt)
      ? draft.restStartedAt
      : null,
    completedRestSeconds: isFiniteNumber(draft.completedRestSeconds)
      ? Math.max(0, draft.completedRestSeconds)
      : 0,
    restNotificationAction:
      draft.restNotificationAction === "finish-exercise"
        ? "finish-exercise"
        : "start",
    restNotificationExerciseId:
      typeof draft.restNotificationExerciseId === "string"
        ? draft.restNotificationExerciseId
        : "",
    restNotificationSetIndex:
      Number.isInteger(draft.restNotificationSetIndex) &&
      (draft.restNotificationSetIndex as number) >= 0
        ? (draft.restNotificationSetIndex as number)
        : null,
    restNotificationWeight:
      typeof draft.restNotificationWeight === "string"
        ? draft.restNotificationWeight
        : "",
    restNotificationReps:
      typeof draft.restNotificationReps === "string"
        ? draft.restNotificationReps
        : "",
    savedAt: isFiniteNumber(draft.savedAt) ? draft.savedAt : null,
    machineSetup:
      typeof draft.machineSetup === "string" ? draft.machineSetup : "",
    note: typeof draft.note === "string" ? draft.note : "",
    activeSet:
      draft.activeSet &&
      typeof draft.activeSet === "object" &&
      typeof draft.activeSet.exerciseId === "string" &&
      Number.isInteger(draft.activeSet.setIndex) &&
      isFiniteNumber(draft.activeSet.startedAt)
        ? {
            exerciseId: draft.activeSet.exerciseId,
            setIndex: Math.max(0, draft.activeSet.setIndex),
            startedAt: draft.activeSet.startedAt,
          }
        : null,
    setTimings:
      draft.setTimings && typeof draft.setTimings === "object"
        ? Object.fromEntries(
            Object.entries(draft.setTimings).flatMap(([key, timing]) => {
              const candidate = timing as Partial<CompletedSetDraftTiming>;
              return isFiniteNumber(candidate.startedAt) &&
                isFiniteNumber(candidate.finishedAt) &&
                isFiniteNumber(candidate.activeSeconds)
                ? [
                    [
                      key,
                      {
                        startedAt: candidate.startedAt,
                        finishedAt: candidate.finishedAt,
                        activeSeconds: Math.max(0, candidate.activeSeconds),
                      },
                    ],
                  ]
                : [];
            }),
          )
        : {},
  };
}

export function isDraftForProgram(
  snapshot: ActiveWorkoutDraftSnapshot | null,
  programId: string,
) {
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

export async function saveActiveWorkoutDraft(
  snapshot: ActiveWorkoutDraftSnapshot,
) {
  await AsyncStorage.setItem(
    ACTIVE_WORKOUT_DRAFT_KEY,
    JSON.stringify(snapshot),
  );
}

export async function clearActiveWorkoutDraft() {
  await AsyncStorage.removeItem(ACTIVE_WORKOUT_DRAFT_KEY);
}
