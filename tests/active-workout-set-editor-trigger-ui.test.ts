import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");

describe("открытие формы фактического подхода", () => {
  it("открывает форму только после явного действия завершения подхода", () => {
    const finishSetBlock = workout.slice(
      workout.indexOf("const openFinishSetEditor"),
      workout.indexOf("const closeSetEditor"),
    );
    expect(finishSetBlock).toContain("openSetEditor(setIndex)");
    expect(workout).toContain("onPress={() => openFinishSetEditor(index)}");
  });

  it("не открывает форму при касании обычных полей и полей дроп-сета", () => {
    const setInputs = workout.slice(
      workout.indexOf("Фактические подходы"),
      workout.indexOf("ПОДХОД ВЫПОЛНЯЕТСЯ"),
    );
    expect(setInputs).not.toContain("onFocus");
    expect(setInputs).not.toContain("openSetEditor(index, subsetIndex)");
    expect(setInputs).toContain("updateDropSubset");
  });
});
