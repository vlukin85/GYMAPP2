export type ExportSetRow = {
  date: Date | string;
  programId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightCentiKg: number;
  volumeCentiKg: number;
  oneRepMaxCentiKg: number;
};

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function buildTrainingCsv(rows: ExportSetRow[]) {
  const header = ["Дата", "Программа", "Упражнение", "Подход", "Повторы", "Вес_кг", "Объём_кг", "1RM_кг"];
  const lines = rows.map((row) => [new Date(row.date).toISOString().slice(0, 10), row.programId, row.exerciseId, row.setNumber, row.reps, (row.weightCentiKg / 100).toFixed(2), (row.volumeCentiKg / 100).toFixed(2), (row.oneRepMaxCentiKg / 100).toFixed(2)].map(escapeCsv).join(","));
  return `\uFEFF${header.map(escapeCsv).join(",")}\n${lines.join("\n")}`;
}
