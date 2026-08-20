import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync("/home/ubuntu/gym-training-diary/app/workout-history/[id].tsx", "utf8");

describe("completed workout deletion from history", () => {
  it("confirms deletion and returns to the updated previous screen", () => {
    expect(screen).toContain("Удалить выполненную тренировку?");
    expect(screen).toContain("deleteCompletedWorkout(workout.id)");
    expect(screen).toContain("Статистика и личные рекорды будут пересчитаны");
    expect(screen).toContain("router.back()");
  });

  it("offers a full local correction flow for duration and factual sets", () => {
    expect(screen).toContain("Редактировать");
    expect(screen).toContain("updateCompletedWorkout(workout.id");
    expect(screen).toContain("Сохранить изменения");
    expect(screen).toContain("ФАКТИЧЕСКИЙ РЕЗУЛЬТАТ");
  });

  it("supports removing an individual factual set and adding a workout note", () => {
    expect(screen).toContain("removeDraftSet");
    expect(screen).toContain("Удалить подход?");
    expect(screen).toContain("ЗАМЕТКА К ТРЕНИРОВКЕ");
    expect(screen).toContain("notes: noteDraft");
  });

  it("opens from a chart in editing mode and can undo the last draft change", () => {
    expect(screen).toContain('edit === "1"');
    expect(screen).toContain("undoLastChange");
    expect(screen).toContain("Отменить последнее изменение");
    expect(screen).toContain("takeUndoSnapshot");
  });
});
