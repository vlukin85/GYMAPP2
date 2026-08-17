import { describe, expect, it } from "vitest";
import { createCustomExercise, sortProgramsByCreatedAt, type WorkoutProgram } from "../lib/workout-data";

describe("catalog and program workflow", () => {
  it("creates a manual exercise with an individual local illustration and technique link", () => {
    const exercise = createCustomExercise({ name: "Тяга в кроссовере", group: "Спина", equipment: "Кроссовер", description: "Тяните локти к корпусу." }, "custom-exercise-1");
    expect(exercise.id).toBe("custom-exercise-1");
    expect(exercise.name).toBe("Тяга в кроссовере");
    expect(exercise.image).toContain("data:image/svg+xml");
    expect(exercise.videoUrl).toContain("youtube.com");
  });

  it("sorts program registry by creation date in both directions", () => {
    const programs: WorkoutProgram[] = [
      { id: "older", name: "Раньше", description: "", createdAt: "2026-08-01T12:00:00.000Z", exercises: [] },
      { id: "newer", name: "Позже", description: "", createdAt: "2026-08-12T12:00:00.000Z", exercises: [] },
    ];
    expect(sortProgramsByCreatedAt(programs, "newest").map((program) => program.id)).toEqual(["newer", "older"]);
    expect(sortProgramsByCreatedAt(programs, "oldest").map((program) => program.id)).toEqual(["older", "newer"]);
  });
});
