import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Русские подписи живут в словаре домена workout, поэтому экран проверяется
// вместе со своим словарём локализации (как экран настроек с доменом settings).
const workoutDict = readFileSync(
  resolve(process.cwd(), "lib/i18n/domains/workout.ts"),
  "utf8",
);

const studio = readFileSync(
  resolve(process.cwd(), "app/share-workout.tsx"),
  "utf8",
) + workoutDict;
const card = readFileSync(
  resolve(process.cwd(), "components/workout-share-card.tsx"),
  "utf8",
);

describe("workout sharing studio", () => {
  it("allows a user to select a photo and embeds it into the share card", () => {
    expect(studio).toContain("launchImageLibraryAsync");
    expect(studio).toContain("Добавить фото");
    expect(card).toContain("photoUri");
    expect(card).toContain("sharePhoto");
  });

  it("requires an explicit in-app confirmation before publishing to VK", () => {
    expect(studio).toContain("Опубликовать во ВКонтакте?");
    expect(studio).toContain("publishWorkoutToVk");
    expect(studio).toContain("Войти через VK ID");
  });
});
