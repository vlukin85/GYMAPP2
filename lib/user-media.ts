import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Image, Platform } from "react-native";
import { getCenteredCrop, isSupportedUserImage, type CropPreset } from "./user-media-utils";

export { MAX_USER_IMAGE_BYTES, getCenteredCrop, isSupportedUserImage, type CropPreset } from "./user-media-utils";
export type PickedUserImage = { uri: string; name: string; mimeType?: string | null };

function safeOwnerId(ownerId: string) { return ownerId.replace(/[^a-zA-Z0-9_-]/g, "_"); }

function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));
}

/** Opens the system picker but does not persist anything until cropping is confirmed. */
export async function pickUserImage(): Promise<PickedUserImage | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: "image/*", copyToCacheDirectory: true, multiple: false, base64: Platform.OS === "web" });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!isSupportedUserImage(asset)) throw new Error("Выберите изображение JPG, PNG, WEBP или HEIC размером до 8 МБ.");
  const uri = Platform.OS === "web" && asset.base64 ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}` : asset.uri;
  return { uri, name: asset.name, mimeType: asset.mimeType };
}

/** Crops/compresses a picked image and stores only the finalized rendition. */
export async function cropAndPersistUserImage(source: PickedUserImage, scope: "exercise" | "program", ownerId: string, preset: CropPreset) {
  const actions: ImageManipulator.Action[] = [];
  if (preset !== "original") { const size = await getImageSize(source.uri); actions.push({ crop: getCenteredCrop(size.width, size.height, preset) }); }
  actions.push({ resize: { width: preset === "square" ? 960 : 1400 } });
  const rendered = await ImageManipulator.manipulateAsync(source.uri, actions, { compress: 0.86, format: ImageManipulator.SaveFormat.JPEG, base64: Platform.OS === "web" });
  if (Platform.OS === "web") return rendered.base64 ? `data:image/jpeg;base64,${rendered.base64}` : rendered.uri;
  const directory = `${FileSystem.documentDirectory}gym-diary-media/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const target = `${directory}${scope}-${safeOwnerId(ownerId)}-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: rendered.uri, to: target });
  return target;
}
