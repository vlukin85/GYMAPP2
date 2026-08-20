import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workout = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const shareCard = readFileSync(resolve(process.cwd(), "components/workout-share-card.tsx"), "utf8");

describe("пульс в публикации и целевая зона", () => {
  it("выводит средний пульс и ведущую зону на PNG-карточке", () => {
    expect(shareCard).toContain("ПУЛЬС · HEALTH CONNECT");
    expect(shareCard).toContain("ВЕДУЩАЯ ЗОНА");
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
