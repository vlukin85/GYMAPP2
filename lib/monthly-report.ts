import type { ExportSetRow } from "./training-export";
import { DEFAULT_LANG, translate } from "./i18n";
import type { Lang } from "./i18n";

export function getMonthKey(date: Date | string) { return new Date(date).toISOString().slice(0, 7); }

export function buildMonthlyReportData(rows: ExportSetRow[], month: string) {
  const monthRows = rows.filter((row) => getMonthKey(row.date) === month);
  const trainingDays = new Set(monthRows.map((row) => new Date(row.date).toISOString().slice(0, 10)));
  const totalVolumeKg = monthRows.reduce((sum, row) => sum + row.volumeCentiKg / 100, 0);
  const bestOneRmKg = Math.max(0, ...monthRows.map((row) => row.oneRepMaxCentiKg / 100));
  const exercises = new Set(monthRows.map((row) => row.exerciseId));
  return { month, rows: monthRows, trainingDays: trainingDays.size, totalVolumeKg, bestOneRmKg, exerciseCount: exercises.size };
}

/**
 * HTML месячного отчёта (он же PDF через печать).
 * Язык — необязательный параметр с дефолтом "ru": вызов без него даёт прежний
 * русский отчёт, поэтому экран отчёта можно переводить постепенно.
 */
export function buildMonthlyReportHtml(rows: ExportSetRow[], month: string, lang: Lang = DEFAULT_LANG) {
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const report = buildMonthlyReportData(rows, month);
  const details = report.rows.map((row) => `<tr><td>${new Date(row.date).toLocaleDateString(locale)}</td><td>${row.exerciseId}</td><td>${row.setNumber}</td><td>${row.weightCentiKg / 100} × ${row.reps}</td><td>${translate(lang, "workoutServices.report.weightKg", { value: (row.oneRepMaxCentiKg / 100).toFixed(1) })}</td></tr>`).join("");
  const tons = translate(lang, "workoutServices.report.volumeTons", { value: (report.totalVolumeKg / 1000).toFixed(1) });
  const bestOneRm = translate(lang, "workoutServices.report.weightKg", { value: report.bestOneRmKg.toFixed(1) });
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"/><style>@page{margin:24px}body{font-family:Arial,sans-serif;color:#17221c}h1{font-size:25px;margin:0}h2{font-size:15px;margin:26px 0 8px}.tag{color:#177e62;font-weight:700;font-size:11px;letter-spacing:1px}.cards{display:flex;gap:10px;margin-top:18px}.card{flex:1;border:1px solid #dce6de;border-radius:10px;padding:12px}.value{font-size:21px;font-weight:700;margin-top:4px}.label{font-size:10px;color:#607168;text-transform:uppercase}table{border-collapse:collapse;width:100%;font-size:10px}th,td{padding:8px;border-bottom:1px solid #e5ece6;text-align:left}th{color:#607168;font-size:9px;text-transform:uppercase}</style></head><body><div class="tag">${translate(lang, "workoutServices.report.tag")}</div><h1>${translate(lang, "workoutServices.report.title", { month })}</h1><div class="cards"><div class="card"><div class="label">${translate(lang, "workoutServices.report.trainingDays")}</div><div class="value">${report.trainingDays}</div></div><div class="card"><div class="label">${translate(lang, "workoutServices.report.totalVolume")}</div><div class="value">${tons}</div></div><div class="card"><div class="label">${translate(lang, "workoutServices.report.bestOneRm")}</div><div class="value">${bestOneRm}</div></div><div class="card"><div class="label">${translate(lang, "workoutServices.report.exerciseCount")}</div><div class="value">${report.exerciseCount}</div></div></div><h2>${translate(lang, "workoutServices.report.setsTitle")}</h2><table><thead><tr><th>${translate(lang, "workoutServices.report.colDate")}</th><th>${translate(lang, "workoutServices.report.colExercise")}</th><th>${translate(lang, "workoutServices.report.colSet")}</th><th>${translate(lang, "workoutServices.report.colWeightReps")}</th><th>1RM</th></tr></thead><tbody>${details || `<tr><td colspan='5'>${translate(lang, "workoutServices.report.empty")}</td></tr>`}</tbody></table></body></html>`;
}
