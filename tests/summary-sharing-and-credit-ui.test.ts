import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const summary = readFileSync(resolve(process.cwd(), "app/workout-summary.tsx"), "utf8");
const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const home = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

describe("workout result sharing and home credit", () => {
  it("preserves the completed-workout id and exposes text and PNG sharing", () => {
    expect(workout).toContain("workoutId: result.workoutId");
    expect(summary).toContain("ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ");
    expect(summary).toContain("ПОДЕЛИТЬСЯ КАРТОЧКОЙ PNG");
    expect(summary).toContain("ПОДЕЛИТЬСЯ ТЕКСТОМ");
    expect(summary).toContain("Sharing.shareAsync");
  });

  it("shows the requested author and rights credit below IronRise", () => {
    expect(home).toContain("by Vasily Lukin");
    expect(home).toContain("© All rights reserved");
    expect(home).toContain("brandCredit");
  });
});
