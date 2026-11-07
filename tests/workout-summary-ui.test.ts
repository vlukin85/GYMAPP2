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

  it("passes exact duration and measured rest into the completed workout record", () => {
    expect(workout).toContain("durationSeconds: workoutDurationSeconds");
    expect(workout).toContain("const totalRestSeconds = Math.max(");
    expect(workout).toContain("restSeconds: totalRestSeconds");
    expect(summary).toContain("completedWorkout?.durationSeconds");
    expect(summary).toContain('ВРЕМЯ · ММ:СС');
    expect(summary).toContain("energy.caloriesBurned");
  });

  it("uses a redesigned tile grid in the exercise catalog", () => {
    expect(catalog).not.toContain("cardAccent");
    expect(catalog).not.toContain("borderRadius: 0");
    expect(catalog).toContain("cardTitle");
    expect(catalog).toContain("useInterfaceDensity");
  });
});
