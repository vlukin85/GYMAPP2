import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { bestOneRepMax, completedWorkouts as seedCompleted, createCustomExercise, defaultPrograms, mergeStoredPrograms, normalizeExerciseImagePreference, setCustomExercises, type AiExerciseArtStyle, type BarbellProfile, type CompletedWorkout, type CustomExerciseDraft, type Exercise, type ExerciseGalleryImage, type ExerciseImagePreference, type ExercisePreference, type OneRepMaxFormula, type PersonalRecord, type ScheduledWorkout, type WorkoutProgram } from "./workout-data";

export const SET_HAPTIC_INTENSITIES = ["light", "medium", "heavy"] as const;
export type SetHapticIntensity = (typeof SET_HAPTIC_INTENSITIES)[number];
const isSetHapticIntensity = (value: unknown): value is SetHapticIntensity => typeof value === "string" && SET_HAPTIC_INTENSITIES.includes(value as SetHapticIntensity);

type WorkoutState = {
  programs: WorkoutProgram[];
  completed: CompletedWorkout[];
  scheduled: Record<string, ScheduledWorkout>;
  activeWorkout: { programId: string; startedAt: number } | null;
  oneRmFormula: OneRepMaxFormula;
  plateStepKg: number;
  barbellProfile: BarbellProfile;
  personalRecords: Record<string, PersonalRecord>;
  bodyWeightKg: number;
  bodyweightVolumePercent: number;
  restTimerSoundEnabled: boolean;
  restTimerVibrationEnabled: boolean;
  hapticIntensity: SetHapticIntensity;
  exercisePreferences: Record<string, ExercisePreference>;
  deletedProgramIds: string[];
  customExercises: Exercise[];
  exerciseImageOverrides: Record<string, string>;
  exerciseGalleries: Record<string, ExerciseGalleryImage[]>;
  exerciseImagePreferences: Record<string, ExerciseImagePreference>;
};

type WorkoutContextValue = WorkoutState & {
  ready: boolean;
  startWorkout: (programId: string) => void;
  discardActiveWorkout: () => void;
  finishWorkout: (programId: string, volume: number, sets: { exerciseId: string; weight: number; reps: number }[]) => { minutes: number; newRecordIds: string[]; maxOneRmDelta: number };
  deleteCompletedWorkout: (workoutId: string) => void;
  scheduleProgram: (date: string, schedule: ScheduledWorkout) => void;
  removeSchedule: (date: string) => void;
  addProgram: (program: WorkoutProgram) => void;
  addPrograms: (programs: WorkoutProgram[]) => void;
  updateProgram: (programId: string, update: Pick<WorkoutProgram, "name" | "description" | "exercises">) => void;
  addExerciseToProgram: (programId: string, exerciseId: string) => boolean;
  addCustomExercise: (draft: CustomExerciseDraft) => string | null;
  setExerciseImage: (exerciseId: string, image: string) => void;
  addExerciseImage: (exerciseId: string, image: string) => void;
  removeExerciseImage: (exerciseId: string, imageId: string) => void;
  moveExerciseImage: (exerciseId: string, imageId: string, direction: -1 | 1) => void;
  setExerciseImageStyle: (exerciseId: string, style: AiExerciseArtStyle) => void;
  toggleExerciseImageFavorite: (exerciseId: string, imageId: string) => void;
  rateExerciseImage: (exerciseId: string, imageId: string, rating: number) => void;
  setProgramCover: (programId: string, coverImage: string) => void;
  renameProgram: (programId: string, name: string) => void;
  archiveProgram: (programId: string) => void;
  archivePrograms: (programIds: string[]) => void;
  restoreProgram: (programId: string) => void;
  deleteProgram: (programId: string) => void;
  setOneRmFormula: (formula: OneRepMaxFormula) => void;
  setPlateStepKg: (step: number) => void;
  setBarbellProfile: (profile: BarbellProfile) => void;
  setBodyweightVolumeSettings: (bodyWeightKg: number, bodyweightVolumePercent: number) => void;
  setRestTimerSoundEnabled: (enabled: boolean) => void;
  setRestTimerVibrationEnabled: (enabled: boolean) => void;
  setHapticIntensity: (intensity: SetHapticIntensity) => void;
  setExercisePreference: (exerciseId: string, preference: ExercisePreference) => void;
  repeatLastWorkout: () => string | null;
  importCompletedWorkouts: (workouts: { id: string; programId: string; date: string; durationMinutes: number; totalVolume: number; sets: { exerciseId: string; weight: number; reps: number }[] }[]) => void;
  restoreTrainingBackup: (snapshot: Partial<Pick<WorkoutState, "oneRmFormula" | "plateStepKg" | "barbellProfile" | "personalRecords" | "bodyWeightKg" | "bodyweightVolumePercent" | "exercisePreferences" | "hapticIntensity">>) => void;
};

const STORAGE_KEY = "gym-diary-state-v1";

export function rebuildPersonalRecords(completed: CompletedWorkout[], formula: OneRepMaxFormula): Record<string, PersonalRecord> {
  return [...completed]
    .sort((first, second) => `${first.date}-${first.id}`.localeCompare(`${second.date}-${second.id}`))
    .reduce<Record<string, PersonalRecord>>((records, workout) => {
      const grouped = (workout.sets ?? []).reduce<Record<string, { weight: number; reps: number }[]>>((current, set) => {
        (current[set.exerciseId] ??= []).push({ weight: set.weight, reps: set.reps });
        return current;
      }, {});
      Object.entries(grouped).forEach(([exerciseId, sets]) => {
        const bestSet = sets.reduce((best, set) => bestOneRepMax([set], formula) > bestOneRepMax([best], formula) ? set : best, sets[0]);
        const estimatedOneRepMax = bestOneRepMax(sets, formula);
        if (!records[exerciseId] || estimatedOneRepMax > records[exerciseId].estimatedOneRepMax) {
          records[exerciseId] = { exerciseId, weight: bestSet.weight, reps: bestSet.reps, estimatedOneRepMax, achievedAt: `${workout.date}T12:00:00.000Z`, achievedWorkoutId: workout.id };
        }
      });
      return records;
    }, {});
}

const initialState: WorkoutState = {
  programs: defaultPrograms,
  completed: seedCompleted,
  scheduled: { "2026-08-13": { programId: "upper-strength", time: "18:30", reminderMinutes: 60 }, "2026-08-15": { programId: "leg-day", time: "11:00", reminderMinutes: 30 } },
  activeWorkout: null,
  oneRmFormula: "epley",
  plateStepKg: 2.5,
  barbellProfile: { barWeightKg: 20, availablePlatesKg: [25, 20, 15, 10, 5, 2.5, 1.25] },
  personalRecords: {},
  bodyWeightKg: 75,
  bodyweightVolumePercent: 65,
  restTimerSoundEnabled: true,
  restTimerVibrationEnabled: true,
  hapticIntensity: "light",
  exercisePreferences: {},
  deletedProgramIds: [],
  customExercises: [],
  exerciseImageOverrides: {},
  exerciseGalleries: {},
  exerciseImagePreferences: {},
};

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        const parsed = JSON.parse(value) as Partial<WorkoutState>;
        const migratedScheduled = Object.fromEntries(Object.entries(parsed.scheduled ?? initialState.scheduled).map(([date, item]) => [date, typeof item === "string" ? { programId: item, time: "18:30", reminderMinutes: 60 } : item])) as Record<string, ScheduledWorkout>;
        const deletedProgramIds = parsed.deletedProgramIds ?? [];
        const customExercises = parsed.customExercises ?? [];
        setCustomExercises(customExercises);
        const exerciseImagePreferences = Object.fromEntries(Object.entries(parsed.exerciseImagePreferences ?? {}).map(([exerciseId, preference]) => [exerciseId, normalizeExerciseImagePreference(preference)]));
        setState({ ...initialState, ...parsed, programs: mergeStoredPrograms(parsed.programs).filter((program) => !deletedProgramIds.includes(program.id)), scheduled: migratedScheduled, deletedProgramIds, customExercises, exerciseImageOverrides: parsed.exerciseImageOverrides ?? {}, exerciseGalleries: parsed.exerciseGalleries ?? {}, exerciseImagePreferences, oneRmFormula: parsed.oneRmFormula ?? initialState.oneRmFormula, plateStepKg: parsed.plateStepKg ?? initialState.plateStepKg, barbellProfile: parsed.barbellProfile ?? initialState.barbellProfile, personalRecords: parsed.personalRecords ?? {}, bodyWeightKg: parsed.bodyWeightKg ?? initialState.bodyWeightKg, bodyweightVolumePercent: parsed.bodyweightVolumePercent ?? initialState.bodyweightVolumePercent, restTimerSoundEnabled: parsed.restTimerSoundEnabled ?? initialState.restTimerSoundEnabled, restTimerVibrationEnabled: parsed.restTimerVibrationEnabled ?? initialState.restTimerVibrationEnabled, hapticIntensity: isSetHapticIntensity(parsed.hapticIntensity) ? parsed.hapticIntensity : initialState.hapticIntensity, exercisePreferences: parsed.exercisePreferences ?? {} });
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  useEffect(() => { if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state, ready]);

  const value = useMemo<WorkoutContextValue>(() => ({
    ...state,
    ready,
    startWorkout: (programId) => setState((current) => ({ ...current, activeWorkout: { programId, startedAt: Date.now() } })),
    discardActiveWorkout: () => setState((current) => ({ ...current, activeWorkout: null })),
    finishWorkout: (programId, volume, sets) => {
      const workoutId = `w-${Date.now()}`;
      const minutes = Math.max(1, Math.round((Date.now() - (state.activeWorkout?.startedAt ?? Date.now())) / 60000));
      const grouped = sets.reduce<Record<string, { weight: number; reps: number }[]>>((acc, set) => { (acc[set.exerciseId] ??= []).push({ weight: set.weight, reps: set.reps }); return acc; }, {});
      const records = { ...state.personalRecords };
      const newRecordIds: string[] = [];
      let maxOneRmDelta = 0;
      Object.entries(grouped).forEach(([exerciseId, exerciseSets]) => {
        const bestSet = exerciseSets.reduce((best, set) => bestOneRepMax([set], state.oneRmFormula) > bestOneRepMax([best], state.oneRmFormula) ? set : best, exerciseSets[0]);
        const estimatedOneRepMax = bestOneRepMax(exerciseSets, state.oneRmFormula);
        if (!records[exerciseId] || estimatedOneRepMax > records[exerciseId].estimatedOneRepMax) {
          const delta = records[exerciseId] ? estimatedOneRepMax - records[exerciseId].estimatedOneRepMax : 0;
          records[exerciseId] = { exerciseId, weight: bestSet.weight, reps: bestSet.reps, estimatedOneRepMax, achievedAt: new Date().toISOString(), achievedWorkoutId: workoutId };
          newRecordIds.push(exerciseId);
          maxOneRmDelta = Math.max(maxOneRmDelta, delta);
        }
      });
      setState((current) => ({ ...current, activeWorkout: null, personalRecords: records, completed: [{ id: workoutId, programId, date: new Date().toISOString().slice(0, 10), durationMinutes: minutes, totalVolume: volume, sets }, ...current.completed] }));
      return { minutes, newRecordIds, maxOneRmDelta };
    },
    deleteCompletedWorkout: (workoutId) => setState((current) => {
      const completed = current.completed.filter((workout) => workout.id !== workoutId);
      return { ...current, completed, personalRecords: rebuildPersonalRecords(completed, current.oneRmFormula) };
    }),
    scheduleProgram: (date, schedule) => setState((current) => ({ ...current, scheduled: { ...current.scheduled, [date]: schedule } })),
    removeSchedule: (date) => setState((current) => { const scheduled = { ...current.scheduled }; delete scheduled[date]; return { ...current, scheduled }; }),
    addProgram: (program) => setState((current) => ({ ...current, programs: [...current.programs, { ...program, createdAt: program.createdAt ?? new Date().toISOString() }] })),
    addPrograms: (programs) => setState((current) => ({ ...current, programs: [...current.programs, ...programs.map((program) => ({ ...program, archivedAt: undefined, createdAt: program.createdAt ?? new Date().toISOString() }))] })),
    updateProgram: (programId, update) => setState((current) => ({ ...current, programs: current.programs.map((program) => program.id === programId ? { ...program, ...update, name: update.name.trim() || program.name } : program) })),
    addExerciseToProgram: (programId, exerciseId) => {
      const program = state.programs.find((item) => item.id === programId);
      if (!program || program.exercises.some((item) => item.exerciseId === exerciseId)) return false;
      setState((current) => ({ ...current, programs: current.programs.map((item) => item.id === programId ? { ...item, exercises: [...item.exercises, { exerciseId, sets: 3, reps: 10, weight: 0, rest: 90, setType: "working" }] } : item) }));
      return true;
    },
    addCustomExercise: (draft) => {
      const normalizedName = draft.name.trim();
      if (!normalizedName) return null;
      const duplicate = state.customExercises.some((exercise) => exercise.name.trim().toLocaleLowerCase("ru") === normalizedName.toLocaleLowerCase("ru"));
      if (duplicate) return null;
      const id = `custom-exercise-${Date.now()}`;
      const exercise = createCustomExercise({ ...draft, name: normalizedName }, id);
      setCustomExercises([...state.customExercises, exercise]);
      setState((current) => ({ ...current, customExercises: [...current.customExercises, exercise] }));
      return id;
    },
    setExerciseImage: (exerciseId, image) => setState((current) => {
      const customExercises = current.customExercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, image, photoAngles: [{ id: "main" as const, label: "Моё изображение", url: image }] } : exercise);
      setCustomExercises(customExercises);
      return { ...current, customExercises, exerciseImageOverrides: { ...current.exerciseImageOverrides, [exerciseId]: image } };
    }),
    addExerciseImage: (exerciseId, image) => setState((current) => {
      const gallery = current.exerciseGalleries[exerciseId] ?? [];
      if (gallery.some((item) => item.url === image) || gallery.length >= 8) return current;
      const nextGallery = [...gallery, { id: `user-image-${Date.now()}`, label: `Моё фото ${gallery.length + 1}`, url: image }];
      return { ...current, exerciseGalleries: { ...current.exerciseGalleries, [exerciseId]: nextGallery } };
    }),
    removeExerciseImage: (exerciseId, imageId) => setState((current) => {
      const nextGallery = (current.exerciseGalleries[exerciseId] ?? []).filter((item) => item.id !== imageId);
      return { ...current, exerciseGalleries: { ...current.exerciseGalleries, [exerciseId]: nextGallery } };
    }),
    moveExerciseImage: (exerciseId, imageId, direction) => setState((current) => {
      const gallery = [...(current.exerciseGalleries[exerciseId] ?? [])];
      const index = gallery.findIndex((item) => item.id === imageId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= gallery.length) return current;
      [gallery[index], gallery[target]] = [gallery[target], gallery[index]];
      return { ...current, exerciseGalleries: { ...current.exerciseGalleries, [exerciseId]: gallery } };
    }),
    setExerciseImageStyle: (exerciseId, style) => setState((current) => ({ ...current, exerciseImagePreferences: { ...current.exerciseImagePreferences, [exerciseId]: { ...normalizeExerciseImagePreference(current.exerciseImagePreferences[exerciseId]), style } } })),
    toggleExerciseImageFavorite: (exerciseId, imageId) => setState((current) => {
      const preference = normalizeExerciseImagePreference(current.exerciseImagePreferences[exerciseId]);
      const favoriteImageIds = preference.favoriteImageIds.includes(imageId) ? preference.favoriteImageIds.filter((id) => id !== imageId) : [...preference.favoriteImageIds, imageId];
      return { ...current, exerciseImagePreferences: { ...current.exerciseImagePreferences, [exerciseId]: { ...preference, favoriteImageIds } } };
    }),
    rateExerciseImage: (exerciseId, imageId, rating) => setState((current) => {
      const preference = normalizeExerciseImagePreference(current.exerciseImagePreferences[exerciseId]);
      const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
      return { ...current, exerciseImagePreferences: { ...current.exerciseImagePreferences, [exerciseId]: { ...preference, ratings: { ...preference.ratings, [imageId]: safeRating } } } };
    }),
    setProgramCover: (programId, coverImage) => setState((current) => ({ ...current, programs: current.programs.map((program) => program.id === programId ? { ...program, coverImage } : program) })),
    renameProgram: (programId, name) => { const normalizedName = name.trim(); if (normalizedName) setState((current) => ({ ...current, programs: current.programs.map((program) => program.id === programId ? { ...program, name: normalizedName } : program) })); },
    archiveProgram: (programId) => setState((current) => ({ ...current, programs: current.programs.map((program) => program.id === programId ? { ...program, archivedAt: new Date().toISOString() } : program) })),
    archivePrograms: (programIds) => { const selected = new Set(programIds); if (selected.size) setState((current) => ({ ...current, programs: current.programs.map((program) => selected.has(program.id) ? { ...program, archivedAt: new Date().toISOString() } : program) })); },
    restoreProgram: (programId) => setState((current) => ({ ...current, programs: current.programs.map((program) => program.id === programId ? { ...program, archivedAt: undefined } : program) })),
    deleteProgram: (programId) => setState((current) => {
      const scheduled = Object.fromEntries(Object.entries(current.scheduled).filter(([, schedule]) => schedule.programId !== programId));
      return { ...current, programs: current.programs.filter((program) => program.id !== programId), scheduled, activeWorkout: current.activeWorkout?.programId === programId ? null : current.activeWorkout, deletedProgramIds: [...new Set([...current.deletedProgramIds, programId])] };
    }),
    setOneRmFormula: (oneRmFormula) => setState((current) => ({ ...current, oneRmFormula })),
    setPlateStepKg: (plateStepKg) => setState((current) => ({ ...current, plateStepKg })),
    setBarbellProfile: (barbellProfile) => setState((current) => ({ ...current, barbellProfile })),
    setBodyweightVolumeSettings: (bodyWeightKg, bodyweightVolumePercent) => setState((current) => ({ ...current, bodyWeightKg: Math.max(1, bodyWeightKg), bodyweightVolumePercent: Math.min(100, Math.max(0, bodyweightVolumePercent)) })),
    setRestTimerSoundEnabled: (restTimerSoundEnabled) => setState((current) => ({ ...current, restTimerSoundEnabled })),
    setRestTimerVibrationEnabled: (restTimerVibrationEnabled) => setState((current) => ({ ...current, restTimerVibrationEnabled })),
    setHapticIntensity: (hapticIntensity) => setState((current) => ({ ...current, hapticIntensity })),
    setExercisePreference: (exerciseId, preference) => setState((current) => ({ ...current, exercisePreferences: { ...current.exercisePreferences, [exerciseId]: preference } })),
    repeatLastWorkout: () => {
      const programId = state.completed[0]?.programId;
      if (programId) setState((current) => ({ ...current, activeWorkout: { programId, startedAt: Date.now() } }));
      return programId ?? null;
    },
    importCompletedWorkouts: (workouts) => setState((current) => {
      const personalRecords = { ...current.personalRecords };
      workouts.forEach((workout) => {
        const grouped = workout.sets.reduce<Record<string, { weight: number; reps: number }[]>>((acc, set) => { (acc[set.exerciseId] ??= []).push({ weight: set.weight, reps: set.reps }); return acc; }, {});
        Object.entries(grouped).forEach(([exerciseId, exerciseSets]) => {
          const bestSet = exerciseSets.reduce((best, set) => bestOneRepMax([set], current.oneRmFormula) > bestOneRepMax([best], current.oneRmFormula) ? set : best, exerciseSets[0]);
          const estimatedOneRepMax = bestOneRepMax(exerciseSets, current.oneRmFormula);
          if (!personalRecords[exerciseId] || estimatedOneRepMax > personalRecords[exerciseId].estimatedOneRepMax) personalRecords[exerciseId] = { exerciseId, weight: bestSet.weight, reps: bestSet.reps, estimatedOneRepMax, achievedAt: `${workout.date}T12:00:00.000Z` };
        });
      });
      const existing = new Map(current.completed.map((workout) => [workout.id, workout]));
      workouts.forEach((workout) => existing.set(workout.id, { id: workout.id, programId: workout.programId, date: workout.date, durationMinutes: workout.durationMinutes, totalVolume: workout.totalVolume, sets: workout.sets }));
      return { ...current, personalRecords, completed: Array.from(existing.values()).sort((a, b) => b.date.localeCompare(a.date)) };
    }),
    restoreTrainingBackup: (snapshot) => setState((current) => ({ ...current, oneRmFormula: snapshot.oneRmFormula ?? current.oneRmFormula, plateStepKg: snapshot.plateStepKg ?? current.plateStepKg, barbellProfile: snapshot.barbellProfile ?? current.barbellProfile, personalRecords: snapshot.personalRecords ?? current.personalRecords, bodyWeightKg: snapshot.bodyWeightKg ?? current.bodyWeightKg, bodyweightVolumePercent: snapshot.bodyweightVolumePercent ?? current.bodyweightVolumePercent, hapticIntensity: snapshot.hapticIntensity ?? current.hapticIntensity, exercisePreferences: snapshot.exercisePreferences ?? current.exercisePreferences })),
  }), [state, ready]);

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkoutStore() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkoutStore must be used inside WorkoutProvider");
  return context;
}
