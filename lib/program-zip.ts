import { fromByteArray, toByteArray } from "base64-js";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { buildProgramExchange } from "./program-exchange";
import type { WorkoutProgram } from "./workout-data";
import type { PortableProgramMedia } from "./program-media";

const MAX_ZIP_BYTES = 24 * 1024 * 1024;
const MAX_MEDIA_FILE_BYTES = 8 * 1024 * 1024;
type ZipManifest = { format: "gym-training-diary.programs"; version: 2; exportedAt: string; programs: WorkoutProgram[]; mediaFiles?: Record<string, string> };

export function buildProgramZip(programs: WorkoutProgram[], media: PortableProgramMedia) {
  const manifest = JSON.parse(buildProgramExchange(programs)) as ZipManifest;
  const mediaFiles: Record<string, string> = {};
  const files: Record<string, Uint8Array> = {};
  for (const [key, item] of Object.entries(media)) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) continue;
    const bytes = toByteArray(item.base64);
    if (bytes.byteLength > MAX_MEDIA_FILE_BYTES) continue;
    const path = `media/${key}.jpg`;
    mediaFiles[key] = path;
    files[path] = bytes;
  }
  files["programs.json"] = strToU8(JSON.stringify({ ...manifest, ...(Object.keys(mediaFiles).length ? { mediaFiles } : {}) }, null, 2));
  return zipSync(files, { level: 6 });
}

export function unpackProgramZip(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_ZIP_BYTES) throw new Error("ZIP-файл слишком большой: максимум 24 МБ.");
  const archive = unzipSync(bytes);
  const manifestBytes = archive["programs.json"];
  if (!manifestBytes) throw new Error("В ZIP нет файла programs.json.");
  let manifest: ZipManifest;
  try { manifest = JSON.parse(strFromU8(manifestBytes)) as ZipManifest; } catch { throw new Error("Манифест ZIP повреждён."); }
  if (manifest.format !== "gym-training-diary.programs" || manifest.version !== 2 || !Array.isArray(manifest.programs)) throw new Error("ZIP не содержит программы Дневника тренировок.");
  const media: PortableProgramMedia = {};
  for (const [key, path] of Object.entries(manifest.mediaFiles ?? {})) {
    if (!/^[a-zA-Z0-9_-]+$/.test(key) || !/^media\/[a-zA-Z0-9_-]+\.jpg$/.test(path)) continue;
    const image = archive[path];
    if (!image || image.byteLength > MAX_MEDIA_FILE_BYTES) continue;
    media[key] = { mimeType: "image/jpeg", base64: fromByteArray(image) };
  }
  return JSON.stringify({ format: manifest.format, version: manifest.version, exportedAt: manifest.exportedAt, programs: manifest.programs, ...(Object.keys(media).length ? { media } : {}) });
}
