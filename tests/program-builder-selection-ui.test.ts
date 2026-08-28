import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const screen = readFileSync(
  resolve(process.cwd(), "app/program/new.tsx"),
  "utf8",
);

describe("program builder selected exercises", () => {
  it("renders each selected exercise as one card with its own parameters and no duplicate settings section", () => {
    expect(screen).toContain("selectedExercises.map((exercise, index)");
    expect(screen).toContain("exerciseSettingsRow");
    expect(screen).toContain("exerciseSettingsHeader");
    expect(screen).toContain("removeExerciseFromProgram(exercise.id)");
    expect(screen).toContain("Добавить из каталога");
    expect(screen).toContain("Сеты");
    expect(screen).toContain("Повторы");
    expect(screen).toContain("Отдых, сек");
    expect(screen).toContain("restBetweenSets");
    expect(screen).toContain("restBlockByExerciseId.get(exercise.id)");
    expect(screen).toContain("Добавить отдых между упражнениями");
    expect(screen).not.toContain("В ПРОГРАММЕ · {selectedExercises.length}");
    expect(screen).not.toContain("Параметры упражнений");
    expect(screen).not.toContain("selectedPanelHeader");
    expect(screen).not.toContain("exerciseSettingsPanel");
  });

  it("starts a brand-new program without selected exercises while preserving route and edit selections", () => {
    expect(screen).toContain("params.exerciseId ? [params.exerciseId] : []");
    expect(screen).toContain("editingProgram?.exercises.map");
    expect(screen).not.toContain('["bench-press", "barbell-row", "squat"]');
  });

  it("filters the available catalogue by muscle group without restoring the obsolete arm filter", () => {
    expect(screen).toContain("const [catalogGroup, setCatalogGroup]");
    expect(screen).toContain("muscleGroups.map((group)");
    expect(screen).toContain("matchesGroup && !selectedIds.has(exercise.id)");
    expect(screen).not.toContain('"Руки"');
  });
});
