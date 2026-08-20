import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const studio = readFileSync("/home/ubuntu/gym-training-diary/app/share-workout.tsx", "utf8");
const card = readFileSync("/home/ubuntu/gym-training-diary/components/workout-share-card.tsx", "utf8");

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
