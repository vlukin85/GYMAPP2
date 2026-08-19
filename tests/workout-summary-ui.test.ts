import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const summary = readFileSync(resolve(process.cwd(), "app/workout-summary.tsx"), "utf8");
const catalog = readFileSync(resolve(process.cwd(), "app/(tabs)/exercises.tsx"), "utf8");

describe("editorial workout completion interface", () => {
  it("routes completed workouts to a dedicated summary page", () => {
    expect(workout).toContain('pathname: "/workout-summary" as never');
    expect(summary).toContain("ТРЕНИРОВКА{`\\n`}ЗАВЕРШЕНА");
    expect(summary).toContain("ЛИЧНЫЕ РЕКОРДЫ");
  });

  it("uses a strict editorial grid in the exercise catalog", () => {
    expect(catalog).toContain("cardAccent");
    expect(catalog).toContain("borderRadius: 0");
    expect(catalog).toContain("useInterfaceDensity");
  });
});
