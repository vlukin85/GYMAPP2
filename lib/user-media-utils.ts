export const MAX_USER_IMAGE_BYTES = 8 * 1024 * 1024;
export type CropPreset = "square" | "landscape" | "original";
export type CropAdjustment = { focusX: number; focusY: number; zoom: number };
export const DEFAULT_CROP_ADJUSTMENT: CropAdjustment = { focusX: 0.5, focusY: 0.5, zoom: 1 };

export function isSupportedUserImage(asset: { mimeType?: string | null; name?: string; size?: number }) {
  const extension = asset.name?.split(".").pop()?.toLowerCase() ?? "";
  const imageExtension = ["jpg", "jpeg", "png", "webp", "heic"].includes(extension);
  const mimeIsImage = !asset.mimeType || asset.mimeType.startsWith("image/");
  return mimeIsImage && imageExtension && (asset.size ?? 0) <= MAX_USER_IMAGE_BYTES;
}

export function getCenteredCrop(width: number, height: number, preset: Exclude<CropPreset, "original">) {
  return getCropRect(width, height, preset, DEFAULT_CROP_ADJUSTMENT);
}

export function getCropRect(width: number, height: number, preset: Exclude<CropPreset, "original">, adjustment: CropAdjustment) {
  const targetRatio = preset === "square" ? 1 : 4 / 3;
  const sourceRatio = width / height;
  const zoom = Math.min(3, Math.max(1, adjustment.zoom));
  const focusX = Math.min(1, Math.max(0, adjustment.focusX));
  const focusY = Math.min(1, Math.max(0, adjustment.focusY));
  if (sourceRatio > targetRatio) {
    const cropWidth = Math.round((height * targetRatio) / zoom);
    const cropHeight = Math.round(height / zoom);
    return { originX: Math.round(Math.min(width - cropWidth, Math.max(0, focusX * width - cropWidth / 2))), originY: Math.round(Math.min(height - cropHeight, Math.max(0, focusY * height - cropHeight / 2))), width: cropWidth, height: cropHeight };
  }
  const cropWidth = Math.round(width / zoom);
  const cropHeight = Math.round((width / targetRatio) / zoom);
  return { originX: Math.round(Math.min(width - cropWidth, Math.max(0, focusX * width - cropWidth / 2))), originY: Math.round(Math.min(height - cropHeight, Math.max(0, focusY * height - cropHeight / 2))), width: cropWidth, height: cropHeight };
}
