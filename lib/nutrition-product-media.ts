import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { DEFAULT_LANG, translate, type Lang } from "@/lib/i18n";
import { MAX_USER_IMAGE_BYTES, type PickedUserImage } from "@/lib/user-media";

/** Keeps the shared size guard for every food product photo source. */
function pickedFromAsset(asset: ImagePicker.ImagePickerAsset | undefined, lang: Lang): PickedUserImage {
  if (!asset?.uri || (asset.fileSize && asset.fileSize > MAX_USER_IMAGE_BYTES)) throw new Error(translate(lang, "nutrition.photo.tooLarge"));
  return { uri: asset.uri, name: asset.fileName ?? `food-${Date.now()}.jpg`, mimeType: asset.mimeType };
}

/**
 * Opens the device gallery for an optional custom food product photo.
 * Язык необязателен: без него сообщение об ошибке остаётся русским.
 */
export async function pickFoodProductPhotoFromLibrary(lang: Lang = DEFAULT_LANG): Promise<PickedUserImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.9, base64: Platform.OS === "web" });
  if (result.canceled) return null;
  return pickedFromAsset(result.assets[0], lang);
}

/** Opens the camera for an optional custom food product photo. */
export async function captureFoodProductPhoto(lang: Lang = DEFAULT_LANG): Promise<PickedUserImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error(translate(lang, "nutrition.photo.cameraPermission"));
  const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9, base64: Platform.OS === "web" });
  if (result.canceled) return null;
  return pickedFromAsset(result.assets[0], lang);
}
