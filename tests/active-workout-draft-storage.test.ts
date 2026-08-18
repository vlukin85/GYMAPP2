import { describe, expect, it } from "vitest";
import { isDraftForProgram, normalizeActiveWorkoutDraft } from "../lib/active-workout-draft-storage";

describe("черновик активной тренировки", () => {
  const snapshot = {
    programId: "upper-strength",
    startedAt: 1_700_000_000_000,
    activeId: "bench-press",
    draft: [{ reps: "8", weight: "80", type: "working" as const }],
    setsByExercise: { "bench-press": [{ reps: "8", weight: "80", type: "working" as const }] },
    replacements: {},
    removedExerciseIds: [],
    done: { "bench-press": true },
    addedSessionExercises: [],
    sessionOrder: ["bench-press"],
    restEndAt: null,
    restTotal: 90,
    savedAt: 1_700_000_000_120,
    machineSetup: "Скамья 2",
    note: "Контроль паузы",
  };

  it("восстанавливает валидный сохранённый черновик", () => {
    const restored = normalizeActiveWorkoutDraft(snapshot);
    expect(restored?.setsByExercise["bench-press"][0].weight).toBe("80");
    expect(restored?.savedAt).toBe(1_700_000_000_120);
    expect(isDraftForProgram(restored, "upper-strength")).toBe(true);
  });

  it("игнорирует повреждённый или чужой черновик", () => {
    expect(normalizeActiveWorkoutDraft({ programId: "upper-strength" })).toBeNull();
    expect(isDraftForProgram(normalizeActiveWorkoutDraft(snapshot), "full-body")).toBe(false);
  });
});
