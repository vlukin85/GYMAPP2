import AsyncStorage from "@react-native-async-storage/async-storage";
import { fromByteArray, toByteArray } from "base64-js";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import {
  buildLocalBackupArchive,
  type LocalBackupPayload,
  type LocalBackupPreview,
  unpackLocalBackupArchive,
} from "./local-backup";

const MEDIA_DIRECTORY_NAME = "gym-diary-media";
const BACKUP_DIRECTORY_NAME = "ironrise-backups";
const BACKUP_DIRECTORY_URI_KEY = "ironrise.local-backup.directory-uri.v1";
const MAX_INTERNAL_BACKUPS = 5;

export type LocalBackupProgress = {
  value: number;
  label: string;
};

export type LocalBackupFile = LocalBackupPreview & {
  uri: string;
  fileName: string;
  deletedOldBackups?: number;
};

export type AvailableLocalBackup = LocalBackupFile & {
  source: "app" | "folder";
  sizeBytes: number;
  modifiedAt: number | null;
  payload: LocalBackupPayload;
};

function mediaDirectoryUri() {
  return `${FileSystem.documentDirectory}${MEDIA_DIRECTORY_NAME}/`;
}

function backupDirectoryUri() {
  return `${FileSystem.documentDirectory}${BACKUP_DIRECTORY_NAME}/`;
}

function fileNameFromUri(uri: string) {
  const encoded = uri.split("/").pop() ?? "ironrise-backup.zip";
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function makeBackupFileName(exportedAt = new Date()) {
  const stamp = exportedAt.toISOString().replace(/[:.]/g, "-");
  return `ironrise-backup-${stamp}.zip`;
}

async function readMediaDirectory(
  directoryUri: string,
  relativeDirectory = "media/",
  onProgress?: (progress: LocalBackupProgress) => void,
): Promise<Record<string, Uint8Array>> {
  const info = await FileSystem.getInfoAsync(directoryUri);
  if (!info.exists) return {};
  const files: Record<string, Uint8Array> = {};
  const names = await FileSystem.readDirectoryAsync(directoryUri);
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const uri = `${directoryUri}${name}`;
    const item = await FileSystem.getInfoAsync(uri);
    if (item.isDirectory) {
      Object.assign(
        files,
        await readMediaDirectory(`${uri}/`, `${relativeDirectory}${name}/`),
      );
      continue;
    }
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    files[`${relativeDirectory}${name}`] = toByteArray(base64);
    onProgress?.({
      value: Math.min(44, 18 + ((index + 1) / Math.max(names.length, 1)) * 26),
      label: "Собираем фотографии и файлы…",
    });
  }
  return files;
}

async function ensureAppBackupDirectory() {
  const uri = backupDirectoryUri();
  await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  return uri;
}

export async function cleanupOldInternalBackups(keep = MAX_INTERNAL_BACKUPS) {
  const directoryUri = await ensureAppBackupDirectory();
  const files = await Promise.all(
    (await FileSystem.readDirectoryAsync(directoryUri))
      .filter((name) => name.toLowerCase().endsWith(".zip"))
      .map(async (name) => {
        const uri = `${directoryUri}${name}`;
        const info = await FileSystem.getInfoAsync(uri);
        return {
          uri,
          modifiedAt:
            info.exists && "modificationTime" in info
              ? (info.modificationTime ?? 0)
              : 0,
        };
      }),
  );
  const stale = files
    .sort((first, second) => second.modifiedAt - first.modifiedAt)
    .slice(Math.max(1, keep));
  await Promise.all(stale.map(({ uri }) => FileSystem.deleteAsync(uri)));
  return stale.length;
}

async function readBackupFromFile(
  file: File,
  source: AvailableLocalBackup["source"],
): Promise<AvailableLocalBackup> {
  const payload = unpackLocalBackupArchive(await file.bytes());
  return {
    ...payload,
    uri: file.uri,
    fileName: fileNameFromUri(file.uri),
    source,
    sizeBytes: file.size,
    modifiedAt: file.modificationTime,
    payload,
  };
}

async function listDirectoryBackups(
  directory: Directory,
  source: AvailableLocalBackup["source"],
) {
  try {
    return (
      await Promise.all(
        directory
          .list()
          .filter(
            (entry): entry is File =>
              entry instanceof File && entry.uri.toLowerCase().endsWith(".zip"),
          )
          .map((file) => readBackupFromFile(file, source).catch(() => null)),
      )
    ).filter((item): item is AvailableLocalBackup => item !== null);
  } catch {
    return [];
  }
}

async function listAppBackups() {
  const directoryUri = await ensureAppBackupDirectory();
  const names = await FileSystem.readDirectoryAsync(directoryUri);
  return Promise.all(
    names
      .filter((name) => name.toLowerCase().endsWith(".zip"))
      .map((name) =>
        readBackupFromFile(new File(`${directoryUri}${name}`), "app"),
      )
      .map(async (backup) => backup.catch(() => null)),
  ).then((items) =>
    items.filter((item): item is AvailableLocalBackup => item !== null),
  );
}

export async function listAvailableLocalBackups() {
  const [appBackups, selectedDirectoryUri] = await Promise.all([
    listAppBackups(),
    AsyncStorage.getItem(BACKUP_DIRECTORY_URI_KEY),
  ]);
  const folderBackups = selectedDirectoryUri
    ? await listDirectoryBackups(new Directory(selectedDirectoryUri), "folder")
    : [];
  return [...appBackups, ...folderBackups]
    .filter(
      (backup, index, all) =>
        all.findIndex((item) => item.uri === backup.uri) === index,
    )
    .sort(
      (first, second) =>
        new Date(second.exportedAt).getTime() -
        new Date(first.exportedAt).getTime(),
    );
}

export async function chooseLocalBackupFolder() {
  if (Platform.OS === "web") return listAvailableLocalBackups();
  const directory = await Directory.pickDirectoryAsync();
  await AsyncStorage.setItem(BACKUP_DIRECTORY_URI_KEY, directory.uri);
  return listAvailableLocalBackups();
}

export async function shareLocalBackupFile(backup: LocalBackupFile) {
  if (Platform.OS === "web") {
    const base64 = await FileSystem.readAsStringAsync(backup.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = toByteArray(base64);
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([buffer], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backup.fileName;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Стандартное меню «Поделиться» недоступно на устройстве.");
  await Sharing.shareAsync(backup.uri, {
    dialogTitle: "Поделиться резервной копией IronRise",
    mimeType: "application/zip",
    UTI: "public.zip-archive",
  });
}

export async function createAndShareLocalBackup(
  onProgress?: (progress: LocalBackupProgress) => void,
): Promise<LocalBackupFile> {
  onProgress?.({ value: 8, label: "Собираем данные тренировок…" });
  const keys = await AsyncStorage.getAllKeys();
  const [entries, mediaFiles] = await Promise.all([
    keys.length ? AsyncStorage.multiGet(keys) : [],
    readMediaDirectory(mediaDirectoryUri(), "media/", onProgress),
  ]);
  onProgress?.({ value: 58, label: "Упаковываем ZIP-копию…" });
  const exportedAt = new Date();
  const archive = buildLocalBackupArchive({
    storageEntries: entries,
    sourceDocumentDirectory: FileSystem.documentDirectory ?? "",
    mediaFiles,
    exportedAt: exportedAt.toISOString(),
  });
  const fileName = makeBackupFileName(exportedAt);
  let uri: string;
  if (Platform.OS === "web") {
    const archiveBuffer = archive.buffer.slice(
      archive.byteOffset,
      archive.byteOffset + archive.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([archiveBuffer], { type: "application/zip" });
    uri = URL.createObjectURL(blob);
  } else {
    const directory = await ensureAppBackupDirectory();
    uri = `${directory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, fromByteArray(archive), {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  const preview = unpackLocalBackupArchive(archive);
  const deletedOldBackups =
    Platform.OS === "web" ? 0 : await cleanupOldInternalBackups();
  const backup: LocalBackupFile = {
    ...preview,
    uri,
    fileName,
    ...(deletedOldBackups ? { deletedOldBackups } : {}),
  };
  onProgress?.({ value: 82, label: "Открываем меню «Поделиться»…" });
  await shareLocalBackupFile(backup);
  onProgress?.({ value: 100, label: "Резервная копия готова." });
  return backup;
}

export async function pickLocalBackup(): Promise<LocalBackupPayload | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/zip", "application/octet-stream"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const base64 =
    Platform.OS === "web" && asset.file
      ? fromByteArray(new Uint8Array(await asset.file.arrayBuffer()))
      : await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
  return unpackLocalBackupArchive(toByteArray(base64));
}

function rewriteDocumentUris(
  entries: readonly (readonly [string, string])[],
  sourceDocumentDirectory: string,
) {
  const targetDocumentDirectory = FileSystem.documentDirectory ?? "";
  if (
    !sourceDocumentDirectory ||
    sourceDocumentDirectory === targetDocumentDirectory
  )
    return entries.map(([key, value]) => [key, value] as [string, string]);
  return entries.map(([key, value]) => [
    key,
    value.split(sourceDocumentDirectory).join(targetDocumentDirectory),
  ]) as [string, string][];
}

export async function restoreLocalBackup(
  backup: LocalBackupPayload,
  onProgress?: (progress: LocalBackupProgress) => void,
) {
  onProgress?.({ value: 8, label: "Подготавливаем восстановление…" });
  const mediaDirectory = mediaDirectoryUri();
  await FileSystem.deleteAsync(mediaDirectory, { idempotent: true });
  const mediaEntries = Object.entries(backup.mediaFiles);
  for (let index = 0; index < mediaEntries.length; index += 1) {
    const [path, bytes] = mediaEntries[index];
    const relativePath = path.replace(/^media\//, "");
    const target = `${mediaDirectory}${relativePath}`;
    const directory = target.slice(0, target.lastIndexOf("/") + 1);
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    await FileSystem.writeAsStringAsync(target, fromByteArray(bytes), {
      encoding: FileSystem.EncodingType.Base64,
    });
    onProgress?.({
      value: Math.min(
        72,
        18 + ((index + 1) / Math.max(mediaEntries.length, 1)) * 54,
      ),
      label: "Восстанавливаем фотографии и файлы…",
    });
  }
  onProgress?.({ value: 82, label: "Восстанавливаем тренировки и настройки…" });
  const existingKeys = await AsyncStorage.getAllKeys();
  if (existingKeys.length) await AsyncStorage.multiRemove(existingKeys);
  const entries = rewriteDocumentUris(
    backup.storageEntries,
    backup.sourceDocumentDirectory,
  );
  if (entries.length) await AsyncStorage.multiSet(entries);
  onProgress?.({ value: 100, label: "Данные восстановлены." });
}
