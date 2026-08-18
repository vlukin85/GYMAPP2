import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const aiScreen = readFileSync("/home/ubuntu/gym-training-diary/app/program/ai.tsx", "utf8");
const settingsScreen = readFileSync("/home/ubuntu/gym-training-diary/app/settings.tsx", "utf8");
const skeleton = readFileSync("/home/ubuntu/gym-training-diary/components/groq-program-skeleton.tsx", "utf8");

describe("Groq program UX", () => {
  it("offers Groq key update and deletion from settings", () => {
    expect(settingsScreen).toContain("Обновить ключ");
    expect(settingsScreen).toContain("deleteGroqKey");
  });

  it("shows an animated skeleton while Groq creates a draft", () => {
    expect(aiScreen).toContain("GroqProgramSkeleton");
    expect(skeleton).toContain("Animated.loop");
  });

  it("names the save action as adding the draft to My Programs", () => {
    expect(aiScreen).toContain("Сохранить в «Мои программы»");
  });
});
