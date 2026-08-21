import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

export const LOCAL_BACKUP_FORMAT = "ironrise.local-backup";
export const LOCAL_BACKUP_VERSION = 1;
export const LOCAL_BACKUP_MAX_BYTES = 80 * 1024 * 1024;
export const LOCAL_BACKUP_MAX_MEDIA_FILE_BYTES = 10 * 1024 * 1024;

export type LocalBackupPreview = {
  exportedAt: string;
  storageEntryCount: number;
  mediaFileCount: number;
};

export type LocalBackupPayload = LocalBackupPreview & {
  sourceDocumentDirectory: string;
  storageEntries: [string, string][];
  mediaFiles: Record<string, Uint8Array>;
};

type LocalBackupManifest = LocalBackupPreview & {
  format: typeof LOCAL_BACKUP_FORMAT;
  version: typeof LOCAL_BACKUP_VERSION;
  sourceDocumentDirectory: string;
  storageEntries: [string, string][];
  mediaPaths: string[];
};

function isSafeMediaPath(value: string) {
  return /^media\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp|heic)$/i.test(value);
}

function normalizeEntries(
  entries: readonly (readonly [string, string | null])[],
) {
  return entries
    .filter(([key, value]) => Boolean(key) && value !== null)
    .map(([key, value]) => [key, value ?? ""] as [string, string]);
}

export function buildLocalBackupArchive(input: {
  storageEntries: readonly (readonly [string, string | null])[];
  sourceDocumentDirectory: string;
  mediaFiles: Record<string, Uint8Array>;
  exportedAt?: string;
}) {
  const storageEntries = normalizeEntries(input.storageEntries);
  const mediaFiles: Record<string, Uint8Array> = {};
  for (const [path, bytes] of Object.entries(input.mediaFiles)) {
    if (
      isSafeMediaPath(path) &&
      bytes.byteLength > 0 &&
      bytes.byteLength <= LOCAL_BACKUP_MAX_MEDIA_FILE_BYTES
    )
      mediaFiles[path] = bytes;
  }
  const manifest: LocalBackupManifest = {
    format: LOCAL_BACKUP_FORMAT,
    version: LOCAL_BACKUP_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    sourceDocumentDirectory: input.sourceDocumentDirectory,
    storageEntries,
    storageEntryCount: storageEntries.length,
    mediaFileCount: Object.keys(mediaFiles).length,
    mediaPaths: Object.keys(mediaFiles),
  };
  const archive = zipSync(
    {
      "manifest.json": strToU8(JSON.stringify(manifest, null, 2)),
      ...mediaFiles,
    },
    { level: 6 },
  );
  if (archive.byteLength > LOCAL_BACKUP_MAX_BYTES)
    throw new Error("Резервная копия превышает лимит 80 МБ.");
  return archive;
}

export function unpackLocalBackupArchive(
  bytes: Uint8Array,
): LocalBackupPayload {
  if (!bytes.byteLength) throw new Error("Файл резервной копии пуст.");
  if (bytes.byteLength > LOCAL_BACKUP_MAX_BYTES)
    throw new Error("Файл резервной копии превышает лимит 80 МБ.");
  let archive: Record<string, Uint8Array>;
  try {
    archive = unzipSync(bytes);
  } catch {
    throw new Error("Не удалось открыть ZIP-файл резервной копии.");
  }
  const manifestBytes = archive["manifest.json"];
  if (!manifestBytes) throw new Error("В резервной копии нет manifest.json.");
  let manifest: LocalBackupManifest;
  try {
    manifest = JSON.parse(strFromU8(manifestBytes)) as LocalBackupManifest;
  } catch {
    throw new Error("Манифест резервной копии повреждён.");
  }
  if (
    manifest.format !== LOCAL_BACKUP_FORMAT ||
    manifest.version !== LOCAL_BACKUP_VERSION ||
    !Array.isArray(manifest.storageEntries) ||
    typeof manifest.sourceDocumentDirectory !== "string"
  )
    throw new Error("Этот файл не является резервной копией IronRise.");
  const storageEntries = manifest.storageEntries.filter(
    (entry): entry is [string, string] =>
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === "string" &&
      typeof entry[1] === "string",
  );
  const mediaFiles: Record<string, Uint8Array> = {};
  for (const path of manifest.mediaPaths ?? []) {
    const file = archive[path];
    if (
      isSafeMediaPath(path) &&
      file &&
      file.byteLength <= LOCAL_BACKUP_MAX_MEDIA_FILE_BYTES
    )
      mediaFiles[path] = file;
  }
  return {
    exportedAt: manifest.exportedAt,
    storageEntryCount: storageEntries.length,
    mediaFileCount: Object.keys(mediaFiles).length,
    sourceDocumentDirectory: manifest.sourceDocumentDirectory,
    storageEntries,
    mediaFiles,
  };
}
