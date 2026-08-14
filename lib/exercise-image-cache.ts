import { Image } from "expo-image";
import { Platform } from "react-native";

export type ExerciseImageCacheResult = { total: number; cached: number; offlineAvailable: boolean };

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
