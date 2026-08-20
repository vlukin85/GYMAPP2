import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const shareCard = readFileSync(resolve(process.cwd(), "components/workout-share-card.tsx"), "utf8");

describe("калории на карточке публикации", () => {
  it("показывает сохранённый расход калорий и оставляет честное состояние для старой истории", () => {
    expect(shareCard).toContain("workout.caloriesBurned === undefined ? \"—\"");
    expect(shareCard).toContain(">ККАЛ</Text>");
  });
});
