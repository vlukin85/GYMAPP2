import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cardSource = readFileSync(resolve(process.cwd(), "components/workout-share-card.tsx"), "utf8");
// Подписи карточки живут в домене workout-services и приходят через lang.
const servicesDict = readFileSync(resolve(process.cwd(), "lib/i18n/domains/workout-services.ts"), "utf8");
const shareCard = cardSource + servicesDict;

describe("калории на карточке публикации", () => {
  it("показывает сохранённый расход калорий и оставляет честное состояние для старой истории", () => {
    expect(shareCard).toContain("workout.caloriesBurned === undefined ? \"—\"");
    expect(cardSource).toContain('tr("workoutServices.card.kcal")');
    expect(servicesDict).toContain("ККАЛ");
    expect(servicesDict).toContain("KCAL");
  });
});
