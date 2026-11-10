import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildMonthlyReportHtml } from "../lib/monthly-report";
import type { ExportSetRow } from "../lib/training-export";

// Тексты PDF-отчёта живут в домене workout-services: модуль принимает язык
// параметром lang, а по умолчанию отдаёт прежний русский отчёт.
const servicesDict = readFileSync(
  resolve(process.cwd(), "lib/i18n/domains/workout-services.ts"),
  "utf8",
);
const reportScreen = readFileSync(
  resolve(process.cwd(), "app/report.tsx"),
  "utf8",
);

const rows: ExportSetRow[] = [
  { date: "2026-08-18T10:00:00.000Z", programId: "upper-strength", exerciseId: "bench-press", setNumber: 1, reps: 5, weightCentiKg: 9000, volumeCentiKg: 45000, oneRepMaxCentiKg: 10500 },
];

describe("месячный отчёт RU/EN", () => {
  it("остаётся русским без параметра языка — прежние вызовы не ломаются", () => {
    const html = buildMonthlyReportHtml(rows, "2026-08");
    expect(html).toContain('lang="ru"');
    expect(html).toContain("ДНЕВНИК ТРЕНИРОВОК");
    expect(html).toContain("Итоги за 2026-08");
    expect(html).toContain("Тренировок");
    expect(html).toContain("Общий объём");
    expect(html).toContain("Лучший 1RM");
    expect(html).toContain("Упражнений");
    expect(html).toContain("Подходы за месяц");
    expect(html).toContain("Вес × повторы");
    expect(html).toContain("105.0 кг");
  });

  it("переводится при lang=\"en\" и не оставляет кириллицы", () => {
    const html = buildMonthlyReportHtml(rows, "2026-08", "en");
    expect(html).toContain('lang="en"');
    expect(html).toContain("WORKOUT JOURNAL");
    expect(html).toContain("Results for 2026-08");
    expect(html).toContain("Workouts");
    expect(html).toContain("Total volume");
    expect(html).toContain("Best 1RM");
    expect(html).toContain("Exercises");
    expect(html).toContain("Sets for the month");
    expect(html).toContain("Weight × reps");
    expect(html).toContain("105.0 kg");
    expect(/[А-Яа-яЁё]/.test(html)).toBe(false);
  });

  it("держит пустое состояние на языке отчёта", () => {
    expect(buildMonthlyReportHtml([], "2026-08")).toContain("Нет сохранённых подходов за этот месяц.");
    expect(buildMonthlyReportHtml([], "2026-08", "en")).toContain("No saved sets for this month.");
  });

  it("берёт язык из экрана отчёта", () => {
    expect(reportScreen).toContain("const { t, lang } = useLanguage()");
    expect(reportScreen).toContain("buildMonthlyReportHtml(rows, month, lang)");
    // Русские подписи не остались в модуле: они в словаре сервисов.
    expect(servicesDict).toContain('"workoutServices.report.tag": "ДНЕВНИК ТРЕНИРОВОК"');
    expect(servicesDict).toContain('"workoutServices.report.tag": "WORKOUT JOURNAL"');
  });
});
