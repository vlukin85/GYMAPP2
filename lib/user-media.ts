import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export const MAX_USER_IMAGE_BYTES = 8 * 1024 * 1024;

export function isSupportedUserImage(asset: { mimeType?: string | null; name?: string; size?: number }) {
  const extension = asset.name?.split(".").pop()?.toLowerCase() ?? "";
  const imageExtension = ["jpg", "jpeg", "png", "webp", "heic"].includes(extension);
  const mimeIsImage = !asset.mimeType || asset.mimeType.startsWith("image/");
  return mimeIsImage && imageExtension && (asset.size ?? 0) <= MAX_USER_IMAGE_BYTES;
}

function safeExtension(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "heic"].includes(extension ?? "") ? extension : "jpg";
}

/** Picks an image and keeps a durable local copy on Android/iOS. The web fallback is a self-contained data URI. */
export async function pickAndPersistUserImage(scope: "exercise" | "program", ownerId: string) {
  const result = await DocumentPicker.getDocumentAsync({ type: "image/*", copyToCacheDirectory: true, multiple: false, base64: Platform.OS === "web" });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!isSupportedUserImage(asset)) throw new Error("Выберите изображение JPG, PNG, WEBP или HEIC размером до 8 МБ.");
  if (Platform.OS === "web") {
    if (asset.base64) return `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;
    return asset.uri;
  }
  const directory = `${FileSystem.documentDirectory}gym-diary-media/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const target = `${directory}${scope}-${ownerId.replace(/[^a-zA-Z0-9_-]/g, "_")}-${Date.now()}.${safeExtension(asset.name)}`;
  await FileSystem.copyAsync({ from: asset.uri, to: target });
  return target;
}
