import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { bestOneRepMax, completedWorkouts as seedCompleted, defaultPrograms, type CompletedWorkout, type OneRepMaxFormula, type PersonalRecord, type WorkoutProgram } from "./workout-data";

type WorkoutState = {
  programs: WorkoutProgram[];
  completed: CompletedWorkout[];
  scheduled: Record<string, string>;
  activeWorkout: { programId: string; startedAt: number } | null;
  oneRmFormula: OneRepMaxFormula;
  personalRecords: Record<string, PersonalRecord>;
};

type WorkoutContextValue = WorkoutState & {
  ready: boolean;
  startWorkout: (programId: string) => void;
  finishWorkout: (programId: string, volume: number, sets: { exerciseId: string; weight: number; reps: number }[]) => { minutes: number; newRecordIds: string[] };
  scheduleProgram: (date: string, programId: string) => void;
  addProgram: (program: WorkoutProgram) => void;
  setOneRmFormula: (formula: OneRepMaxFormula) => void;
};

const STORAGE_KEY = "gym-diary-state-v1";
const initialState: WorkoutState = { programs: defaultPrograms, completed: seedCompleted, scheduled: { "2026-08-13": "upper-strength", "2026-08-15": "leg-day" }, activeWorkout: null, oneRmFormula: "epley", personalRecords: {} };
const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutState>(initialState);
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value) { const parsed = JSON.parse(value) as Partial<WorkoutState>; setState({ ...initialState, ...parsed, oneRmFormula: parsed.oneRmFormula ?? "epley", personalRecords: parsed.personalRecords ?? {} }); } setReady(true); }).catch(() => setReady(true)); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state, ready]);

  const value = useMemo<WorkoutContextValue>(() => ({
    ...state, ready,
    startWorkout: (programId) => setState((current) => ({ ...current, activeWorkout: { programId, startedAt: Date.now() } })),
    finishWorkout: (programId, volume, sets) => {
      const minutes = Math.max(1, Math.round((Date.now() - (state.activeWorkout?.startedAt ?? Date.now())) / 60000));
      const grouped = sets.reduce<Record<string, { weight: number; reps: number }[]>>((acc, set) => { (acc[set.exerciseId] ??= []).push({ weight: set.weight, reps: set.reps }); return acc; }, {});
      const records = { ...state.personalRecords };
      const newRecordIds: string[] = [];
      Object.entries(grouped).forEach(([exerciseId, exerciseSets]) => {
        const bestSet = exerciseSets.reduce((best, set) => bestOneRepMax([set], state.oneRmFormula) > bestOneRepMax([best], state.oneRmFormula) ? set : best, exerciseSets[0]);
        const estimatedOneRepMax = bestOneRepMax(exerciseSets, state.oneRmFormula);
        if (!records[exerciseId] || estimatedOneRepMax > records[exerciseId].estimatedOneRepMax) {
          records[exerciseId] = { exerciseId, weight: bestSet.weight, reps: bestSet.reps, estimatedOneRepMax, achievedAt: new Date().toISOString() };
          newRecordIds.push(exerciseId);
        }
      });
      setState((current) => ({ ...current, activeWorkout: null, personalRecords: records, completed: [{ id: `w-${Date.now()}`, programId, date: new Date().toISOString().slice(0, 10), durationMinutes: minutes, totalVolume: volume }, ...current.completed] }));
      return { minutes, newRecordIds };
    },
    scheduleProgram: (date, programId) => setState((current) => ({ ...current, scheduled: { ...current.scheduled, [date]: programId } })),
    addProgram: (program) => setState((current) => ({ ...current, programs: [...current.programs, program] })),
    setOneRmFormula: (oneRmFormula) => setState((current) => ({ ...current, oneRmFormula })),
  }), [state, ready]);
  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkoutStore() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkoutStore must be used inside WorkoutProvider");
  return context;
}
