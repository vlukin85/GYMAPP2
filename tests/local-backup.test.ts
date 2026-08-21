import { describe, expect, it } from "vitest";
import {
  LOCAL_BACKUP_FORMAT,
  buildLocalBackupArchive,
  unpackLocalBackupArchive,
} from "../lib/local-backup";

describe("переносимая резервная копия IronRise", () => {
  it("упаковывает локальные данные и пользовательские медиафайлы в ZIP", () => {
    const archive = buildLocalBackupArchive({
      storageEntries: [
        ["gym-diary-state-v1", '{"programs":[]}'],
        ["ironrise.active-workout-draft.v1", null],
      ],
      sourceDocumentDirectory: "file:///old-install/",
      mediaFiles: {
        "media/exercise-bench-1.jpg": new Uint8Array([1, 2, 3]),
      },
      exportedAt: "2026-08-21T00:00:00.000Z",
    });
    const backup = unpackLocalBackupArchive(archive);
    expect(LOCAL_BACKUP_FORMAT).toBe("ironrise.local-backup");
    expect(backup.exportedAt).toBe("2026-08-21T00:00:00.000Z");
    expect(backup.storageEntries).toEqual([
      ["gym-diary-state-v1", '{"programs":[]}'],
    ]);
    expect(backup.mediaFileCount).toBe(1);
    expect(backup.mediaFiles["media/exercise-bench-1.jpg"]).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });

  it("не принимает повреждённый файл или файл другого назначения", () => {
    expect(() => unpackLocalBackupArchive(new Uint8Array([0, 1, 2]))).toThrow(
      /ZIP-файл/,
    );
  });
});
