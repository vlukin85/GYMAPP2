import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Русские подписи живут в словаре домена workout, поэтому экран проверяется
// вместе со своим словарём локализации (как экран настроек с доменом settings).
const workoutDict = readFileSync(
  resolve(process.cwd(), "lib/i18n/domains/workout.ts"),
  "utf8",
);
// Подписи самой PNG-карточки переехали в домен workout-services: компонент
// получает язык пропсом lang, а русский текст лежит в словаре сервисов.
const servicesDict = readFileSync(
  resolve(process.cwd(), "lib/i18n/domains/workout-services.ts"),
  "utf8",
);

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8") + workoutDict;
const shareCard = readFileSync(resolve(process.cwd(), "components/workout-share-card.tsx"), "utf8") + servicesDict;

describe("пульс в публикации и целевая зона", () => {
  it("выводит средний пульс и ведущую зону на PNG-карточке", () => {
    expect(shareCard).toContain("workoutServices.card.heartRateEyebrow");
    expect(shareCard).toContain("workoutServices.card.dominantZone");
    expect(servicesDict).toContain("ПУЛЬС · HEALTH CONNECT");
    expect(servicesDict).toContain("ВЕДУЩАЯ ЗОНА");
    // Оба языка на месте: карточка показывает английский при lang="en".
    expect(servicesDict).toContain("HEART RATE · HEALTH CONNECT");
    expect(servicesDict).toContain("DOMINANT ZONE");
    expect(shareCard).toContain("workout.averageHeartRateBpm");
  });

  it("хранит выбранную зону и показывает визуальный статус при выходе из неё", () => {
    expect(workout).toContain("loadTargetHeartRateZone");
    expect(workout).toContain("saveTargetHeartRateZone");
    expect(workout).toContain("getHeartRateTargetStatus");
    expect(workout).toContain("ВЫШЕ ЦЕЛИ");
    expect(workout).toContain("НИЖЕ ЦЕЛИ");
  });
});
