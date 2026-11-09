import { describe, expect, it } from "vitest";
import { createCustomExercise, getExercise, getExerciseIllustrationCandidates, hasCompletedWorkoutSet, sortProgramsByCreatedAt, type Exercise, type WorkoutProgram } from "../lib/workout-data";

describe("catalog and program workflow", () => {
  it("creates a manual exercise with an individual local illustration and technique link", () => {
    const exercise = createCustomExercise({ name: "Тяга в кроссовере", group: "Спина", equipment: "Кроссовер", description: "Тяните локти к корпусу." }, "custom-exercise-1");
    expect(exercise.id).toBe("custom-exercise-1");
    expect(exercise.name).toBe("Тяга в кроссовере");
    expect(exercise.image).toContain("data:image/svg+xml");
    expect(exercise.videoUrl).toContain("rutube.ru/search/?query=");
  });

  it("sorts program registry by creation date in both directions", () => {
    const programs: WorkoutProgram[] = [
      { id: "older", name: "Раньше", description: "", createdAt: "2026-08-01T12:00:00.000Z", exercises: [] },
      { id: "newer", name: "Позже", description: "", createdAt: "2026-08-12T12:00:00.000Z", exercises: [] },
    ];
    expect(sortProgramsByCreatedAt(programs, "newest").map((program) => program.id)).toEqual(["newer", "older"]);
    expect(sortProgramsByCreatedAt(programs, "oldest").map((program) => program.id)).toEqual(["older", "newer"]);
  });

  it("accepts only a real set for partial-workout persistence", () => {
    expect(hasCompletedWorkoutSet({ reps: "8", weight: "40", type: "working" })).toBe(true);
    expect(hasCompletedWorkoutSet({ reps: "", weight: "40", type: "working" })).toBe(false);
    expect(hasCompletedWorkoutSet({ reps: "8", weight: "", type: "working" })).toBe(false);
    expect(hasCompletedWorkoutSet({ reps: "", weight: "", type: "drop", dropSubsets: [{ reps: "6", weight: "25" }] })).toBe(true);
  });

  it("offers a real photo from the offline bundle before the SVG fallback", () => {
    const exercise: Exercise = { id: "bench-press", name: "Жим", group: "Грудь", equipment: "Штанга", description: "", image: "", videoUrl: "", recordKg: 0, recordReps: 0 };
    const candidates = getExerciseIllustrationCandidates(exercise);
    // Мёртвые Manus-ссылки (individualAi/generated/group) удалены из цепочки:
    // первое фото — реальное фото из офлайн-бандла.
    expect(candidates[0].id).toBe("open-photo-bench-press");
    expect(String(candidates[0].url).length).toBeGreaterThan(0);
  });

  it("falls back to a group photo for custom exercises", () => {
    const custom: Exercise = { id: "my-custom-move", name: "Моё", group: "Грудь", equipment: "Штанга", description: "", image: "", videoUrl: "", recordKg: 0, recordReps: 0 };
    const candidates = getExerciseIllustrationCandidates(custom);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[candidates.length - 1].id.startsWith("open-photo-")).toBe(true);
  });

  it("does not offer dead Manus AI illustrations as candidates", () => {
    const exercise = getExercise("treadmill");
    expect(exercise && getExerciseIllustrationCandidates(exercise).some((candidate) => candidate.id === "ai-Кардио")).toBe(false);
  });

  it("keeps the photo first for base exercises", () => {
    const exercise = getExercise("bench-press");
    expect(exercise && getExerciseIllustrationCandidates(exercise)[0]?.id).toBe("open-photo-bench-press");
  });
});
