import AsyncStorage from "@react-native-async-storage/async-storage";
import { fromByteArray, toByteArray } from "base64-js";
import * as DocumentPicker from "expo-document-picker";
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

function mediaDirectoryUri() {
  return `${FileSystem.documentDirectory}${MEDIA_DIRECTORY_NAME}/`;
}

async function readMediaDirectory(
  directoryUri: string,
  relativeDirectory = "media/",
): Promise<Record<string, Uint8Array>> {
  const info = await FileSystem.getInfoAsync(directoryUri);
  if (!info.exists) return {};
  const files: Record<string, Uint8Array> = {};
  for (const name of await FileSystem.readDirectoryAsync(directoryUri)) {
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
  }
  return files;
}

function makeBackupFileName(exportedAt = new Date()) {
  return `ironrise-backup-${exportedAt.toISOString().slice(0, 10)}.zip`;
}

export async function createAndShareLocalBackup(): Promise<LocalBackupPreview> {
  const keys = await AsyncStorage.getAllKeys();
  const [entries, mediaFiles] = await Promise.all([
    keys.length ? AsyncStorage.multiGet(keys) : [],
    readMediaDirectory(mediaDirectoryUri()),
  ]);
  const archive = buildLocalBackupArchive({
    storageEntries: entries,
    sourceDocumentDirectory: FileSystem.documentDirectory ?? "",
    mediaFiles,
  });
  const fileName = makeBackupFileName();
  if (Platform.OS === "web") {
    const blob = new Blob([archive], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const uri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, fromByteArray(archive), {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!(await Sharing.isAvailableAsync()))
      throw new Error("Системное меню сохранения файлов недоступно.");
    await Sharing.shareAsync(uri, {
      dialogTitle: "Сохранить резервную копию IronRise",
      mimeType: "application/zip",
      UTI: "public.zip-archive",
    });
  }
  return unpackLocalBackupArchive(archive);
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

export async function restoreLocalBackup(backup: LocalBackupPayload) {
  const mediaDirectory = mediaDirectoryUri();
  await FileSystem.deleteAsync(mediaDirectory, { idempotent: true });
  for (const [path, bytes] of Object.entries(backup.mediaFiles)) {
    const relativePath = path.replace(/^media\//, "");
    const target = `${mediaDirectory}${relativePath}`;
    const directory = target.slice(0, target.lastIndexOf("/") + 1);
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    await FileSystem.writeAsStringAsync(target, fromByteArray(bytes), {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  const existingKeys = await AsyncStorage.getAllKeys();
  if (existingKeys.length) await AsyncStorage.multiRemove(existingKeys);
  const entries = rewriteDocumentUris(
    backup.storageEntries,
    backup.sourceDocumentDirectory,
  );
  if (entries.length) await AsyncStorage.multiSet(entries);
}
