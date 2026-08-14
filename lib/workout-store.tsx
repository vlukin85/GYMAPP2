import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { bestOneRepMax, completedWorkouts as seedCompleted, defaultPrograms, mergeStoredPrograms, type BarbellProfile, type CompletedWorkout, type ExercisePreference, type OneRepMaxFormula, type PersonalRecord, type ScheduledWorkout, type WorkoutProgram } from "./workout-data";

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
  exercisePreferences: Record<string, ExercisePreference>;
};

type WorkoutContextValue = WorkoutState & {
  ready: boolean;
  startWorkout: (programId: string) => void;
  finishWorkout: (programId: string, volume: number, sets: { exerciseId: string; weight: number; reps: number }[]) => { minutes: number; newRecordIds: string[]; maxOneRmDelta: number };
  scheduleProgram: (date: string, schedule: ScheduledWorkout) => void;
  removeSchedule: (date: string) => void;
  addProgram: (program: WorkoutProgram) => void;
  setOneRmFormula: (formula: OneRepMaxFormula) => void;
  setPlateStepKg: (step: number) => void;
  setBarbellProfile: (profile: BarbellProfile) => void;
  setBodyweightVolumeSettings: (bodyWeightKg: number, bodyweightVolumePercent: number) => void;
  setExercisePreference: (exerciseId: string, preference: ExercisePreference) => void;
  repeatLastWorkout: () => string | null;
  importCompletedWorkouts: (workouts: { id: string; programId: string; date: string; durationMinutes: number; totalVolume: number; sets: { exerciseId: string; weight: number; reps: number }[] }[]) => void;
  restoreTrainingBackup: (snapshot: Partial<Pick<WorkoutState, "oneRmFormula" | "plateStepKg" | "barbellProfile" | "personalRecords" | "bodyWeightKg" | "bodyweightVolumePercent" | "exercisePreferences">>) => void;
};

const STORAGE_KEY = "gym-diary-state-v1";
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
  exercisePreferences: {},
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
        setState({ ...initialState, ...parsed, programs: mergeStoredPrograms(parsed.programs), scheduled: migratedScheduled, oneRmFormula: parsed.oneRmFormula ?? initialState.oneRmFormula, plateStepKg: parsed.plateStepKg ?? initialState.plateStepKg, barbellProfile: parsed.barbellProfile ?? initialState.barbellProfile, personalRecords: parsed.personalRecords ?? {}, bodyWeightKg: parsed.bodyWeightKg ?? initialState.bodyWeightKg, bodyweightVolumePercent: parsed.bodyweightVolumePercent ?? initialState.bodyweightVolumePercent, exercisePreferences: parsed.exercisePreferences ?? {} });
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  useEffect(() => { if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state, ready]);

  const value = useMemo<WorkoutContextValue>(() => ({
    ...state,
    ready,
    startWorkout: (programId) => setState((current) => ({ ...current, activeWorkout: { programId, startedAt: Date.now() } })),
    finishWorkout: (programId, volume, sets) => {
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
          records[exerciseId] = { exerciseId, weight: bestSet.weight, reps: bestSet.reps, estimatedOneRepMax, achievedAt: new Date().toISOString() };
          newRecordIds.push(exerciseId);
          maxOneRmDelta = Math.max(maxOneRmDelta, delta);
        }
      });
      setState((current) => ({ ...current, activeWorkout: null, personalRecords: records, completed: [{ id: `w-${Date.now()}`, programId, date: new Date().toISOString().slice(0, 10), durationMinutes: minutes, totalVolume: volume }, ...current.completed] }));
      return { minutes, newRecordIds, maxOneRmDelta };
    },
    scheduleProgram: (date, schedule) => setState((current) => ({ ...current, scheduled: { ...current.scheduled, [date]: schedule } })),
    removeSchedule: (date) => setState((current) => { const scheduled = { ...current.scheduled }; delete scheduled[date]; return { ...current, scheduled }; }),
    addProgram: (program) => setState((current) => ({ ...current, programs: [...current.programs, program] })),
    setOneRmFormula: (oneRmFormula) => setState((current) => ({ ...current, oneRmFormula })),
    setPlateStepKg: (plateStepKg) => setState((current) => ({ ...current, plateStepKg })),
    setBarbellProfile: (barbellProfile) => setState((current) => ({ ...current, barbellProfile })),
    setBodyweightVolumeSettings: (bodyWeightKg, bodyweightVolumePercent) => setState((current) => ({ ...current, bodyWeightKg: Math.max(1, bodyWeightKg), bodyweightVolumePercent: Math.min(100, Math.max(0, bodyweightVolumePercent)) })),
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
      workouts.forEach((workout) => existing.set(workout.id, { id: workout.id, programId: workout.programId, date: workout.date, durationMinutes: workout.durationMinutes, totalVolume: workout.totalVolume }));
      return { ...current, personalRecords, completed: Array.from(existing.values()).sort((a, b) => b.date.localeCompare(a.date)) };
    }),
    restoreTrainingBackup: (snapshot) => setState((current) => ({ ...current, oneRmFormula: snapshot.oneRmFormula ?? current.oneRmFormula, plateStepKg: snapshot.plateStepKg ?? current.plateStepKg, barbellProfile: snapshot.barbellProfile ?? current.barbellProfile, personalRecords: snapshot.personalRecords ?? current.personalRecords, bodyWeightKg: snapshot.bodyWeightKg ?? current.bodyWeightKg, bodyweightVolumePercent: snapshot.bodyweightVolumePercent ?? current.bodyweightVolumePercent, exercisePreferences: snapshot.exercisePreferences ?? current.exercisePreferences })),
  }), [state, ready]);

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkoutStore() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkoutStore must be used inside WorkoutProvider");
  return context;
}
