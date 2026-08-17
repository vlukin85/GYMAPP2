import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import type { WorkoutProgram } from "./workout-data";

export type PortableProgramMedia = Record<string, { mimeType: "image/jpeg"; base64: string }>;
const PREFIX = "gym-media://";
const MAX_PORTABLE_MEDIA_BYTES = 8 * 1024 * 1024;

export const portableMediaRef = (key: string) => `${PREFIX}${key}`;
export const portableMediaKey = (value?: string) => value?.startsWith(PREFIX) ? value.slice(PREFIX.length) : null;

async function toPortableMedia(uri: string): Promise<{ mimeType: "image/jpeg"; base64: string } | null> {
  if (uri.startsWith("data:image/")) {
    const match = /^data:image\/(?:jpeg|jpg|png|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(uri);
    if (!match || match[1].length > MAX_PORTABLE_MEDIA_BYTES * 1.4) return null;
    return { mimeType: "image/jpeg", base64: match[1] };
  }
  if (!uri.startsWith("file://")) return null;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || ("size" in info && (info.size ?? 0) > MAX_PORTABLE_MEDIA_BYTES)) return null;
  return { mimeType: "image/jpeg", base64: await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }) };
}

export async function buildPortableProgramMedia(programs: WorkoutProgram[], exerciseImageOverrides: Record<string, string>, exerciseGalleries: Record<string, { id: string; label: string; url: string }[]>) {
  const media: PortableProgramMedia = {};
  const transformed = await Promise.all(programs.map(async (program) => {
    if (!program.coverImage) return program;
    const key = `program-${program.id}-cover`;
    const encoded = await toPortableMedia(program.coverImage);
    if (!encoded) return program;
    media[key] = encoded;
    return { ...program, coverImage: portableMediaRef(key) };
  }));
  const exerciseIds = new Set(programs.flatMap((program) => program.exercises.map((exercise) => exercise.exerciseId)));
  for (const exerciseId of exerciseIds) {
    const main = exerciseImageOverrides[exerciseId];
    if (main) { const key = `exercise-${exerciseId}-main`; const encoded = await toPortableMedia(main); if (encoded) media[key] = encoded; }
    for (const [index, image] of (exerciseGalleries[exerciseId] ?? []).entries()) { const key = `exercise-${exerciseId}-extra-${index}`; const encoded = await toPortableMedia(image.url); if (encoded) media[key] = encoded; }
  }
  return { programs: transformed, media };
}

export async function restorePortableProgramMedia(media: PortableProgramMedia) {
  const restored: Record<string, string> = {};
  const entries = Object.entries(media);
  for (const [key, item] of entries) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key) || !item.base64 || item.base64.length > MAX_PORTABLE_MEDIA_BYTES * 1.4) continue;
    if (Platform.OS === "web") { restored[key] = `data:image/jpeg;base64,${item.base64}`; continue; }
    const directory = `${FileSystem.documentDirectory}gym-diary-media/imported/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const uri = `${directory}${key}-${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(uri, item.base64, { encoding: FileSystem.EncodingType.Base64 });
    restored[key] = uri;
  }
  return restored;
}
