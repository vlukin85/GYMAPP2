import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { MAX_USER_IMAGE_BYTES, cropAndPersistUserImage, type PickedUserImage } from "@/lib/user-media";

/** Selects a single progress photo only after a deliberate user action, then persists a resized local rendition. */
export async function pickAndPersistBodyProgressPhoto(ownerId: string) {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.9, base64: Platform.OS === "web" });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.uri || (asset.fileSize && asset.fileSize > MAX_USER_IMAGE_BYTES)) throw new Error("Выберите фотографию размером до 8 МБ.");
  const source: PickedUserImage = { uri: asset.uri, name: asset.fileName ?? `progress-${Date.now()}.jpg`, mimeType: asset.mimeType };
  return cropAndPersistUserImage(source, "body", ownerId, "original");
}
