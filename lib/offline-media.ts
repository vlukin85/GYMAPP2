export type WifiNetworkState = { type?: string | null; isInternetReachable?: boolean | null };

export function canDownloadPhotosOnWifi(state: WifiNetworkState) {
  return state.type === "WIFI" && state.isInternetReachable === true;
}

export function getUniquePhotoUrls(items: { image: string; photoAngles?: { url: string }[] }[]) {
  return [...new Set(items.flatMap((item) => item.photoAngles?.map((photo) => photo.url) ?? [item.image]).filter((url) => url.startsWith("http")))];
}
