import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const settings = readFileSync(
  resolve(process.cwd(), "app/settings.tsx"),
  "utf8",
);

describe("локальная резервная копия в настройках", () => {
  it("показывает создание переносимой ZIP-копии и импорт после переустановки", () => {
    expect(settings).toContain("Резервная копия");
    expect(settings).toContain("СОЗДАТЬ КОПИЮ");
    expect(settings).toContain("ВОССТАНОВИТЬ ИЗ ФАЙЛА");
    expect(settings).toContain("createAndShareLocalBackup");
    expect(settings).toContain("pickLocalBackup");
  });

  it("требует подтверждения перед заменой текущих локальных данных", () => {
    expect(settings).toContain("Восстановить эту копию?");
    expect(settings).toContain("Текущие локальные данные будут заменены.");
    expect(settings).toContain("restoreLocalBackup");
  });
});
