import { describe, expect, it } from "vitest";
import { getHistoricalQuickWeightOptions, getPreviousWorkingResult, getQuickWeightOptions, prefillWorkingSet } from "../lib/workout-set-entry";

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

  it("подставляет плановые значения, когда у первого рабочего подхода ещё нет результата", () => {
    const sets = [{ reps: "", weight: "", type: "working" }];
    expect(prefillWorkingSet(sets, 0, { reps: "8", weight: "80" })[0]).toEqual({ reps: "8", weight: "80", type: "working" });
  });

  it("предлагает быстрые значения вокруг текущего веса с заданным шагом", () => {
    expect(getQuickWeightOptions("80", "70", 2.5)).toEqual(["77.5", "80", "82.5"]);
    expect(getQuickWeightOptions("", "60", 5)).toEqual(["55", "60", "65"]);
  });

  it("предпочитает веса прошлых тренировок плановому диапазону", () => {
    expect(getHistoricalQuickWeightOptions([{ weight: 85, reps: 8 }, { weight: 80, reps: 10 }, { weight: 85, reps: 6 }], "70", 2.5)).toEqual(["85", "80"]);
    expect(getHistoricalQuickWeightOptions([], "70", 2.5)).toEqual(["67.5", "70", "72.5"]);
  });
});
