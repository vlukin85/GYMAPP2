import { describe, expect, it } from "vitest";
import { getPreviousWorkingResult, getQuickWeightOptions, prefillWorkingSet } from "../lib/workout-set-entry";

describe("ускоренный ввод рабочих подходов", () => {
  it("подставляет последний завершённый рабочий подход в пустой следующий рабочий", () => {
    const sets = [
      { reps: "12", weight: "40", type: "warmup" },
      { reps: "8", weight: "80", type: "working" },
      { reps: "", weight: "", type: "working" },
    ];
    expect(prefillWorkingSet(sets, 2)[2]).toEqual({ reps: "8", weight: "80", type: "working" });
    expect(getPreviousWorkingResult(sets, 2)).toEqual({ reps: "8", weight: "80" });
  });

  it("не заменяет уже введённый или нерабочий подход", () => {
    const sets = [{ reps: "8", weight: "80", type: "working" }, { reps: "6", weight: "", type: "working" }];
    expect(prefillWorkingSet(sets, 1)).toBe(sets);
    expect(prefillWorkingSet([{ reps: "8", weight: "80", type: "working" }, { reps: "", weight: "", type: "warmup" }], 1)[1]).toEqual({ reps: "", weight: "", type: "warmup" });
  });

  it("предлагает быстрые значения вокруг текущего веса с заданным шагом", () => {
    expect(getQuickWeightOptions("80", "70", 2.5)).toEqual(["77.5", "80", "82.5"]);
    expect(getQuickWeightOptions("", "60", 5)).toEqual(["55", "60", "65"]);
  });
});
