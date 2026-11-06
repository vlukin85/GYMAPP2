import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { bundledExerciseGroupFallbackPhotos, bundledExercisePhotoFileNames, bundledExercisePhotos } from "../lib/bundled-exercise-photos";
import { freeExerciseDbGroupFallbackPhotos, freeExerciseDbPhotoCoverage, freeExerciseDbPhotos } from "../lib/free-exercise-db-photos";
import { exercises, getExerciseIllustrationCandidates } from "../lib/workout-data";

const root = path.resolve(__dirname, "..");
const workoutDataText = readFileSync(path.join(root, "lib/workout-data.ts"), "utf8");
const catalogExpansionText = readFileSync(path.join(root, "lib/catalog-expansion.ts"), "utf8");

function parseCatalogIds() {
  const ids = new Set<string>();
  for (const match of workoutDataText.matchAll(/id:\s*"([a-z0-9-]+)",\s*name:\s*"[^"]*",\s*group:/g)) ids.add(match[1]);
  for (const block of catalogExpansionText.matchAll(/makeEntries\("[^"]+",\s*\[([\s\S]*?)\]\)/g)) {
    for (const entry of block[1].matchAll(/\["([a-z0-9-]+)",/g)) ids.add(entry[1]);
  }
  return [...ids];
}

const catalogIds = parseCatalogIds();
const photosDir = path.join(root, "assets/exercise-photos");

describe("bundled exercise photos", () => {
  it("covers at least 90% of the exercise catalog", () => {
    expect(catalogIds.length).toBeGreaterThanOrEqual(140);
    const covered = catalogIds.filter((id) => freeExerciseDbPhotos[id]).length;
    // 0.95 held before the QA review; six ids were deliberately dropped
    // (high-knees, neutral-pulldown, landmine-chest-press, cable-lateral-raise,
    // air-bike, side-plank) because every dataset candidate showed a wrong
    // exercise. A missing photo is better than a wrong one.
    expect(covered / catalogIds.length).toBeGreaterThanOrEqual(0.9);
    expect(freeExerciseDbPhotoCoverage.matched).toBe(Object.keys(freeExerciseDbPhotos).length);
    expect(freeExerciseDbPhotoCoverage.unmatched.every((id) => catalogIds.includes(id))).toBe(true);
    expect(freeExerciseDbPhotoCoverage.unmatched.length).toBe(catalogIds.length - covered);
  });

  it("maps every covered id to a valid free-exercise-db photo path", () => {
    const urlPattern = /^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\/main\/exercises\/[A-Za-z0-9_().-]+\/\d+\.jpg$/;
    for (const [id, url] of Object.entries(freeExerciseDbPhotos)) {
      expect(url, id).toMatch(urlPattern);
    }
    for (const url of Object.values(freeExerciseDbGroupFallbackPhotos)) {
      expect(url).toMatch(urlPattern);
    }
  });

  it("is deterministic: the web bundle mirrors the url map exactly", () => {
    expect(Object.keys(bundledExercisePhotos).sort()).toEqual(Object.keys(freeExerciseDbPhotos).sort());
    for (const [id, url] of Object.entries(freeExerciseDbPhotos)) {
      expect(bundledExercisePhotos[id], id).toBe(url);
    }
    expect(Object.keys(bundledExerciseGroupFallbackPhotos).sort()).toEqual(Object.keys(freeExerciseDbGroupFallbackPhotos).sort());
    expect(bundledExercisePhotoFileNames.length).toBe(Object.keys(bundledExercisePhotos).length + Object.keys(bundledExerciseGroupFallbackPhotos).length);
  });

  it("ships a real asset file for every bundled photo", () => {
    const requirePattern = /require\("\.\.\/\.\.\/assets\/exercise-photos\/([A-Za-z0-9_-]+\.jpg)"\)/g;
    const nativeSource = readFileSync(path.join(root, "lib/bundled-exercise-photos.native.ts"), "utf8");
    const requiredFiles = [...nativeSource.matchAll(requirePattern)].map((match) => match[1]);
    expect(requiredFiles.length).toBe(bundledExercisePhotoFileNames.length);
    expect([...new Set(requiredFiles)].length).toBe(requiredFiles.length);
    expect(new Set(requiredFiles)).toEqual(new Set(bundledExercisePhotoFileNames));
    for (const fileName of requiredFiles) {
      expect(statSync(path.join(photosDir, fileName)).isFile(), fileName).toBe(true);
    }
  });

  it("keeps every bundled photo small enough for the offline bundle", () => {
    const files = readdirSync(photosDir).filter((file) => file.endsWith(".jpg"));
    expect(files.length).toBe(bundledExercisePhotoFileNames.length);
    let totalBytes = 0;
    for (const file of files) {
      const size = statSync(path.join(photosDir, file)).size;
      expect(size, file).toBeLessThan(100 * 1024);
      expect(size, file).toBeGreaterThan(3 * 1024);
      totalBytes += size;
    }
    expect(totalBytes).toBeLessThan(8 * 1024 * 1024);
  });

  it("gives every catalog exercise an open-photo illustration candidate", () => {
    expect(exercises.length).toBe(catalogIds.length);
    for (const exercise of exercises) {
      const candidates = getExerciseIllustrationCandidates(exercise);
      expect(candidates.some((candidate) => candidate.id === `open-photo-${exercise.id}`), exercise.id).toBe(true);
      expect(exercise.image ?? candidates[0]?.url, exercise.id).toBeTruthy();
    }
  });
});
