import { Image } from "expo-image";
import * as Network from "expo-network";
import { Platform } from "react-native";
import { exercises } from "./workout-data";
import { canDownloadPhotosOnWifi, getUniquePhotoUrls } from "./offline-media";

export type ExerciseImageCacheResult = { total: number; cached: number; offlineAvailable: boolean };
export type BulkPhotoCacheResult = ExerciseImageCacheResult & { allowed: boolean; message: string };

export async function cacheExercisePhotos(urls: string[]): Promise<ExerciseImageCacheResult> {
  const uniqueUrls = [...new Set(urls.filter((url) => url.startsWith("http")))];
  if (!uniqueUrls.length || Platform.OS === "web") return { total: uniqueUrls.length, cached: 0, offlineAvailable: false };
  try {
    await Image.prefetch(uniqueUrls, "memory-disk");
    const cachePaths = await Promise.all(uniqueUrls.map((url) => Image.getCachePathAsync(url)));
    const cached = cachePaths.filter(Boolean).length;
    return { total: uniqueUrls.length, cached, offlineAvailable: cached === uniqueUrls.length };
  } catch {
    return { total: uniqueUrls.length, cached: 0, offlineAvailable: false };
  }
}

export async function cacheAllExercisePhotosOnWifi(onProgress?: (completed: number, total: number) => void): Promise<BulkPhotoCacheResult> {
  const urls = getUniquePhotoUrls(exercises);
  if (Platform.OS === "web") return { total: urls.length, cached: 0, offlineAvailable: false, allowed: false, message: "Массовая загрузка доступна в приложении Android по Wi‑Fi." };
  const state = await Network.getNetworkStateAsync();
  if (!canDownloadPhotosOnWifi({ type: state.type, isInternetReachable: state.isInternetReachable })) return { total: urls.length, cached: 0, offlineAvailable: false, allowed: false, message: "Подключись к Wi‑Fi с доступом в интернет, чтобы скачать фотографии." };
  let completed = 0;
  for (let start = 0; start < urls.length; start += 8) {
    const batch = urls.slice(start, start + 8);
    try { await Image.prefetch(batch, "memory-disk"); } catch { /* Проверяем успешно сохранённые фото после каждой пачки. */ }
    completed += batch.length;
    onProgress?.(completed, urls.length);
  }
  const cachePaths = await Promise.all(urls.map((url) => Image.getCachePathAsync(url)));
  const cached = cachePaths.filter(Boolean).length;
  return { total: urls.length, cached, offlineAvailable: cached === urls.length, allowed: true, message: cached === urls.length ? "Все фотографии сохранены для офлайн-просмотра." : `Сохранено ${cached} из ${urls.length} фотографий.` };
}
