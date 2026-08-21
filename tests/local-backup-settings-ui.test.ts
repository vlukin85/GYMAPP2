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
    expect(settings).toContain("Последняя успешная копия:");
    expect(settings).toContain("Резервная копия ещё не создавалась.");
    expect(settings).toContain("системным уведомлением");
    expect(settings).toContain("Напоминать о копии");
    expect(settings).toContain("Раз в неделю");
    expect(settings).toContain("Раз в месяц");
  });

  it("требует подтверждения перед заменой текущих локальных данных", () => {
    expect(settings).toContain("Восстановить эту копию?");
    expect(settings).toContain("Текущие локальные данные будут заменены.");
    expect(settings).toContain("restoreLocalBackup");
  });
});
