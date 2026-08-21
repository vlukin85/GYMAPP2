import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");

describe("редактирование завершённого подхода", () => {
  it("не даёт открыть форму или изменить поля завершённого подхода без явной команды", () => {
    expect(workout).toContain("const isSetCompleted");
    expect(workout).toContain("editable={!isSetCompleted(index)}");
    expect(workout).toContain(
      "if (!isSetCompleted(index)) openSetEditor(index);",
    );
    expect(workout).toContain("disabled={isSetCompleted(index)}");
    expect(workout).toContain("styles.completedSetField");
  });

  it("сохраняет отдельную явную кнопку для изменения зафиксированного подхода", () => {
    expect(workout).toContain("ПОДХОД ЗАФИКСИРОВАН");
    expect(workout).toContain("ИЗМЕНИТЬ");
    expect(workout).toContain("onPress={() => openSetEditor(index)}");
  });
});
