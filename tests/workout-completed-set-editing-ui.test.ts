import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");

describe("редактирование завершённого подхода", () => {
  it("не даёт открыть форму или изменить поля завершённого подхода без явной команды", () => {
    expect(workout).toContain("const isSetCompleted");
    expect(workout).toContain("editable={!isSetCompleted(index)}");
    expect(workout).not.toContain("onFocus={() => {");
    expect(workout).toContain("disabled={isSetCompleted(index)}");
    expect(workout).toContain("styles.completedSetField");
  });

  it("запрашивает подтверждение перед включением режима изменения", () => {
    expect(workout).toContain("ТОЛЬКО ПРОСМОТР");
    expect(workout).toContain("ИЗМЕНИТЬ");
    expect(workout).toContain("requestCompletedSetEditing(index)");
    expect(workout).toContain("Изменить завершённый подход?");
    expect(workout).toMatch(/Время подхода и отдых останутся\s+сохранёнными/);
    expect(workout).toContain("editableCompletedSetKeys");
  });

  it("после подтверждения возвращает редактируемость всем полям дроп-сета", () => {
    expect(workout).toContain("РЕЖИМ ИЗМЕНЕНИЯ");
    expect(workout).toContain("finishCompletedSetEditing(index)");
    expect(workout).toContain("dropSubsets");
    expect(workout).toContain("editable={!isSetCompleted(index)}");
    expect(workout).toContain("disabled={isSetCompleted(index)}");
    expect(workout).toMatch(
      /const isSetCompleted[\s\S]*?!editableCompletedSetKeys\.includes/,
    );
  });
});
