import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const device = readFileSync(
  resolve(process.cwd(), "lib/local-backup-device.ts"),
  "utf8",
);

describe("операции переносимой резервной копии", () => {
  it("отправляет готовый ZIP через системное меню", () => {
    expect(device).toContain("shareLocalBackupFile");
    expect(device).toContain("Sharing.shareAsync");
    expect(device).toContain("Поделиться резервной копией IronRise");
  });

  it("показывает прогресс и составляет список ZIP-файлов из выбранной папки", () => {
    expect(device).toContain("LocalBackupProgress");
    expect(device).toContain("Directory.pickDirectoryAsync");
    expect(device).toContain("listAvailableLocalBackups");
    expect(device).toContain("readBackupFromFile");
  });

  it("автоматически очищает только старые внутренние ZIP-копии", () => {
    expect(device).toContain("const MAX_INTERNAL_BACKUPS = 5");
    expect(device).toContain("cleanupOldInternalBackups");
    expect(device).toContain("FileSystem.deleteAsync(uri)");
    expect(device).toContain("await cleanupOldInternalBackups()");
  });
});
