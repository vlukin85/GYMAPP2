import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const reminder = readFileSync(
  resolve(process.cwd(), "lib/local-backup-reminder.ts"),
  "utf8",
);

describe("ежемесячное напоминание о резервной копии", () => {
  it("планирует повторяющееся системное уведомление в безопасный день месяца", () => {
    expect(reminder).toContain("SchedulableTriggerInputTypes.MONTHLY");
    expect(reminder).toContain("day: Math.min(created.getDate(), 28)");
    expect(reminder).toContain("hour: 10");
    expect(reminder).toContain("minute: 0");
    expect(reminder).toContain("repeats: true");
    expect(reminder).toContain(
      'const BACKUP_REMINDER_CHANNEL = "local-backup"',
    );
  });

  it("сохраняет запись о последнем успешном создании копии", () => {
    expect(reminder).toContain(
      'const BACKUP_RECORD_KEY = "ironrise.local-backup.record.v1"',
    );
    expect(reminder).toContain("recordSuccessfulLocalBackup");
    expect(reminder).toContain("saveLocalBackupRecord(record)");
  });
});
