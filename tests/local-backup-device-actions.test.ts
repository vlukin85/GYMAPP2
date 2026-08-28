import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const device = readFileSync(
  resolve(process.cwd(), "lib/local-backup-device.ts"),
  "utf8",
);

describe("операции переносимой резервной копии", () => {
  it("оставляет ручную передачу ZIP отдельной от прямого сохранения", () => {
    expect(device).toContain("export async function createLocalBackup(");
    expect(device).toContain('file.write(archive)');
    expect(device).toContain("export async function createAndShareLocalBackup(");
    expect(device).toContain("await shareLocalBackupFile(backup)");
  });

  it("показывает только три самые новые ZIP-копии из выбранной папки", () => {
    expect(device).toContain("LocalBackupProgress");
    expect(device).toContain("Directory.pickDirectoryAsync");
    expect(device).toContain("listAvailableLocalBackups");
    expect(device).toContain("readBackupFromFile");
    expect(device).toContain("const MAX_VISIBLE_BACKUPS = 3");
    expect(device).toContain(".slice(0, MAX_VISIBLE_BACKUPS)");
  });

  it("имеет отдельную очистку старых внутренних ZIP-копий", () => {
    expect(device).toContain("const MAX_INTERNAL_BACKUPS = 5");
    expect(device).toContain("cleanupOldInternalBackups");
    expect(device).toContain("FileSystem.deleteAsync(uri)");
    expect(device).not.toContain("const deletedOldBackups = await cleanupOldInternalBackups()");
  });

  it("не вызывает нативный файловый каталог при открытии настроек в Expo web", () => {
    expect(device).toContain('if (Platform.OS === "web") return [];');
    expect(device).toMatch(
      /export async function listAvailableLocalBackups\(\) \{[\s\S]*?if \(Platform\.OS === "web"\) return \[\];[\s\S]*?listAppBackups\(\)/,
    );
  });
});
