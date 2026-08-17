export const MAX_USER_IMAGE_BYTES = 8 * 1024 * 1024;
export type CropPreset = "square" | "landscape" | "original";

export function isSupportedUserImage(asset: { mimeType?: string | null; name?: string; size?: number }) {
  const extension = asset.name?.split(".").pop()?.toLowerCase() ?? "";
  const imageExtension = ["jpg", "jpeg", "png", "webp", "heic"].includes(extension);
  const mimeIsImage = !asset.mimeType || asset.mimeType.startsWith("image/");
  return mimeIsImage && imageExtension && (asset.size ?? 0) <= MAX_USER_IMAGE_BYTES;
}

export function getCenteredCrop(width: number, height: number, preset: Exclude<CropPreset, "original">) {
  const targetRatio = preset === "square" ? 1 : 4 / 3;
  const sourceRatio = width / height;
  if (sourceRatio > targetRatio) {
    const cropWidth = Math.round(height * targetRatio);
    return { originX: Math.round((width - cropWidth) / 2), originY: 0, width: cropWidth, height };
  }
  const cropHeight = Math.round(width / targetRatio);
  return { originX: 0, originY: Math.round((height - cropHeight) / 2), width, height: cropHeight };
}
