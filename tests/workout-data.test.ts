import { describe, expect, it } from "vitest";
import { bestOneRepMax, calculateBarbellPlateLayout, calculateVolume, estimateOneRepMax, exercises, formatDuration, formatPlateLayout, getEffectiveSetWeight, getLoadZones, getMonthCalendarDays, getReminderTriggerDate, recommendWorkingWeight, roundToWeightIncrement } from "../lib/workout-data";
import { buildTrainingCsv } from "../lib/training-export";
import { buildMonthlyReportData } from "../lib/monthly-report";
import { buildWorkoutComparison, groupImportedSessions, groupWorkoutSessions, parseTrainingCsv } from "../lib/csv-import";

describe("workout calculations", () => {
  it("calculates volume from weight, reps and sets", () => {
    expect(calculateVolume(40, 8, 3)).toBe(960);
  });
  it("formats duration in hours and minutes", () => {
    expect(formatDuration(67)).toBe("1 ч 7 мин");
  });
  it("estimates one-rep max with the Epley formula", () => {
    expect(estimateOneRepMax(80, 5)).toBeCloseTo(93.333, 2);
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });
  it("returns the best estimated one-rep max and handles empty work", () => {
    expect(bestOneRepMax([{ weight: 80, reps: 5 }, { weight: 85, reps: 3 }])).toBeCloseTo(93.5, 1);
    expect(bestOneRepMax([{ weight: 0, reps: 10 }])).toBe(0);
  });
  it("supports the Brzycki formula and calculates load zones", () => {
    expect(estimateOneRepMax(80, 5, "brzycki")).toBeCloseTo(90, 1);
    expect(getLoadZones(100)).toEqual([{ percent: 70, weight: 70 }, { percent: 80, weight: 80 }, { percent: 90, weight: 90 }]);
    expect(roundToWeightIncrement(73.6, 2.5)).toBe(72.5);
    expect(roundToWeightIncrement(73.6, 1.25)).toBe(73.75);
  });
  it("calculates a symmetric barbell plate layout", () => {
    const layout = calculateBarbellPlateLayout(100, { barWeightKg: 20, availablePlatesKg: [25, 20, 10, 5, 2.5] });
    expect(layout.loadedWeightKg).toBe(100);
    expect(layout.perSide).toEqual([25, 10, 5]);
    expect(formatPlateLayout(layout.perSide)).toBe("25 + 10 + 5");
  });
  it("builds an Excel-friendly CSV history export", () => {
    const csv = buildTrainingCsv([{ date: "2026-08-13", programId: "upper-strength", exerciseId: "bench-press", setNumber: 1, reps: 6, weightCentiKg: 8000, volumeCentiKg: 48000, oneRepMaxCentiKg: 9600 }]);
    expect(csv).toContain('"Упражнение"');
    expect(csv).toContain('"bench-press"');
    expect(csv).toContain('"80.00"');
  });
  it("recommends a progressive working weight when reps exceed the target", () => {
    const recommendation = recommendWorkingWeight({ history: [{ date: "2026-08-13", sets: [{ weight: 80, reps: 10 }], volume: 800 }], targetReps: 8, incrementKg: 2.5 });
    expect(recommendation.weightKg).toBe(82.5);
    expect(recommendation.changeKg).toBe(2.5);
  });
  it("summarizes the selected month for a PDF report", () => {
    const report = buildMonthlyReportData([{ date: "2026-08-13", programId: "upper", exerciseId: "bench", setNumber: 1, reps: 5, weightCentiKg: 8000, volumeCentiKg: 40000, oneRepMaxCentiKg: 9333 }], "2026-08");
    expect(report.trainingDays).toBe(1);
    expect(report.totalVolumeKg).toBe(400);
    expect(report.bestOneRmKg).toBe(93.33);
  });
  it("builds a Monday-first six-week calendar grid", () => {
    const days = getMonthCalendarDays(2026, 7);
    expect(days).toHaveLength(42);
    expect(days[0].toISOString().slice(0, 10)).toBe("2026-07-27");
    expect(days[41].toISOString().slice(0, 10)).toBe("2026-09-06");
  });
  it("calculates a reminder time before the scheduled workout", () => {
    expect(getReminderTriggerDate("2026-08-20", "18:30", 60).toISOString()).toContain("2026-08-20T17:30:00");
  });
  it("keeps 20 exercises and a unique image for every muscle group", () => {
    const groups = ["Грудь", "Спина", "Ноги", "Плечи", "Руки", "Корпус", "Кардио"] as const;
    groups.forEach((group) => expect(exercises.filter((exercise) => exercise.group === group)).toHaveLength(20));
    expect(new Set(exercises.map((exercise) => exercise.image)).size).toBe(exercises.length);
    expect(exercises.every((exercise) => exercise.image.startsWith("data:image/svg+xml"))).toBe(true);
  });
  it("accounts for a configured portion of bodyweight when there is no external load", () => {
    expect(getEffectiveSetWeight({ weightKg: 0, equipment: "Вес тела", bodyWeightKg: 80, bodyweightVolumePercent: 65 })).toBe(52);
    expect(getEffectiveSetWeight({ weightKg: 35, equipment: "Вес тела", bodyWeightKg: 80, bodyweightVolumePercent: 65 })).toBe(35);
  });
  it("parses app CSV exports with Russian headers, decimal commas and quoted cells", () => {
    const parsed = parseTrainingCsv("\uFEFF\"Дата\";\"Программа\";\"Упражнение\";\"Подход\";\"Повторы\";\"Вес_кг\"\n\"2026-08-10\";\"Верх тела\";\"bench-press\";\"1\";\"6\";\"80,5\"");
    expect(parsed.errors).toEqual([]);
    expect(parsed.delimiter).toBe(";");
    expect(parsed.rows[0]).toMatchObject({ date: "2026-08-10", exerciseId: "bench-press", reps: 6, weightKg: 80.5, setNumber: 1 });
    expect(groupImportedSessions(parsed.rows)).toMatchObject([{ programName: "Верх тела", totalVolumeKg: 483 }]);
  });
  it("reports invalid CSV rows without accepting them", () => {
    const parsed = parseTrainingCsv("date,exercise,reps,weight\n2026-08-10,Жим штанги лёжа,0,80\n2026-08-11,Неизвестное,6,80\n");
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.errors).toHaveLength(2);
    expect(parsed.errors.map((error) => error.line)).toEqual([2, 3]);
  });
  it("groups server sets by session and compares volume and 1RM per exercise", () => {
    const sessions = groupWorkoutSessions([
      { sessionId: 1, date: "2026-08-01", programId: "upper", durationMinutes: 50, exerciseId: "bench-press", reps: 5, weightCentiKg: 8000, volumeCentiKg: 40000, oneRepMaxCentiKg: 9333 },
      { sessionId: 1, date: "2026-08-01", programId: "upper", durationMinutes: 50, exerciseId: "barbell-row", reps: 6, weightCentiKg: 6000, volumeCentiKg: 36000, oneRepMaxCentiKg: 7200 },
      { sessionId: 2, date: "2026-08-08", programId: "upper", durationMinutes: 55, exerciseId: "bench-press", reps: 5, weightCentiKg: 8500, volumeCentiKg: 42500, oneRepMaxCentiKg: 9917 },
      { sessionId: 2, date: "2026-08-08", programId: "upper", durationMinutes: 55, exerciseId: "shoulder-press", reps: 8, weightCentiKg: 2200, volumeCentiKg: 17600, oneRepMaxCentiKg: 2787 },
    ]);
    const comparison = buildWorkoutComparison(sessions.find((session) => session.id === "1")!, sessions.find((session) => session.id === "2")!);
    expect(comparison.volumeDeltaKg).toBeCloseTo(-159);
    expect(comparison.durationDeltaMinutes).toBe(5);
    expect(comparison.exerciseDeltas.find((exercise) => exercise.exerciseId === "bench-press")?.deltaKg).toBeCloseTo(5.84);
    expect(comparison.exerciseDeltas.find((exercise) => exercise.exerciseId === "barbell-row")?.deltaKg).toBeNull();
  });
});
