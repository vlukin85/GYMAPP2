import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const calendar = readFileSync(
  resolve(process.cwd(), "app/(tabs)/calendar.tsx"),
  "utf8",
);

describe("calendar completed mode", () => {
  it("renders the completed-program card and confirmation-backed result deletion", () => {
    expect(calendar).toContain("ВЫПОЛНЕННАЯ ПРОГРАММА");
    expect(calendar).toContain("Удалить выполненную тренировку?");
    expect(calendar).toContain(
      "deleteCompletedWorkout(selectedCompletedWorkout.id)",
    );
  });
});
