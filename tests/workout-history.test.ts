import { describe, expect, it } from "vitest";
import { groupWorkoutHistoryExercises } from "../lib/workout-history";

describe("workout history", () => {
  it("groups completed sets by exercise for a read-only detail view", () => {
    const groups = groupWorkoutHistoryExercises({ sets: [
      { exerciseId: "bench", weight: 80, reps: 8 },
      { exerciseId: "row", weight: 60, reps: 10 },
      { exerciseId: "bench", weight: 82.5, reps: 6 },
    ] });
    expect(groups).toEqual([
      { exerciseId: "bench", sets: [{ weight: 80, reps: 8 }, { weight: 82.5, reps: 6 }], volume: 1135 },
      { exerciseId: "row", sets: [{ weight: 60, reps: 10 }], volume: 600 },
    ]);
  });
});
