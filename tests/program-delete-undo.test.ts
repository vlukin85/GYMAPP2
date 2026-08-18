import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const programsScreen = readFileSync("/home/ubuntu/gym-training-diary/app/(tabs)/programs.tsx", "utf8");

describe("program delete undo", () => {
  it("stages deletion before it becomes irreversible and exposes an undo action", () => {
    expect(programsScreen).toContain("PROGRAM_DELETE_UNDO_MS");
    expect(programsScreen).toContain("stageProgramDeletion");
    expect(programsScreen).toContain("undoProgramDeletion");
    expect(programsScreen).toContain("Отменить");
  });

  it("clears the pending deletion timer when the program screen unmounts", () => {
    expect(programsScreen).toContain("clearDeletionTimer");
    expect(programsScreen).toContain("deleteProgramRef.current");
  });
});
