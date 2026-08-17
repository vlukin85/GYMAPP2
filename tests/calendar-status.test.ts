import { describe, expect, it } from "vitest";
import { isScheduledWorkoutCompleted, shiftCalendarMonth, type CompletedWorkout } from "../lib/workout-data";

describe("calendar status", () => {
  const completed: CompletedWorkout[] = [{ id: "done-1", programId: "upper-strength", date: "2026-08-17T17:40:00.000Z", durationMinutes: 48, totalVolume: 4200 }];

  it("marks only a matching completed program on the scheduled date", () => {
    expect(isScheduledWorkoutCompleted(completed, "2026-08-17", "upper-strength")).toBe(true);
    expect(isScheduledWorkoutCompleted(completed, "2026-08-17", "leg-day")).toBe(false);
    expect(isScheduledWorkoutCompleted(completed, "2026-08-18", "upper-strength")).toBe(false);
  });

  it("moves calendar months without mutating the source cursor", () => {
    const cursor = new Date(2026, 7, 17);
    expect(shiftCalendarMonth(cursor, -1).toISOString().slice(0, 7)).toBe("2026-07");
    expect(shiftCalendarMonth(cursor, 1).toISOString().slice(0, 7)).toBe("2026-09");
    expect(cursor.getMonth()).toBe(7);
  });
});
