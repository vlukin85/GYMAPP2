import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { getAsyncStorageEntriesBytes } from "./storage-usage-utils";

export type LocalStorageUsage = {
  appDataBytes: number;
  asyncStorageBytes: number;
  filesBytes: number;
  freeBytes: number | null;
  totalBytes: number | null;
};

async function getDirectorySize(directoryUri: string | null): Promise<number> {
  if (!directoryUri) return 0;
  try {
    const info = await FileSystem.getInfoAsync(directoryUri);
    if (!info.exists) return 0;
    if (!info.isDirectory) return info.size ?? 0;
    const names = await FileSystem.readDirectoryAsync(directoryUri);
    const children: number[] = await Promise.all(names.map((name): Promise<number> => getDirectorySize(`${directoryUri}${directoryUri.endsWith("/") ? "" : "/"}${name}`)));
    return children.reduce((sum: number, size: number) => sum + size, 0);
  } catch {
    return 0;
  }
}

export async function getLocalStorageUsage(): Promise<LocalStorageUsage> {
  const keys = await AsyncStorage.getAllKeys();
  const entries = keys.length ? await AsyncStorage.multiGet(keys) : [];
  const asyncStorageBytes = getAsyncStorageEntriesBytes(entries);

  if (Platform.OS === "web") {
    return { appDataBytes: asyncStorageBytes, asyncStorageBytes, filesBytes: 0, freeBytes: null, totalBytes: null };
  }

  const [documentBytes, cacheBytes, freeResult, totalResult] = await Promise.all([
    getDirectorySize(FileSystem.documentDirectory),
    getDirectorySize(FileSystem.cacheDirectory),
    FileSystem.getFreeDiskStorageAsync().catch(() => null),
    FileSystem.getTotalDiskCapacityAsync().catch(() => null),
  ]);
  const filesBytes = documentBytes + cacheBytes;
  return {
    appDataBytes: asyncStorageBytes + filesBytes,
    asyncStorageBytes,
    filesBytes,
    freeBytes: freeResult,
    totalBytes: totalResult,
  };
}
