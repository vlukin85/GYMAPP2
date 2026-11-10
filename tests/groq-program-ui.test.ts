import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { programs } from "../lib/i18n/domains/programs";

const aiScreen = readFileSync(
  resolve(process.cwd(), "app/program/ai.tsx"),
  "utf8",
);
// Русские подписи экрана настроек живут в словаре домена settings,
// поэтому экран проверяется вместе со своим словарём локализации.
const settingsScreen =
  readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8") +
  readFileSync(
    resolve(process.cwd(), "lib/i18n/domains/settings.ts"),
    "utf8",
  );
const skeleton = readFileSync(
  resolve(process.cwd(), "components/groq-program-skeleton.tsx"),
  "utf8",
);

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
    // Подпись кнопки живёт в словаре домена programs: экран ссылается на ключ.
    expect(aiScreen).toContain('t("programs.ai.saveToMy")');
    expect(programs.ru["programs.ai.saveToMy"]).toBe(
      "Сохранить в «Мои программы»",
    );
    expect(programs.en["programs.ai.saveToMy"]).toBe(
      "Save to “My programs”",
    );
  });
});
