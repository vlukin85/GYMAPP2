import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync("/home/ubuntu/gym-training-diary/app/program/new.tsx", "utf8");

describe("program builder selected exercises", () => {
  it("pins selected exercises above the catalog and removes their duplicates from catalog results", () => {
    expect(screen).toContain("В ПРОГРАММЕ · {selectedExercises.length}");
    expect(screen).toContain("!selectedIds.has(exercise.id)");
    expect(screen).toContain("Добавить из каталога");
    expect(screen).toContain("current.filter((id) => id !== exercise.id)");
  });
});
