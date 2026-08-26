import { describe, expect, it } from "vitest";
import {
  isDraftForProgram,
  normalizeActiveWorkoutDraft,
} from "../lib/active-workout-draft-storage";

describe("черновик активной тренировки", () => {
  const snapshot = {
    programId: "upper-strength",
    startedAt: 1_700_000_000_000,
    activeId: "bench-press",
    draft: [{ reps: "8", weight: "80", type: "working" as const }],
    setsByExercise: {
      "bench-press": [{ reps: "8", weight: "80", type: "working" as const }],
    },
    replacements: {},
    removedExerciseIds: [],
    done: { "bench-press": true },
    addedSessionExercises: [],
    sessionOrder: ["bench-press"],
    restEndAt: null,
    restTotal: 90,
    restStartedAt: null,
    completedRestSeconds: 48,
    restNotificationAction: "finish-exercise" as const,
    restNotificationExerciseId: "bench-press",
    restNotificationSetIndex: 0,
    restNotificationWeight: "80",
    restNotificationReps: "8",
    savedAt: 1_700_000_000_120,
    machineSetup: "Скамья 2",
    note: "Контроль паузы",
    activeSet: {
      exerciseId: "bench-press",
      setIndex: 0,
      startedAt: 1_700_000_000_050,
    },
    setTimings: {
      "bench-press:0": {
        startedAt: 1_700_000_000_010,
        finishedAt: 1_700_000_000_040,
        activeSeconds: 30,
      },
    },
  };

  it("восстанавливает валидный сохранённый черновик", () => {
    const restored = normalizeActiveWorkoutDraft(snapshot);
    expect(restored?.setsByExercise["bench-press"][0].weight).toBe("80");
    expect(restored?.savedAt).toBe(1_700_000_000_120);
    expect(restored?.completedRestSeconds).toBe(48);
    expect(restored?.restNotificationAction).toBe("finish-exercise");
    expect(restored?.restNotificationExerciseId).toBe("bench-press");
    expect(restored?.restNotificationSetIndex).toBe(0);
    expect(restored?.restNotificationWeight).toBe("80");
    expect(restored?.restNotificationReps).toBe("8");
    expect(restored?.activeSet).toEqual(snapshot.activeSet);
    expect(restored?.setTimings["bench-press:0"].activeSeconds).toBe(30);
    expect(isDraftForProgram(restored, "upper-strength")).toBe(true);
  });

  it("безопасно дополняет старые черновики без метрик времени", () => {
    const legacySnapshot = { ...snapshot } as Record<string, unknown>;
    delete legacySnapshot.restStartedAt;
    delete legacySnapshot.completedRestSeconds;
    delete legacySnapshot.restNotificationAction;
    delete legacySnapshot.restNotificationExerciseId;
    delete legacySnapshot.restNotificationSetIndex;
    delete legacySnapshot.restNotificationWeight;
    delete legacySnapshot.restNotificationReps;
    delete legacySnapshot.activeSet;
    delete legacySnapshot.setTimings;
    const restored = normalizeActiveWorkoutDraft(legacySnapshot);

    expect(restored?.restStartedAt).toBeNull();
    expect(restored?.completedRestSeconds).toBe(0);
    expect(restored?.restNotificationAction).toBe("start");
    expect(restored?.restNotificationExerciseId).toBe("");
    expect(restored?.restNotificationSetIndex).toBeNull();
    expect(restored?.restNotificationWeight).toBe("");
    expect(restored?.restNotificationReps).toBe("");
    expect(restored?.activeSet).toBeNull();
    expect(restored?.setTimings).toEqual({});
  });

  it("игнорирует повреждённый или чужой черновик", () => {
    expect(
      normalizeActiveWorkoutDraft({ programId: "upper-strength" }),
    ).toBeNull();
    expect(
      isDraftForProgram(normalizeActiveWorkoutDraft(snapshot), "full-body"),
    ).toBe(false);
  });
});
