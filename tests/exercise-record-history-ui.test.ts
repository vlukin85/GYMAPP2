import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { catalog } from "../lib/i18n/domains/catalog";

const screen = readFileSync(
  resolve(process.cwd(), "app/exercise/[id].tsx"),
  "utf8",
);

describe("exercise personal-record history UI", () => {
  it("renders record improvements from the local completed-workout history", () => {
    expect(screen).toContain("getExercisePersonalRecordHistory");
    // Русские подписи живут в словаре домена catalog: экран ссылается на ключи,
    // а тест сверяет и ссылки в разметке, и сами тексты в словаре.
    expect(screen).toContain('t("catalog.detail.historyTitle")');
    expect(screen).toContain('t("catalog.detail.historyHint")');
    expect(screen).toContain('t("catalog.detail.historyEmpty")');
    expect(catalog.ru["catalog.detail.historyTitle"]).toBe("ИСТОРИЯ РЕКОРДОВ");
    expect(catalog.ru["catalog.detail.historyHint"]).toBe(
      "Только тренировки, в которых результат стал лучше",
    );
    expect(catalog.en["catalog.detail.historyTitle"]).toBe("RECORD HISTORY");
    expect(catalog.en["catalog.detail.historyHint"]).toBe(
      "Only workouts where the result improved",
    );
  });

  it("localizes the record card and the technique block through the dictionary", () => {
    expect(screen).toContain('t("catalog.detail.recordTitle")');
    expect(screen).toContain('t("catalog.detail.recordWeightReps"');
    expect(screen).toContain('t("catalog.detail.recordOneRm"');
    expect(screen).toContain('t("catalog.detail.techniqueTitle")');
    expect(screen).toContain('t("catalog.detail.watchVideo")');
    expect(catalog.ru["catalog.detail.recordWeightReps"]).toBe(
      "{weight} кг × {reps}",
    );
    expect(catalog.en["catalog.detail.recordWeightReps"]).toBe(
      "{weight} kg × {reps}",
    );
    // Даты форматируются по выбранному языку, а не жёстким ru-RU.
    expect(screen).not.toContain('toLocaleDateString("ru-RU"');
    expect(screen).toContain("toLocaleDateString(locale");
  });
});
