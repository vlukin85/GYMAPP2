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
    expect(screen).toContain("Обязательный интервал после последнего подхода");
    expect(screen).toContain("ensureProgramRestBlocks");
    expect(screen).not.toContain("В ПРОГРАММЕ · {selectedExercises.length}");
    expect(screen).not.toContain("Параметры упражнений");
    expect(screen).not.toContain("selectedPanelHeader");
    expect(screen).not.toContain("exerciseSettingsPanel");
  });

  it("keeps new exercise parameters empty and validates every required field before save", () => {
    expect(screen).toContain('sets: existing ? String(existing.sets) : ""');
    expect(screen).toContain('reps: existing ? String(existing.reps) : ""');
    expect(screen).toContain('weight: existing ? String(existing.weight) : ""');
    expect(screen).toContain('restBetweenSets: existing ? String(existing.restBetweenSets ?? existing.rest ?? "") : ""');
    expect(screen).toContain('const invalidExercise = selectedExercises.find');
    expect(screen).toContain('if (invalidExercise)');
    expect(screen).toContain('Заполните параметры');
    expect(screen).toContain('!settings.sets.trim()');
    expect(screen).toContain('!settings.reps.trim()');
    expect(screen).toContain('!settings.weight.trim()');
    expect(screen).toContain('!settings.restBetweenSets.trim()');
    expect(screen).toContain('const missingTransitionRest = selectedExercises.slice(0, -1).find');
    expect(screen).toContain('Заполните интервалы отдыха');
    expect(screen).toContain('Расчётное время тренировки');
    expect(screen).toContain('estimateProgramDurationSeconds');
    expect(screen).toContain('durationSeconds: 0');
    expect(screen).toContain('setRestBlocks((current) => ensureProgramRestBlocks(current, nextSelected))');
    expect(screen).toContain('duration < MIN_PROGRAM_REST_BLOCK_SECONDS');
    expect(screen).not.toContain('?? { sets, reps, weight, restBetweenSets: rest }');
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
