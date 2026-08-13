import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { completedWorkouts as seedCompleted, defaultPrograms, type CompletedWorkout, type WorkoutProgram } from "./workout-data";

type WorkoutState = {
  programs: WorkoutProgram[];
  completed: CompletedWorkout[];
  scheduled: Record<string, string>;
  activeWorkout: { programId: string; startedAt: number } | null;
};

type WorkoutContextValue = WorkoutState & {
  ready: boolean;
  startWorkout: (programId: string) => void;
  finishWorkout: (programId: string, volume: number) => number;
  scheduleProgram: (date: string, programId: string) => void;
  addProgram: (program: WorkoutProgram) => void;
};

const STORAGE_KEY = "gym-diary-state-v1";
const initialState: WorkoutState = { programs: defaultPrograms, completed: seedCompleted, scheduled: { "2026-08-13": "upper-strength", "2026-08-15": "leg-day" }, activeWorkout: null };
const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutState>(initialState);
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value) setState(JSON.parse(value)); setReady(true); }).catch(() => setReady(true)); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state, ready]);

  const value = useMemo<WorkoutContextValue>(() => ({
    ...state, ready,
    startWorkout: (programId) => setState((current) => ({ ...current, activeWorkout: { programId, startedAt: Date.now() } })),
    finishWorkout: (programId, volume) => {
      const minutes = Math.max(1, Math.round((Date.now() - (state.activeWorkout?.startedAt ?? Date.now())) / 60000));
      setState((current) => ({ ...current, activeWorkout: null, completed: [{ id: `w-${Date.now()}`, programId, date: new Date().toISOString().slice(0, 10), durationMinutes: minutes, totalVolume: volume }, ...current.completed] }));
      return minutes;
    },
    scheduleProgram: (date, programId) => setState((current) => ({ ...current, scheduled: { ...current.scheduled, [date]: programId } })),
    addProgram: (program) => setState((current) => ({ ...current, programs: [...current.programs, program] })),
  }), [state, ready]);
  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkoutStore() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkoutStore must be used inside WorkoutProvider");
  return context;
}
