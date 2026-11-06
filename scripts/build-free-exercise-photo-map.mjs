import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

/**
 * Builds the map of catalog exercise ids -> free-exercise-db photos.
 *
 * Phases:
 *  1. Parse the local catalog (lib/workout-data.ts + lib/catalog-expansion.ts)
 *     to get every exercise id with its muscle group and equipment.
 *  2. Score every free-exercise-db record against the id: core movement tokens,
 *     modifier words (incline/decline/cable/...), extra-movement penalties and
 *     muscle-group agreement. Confident matches only — weak matches are left
 *     unmatched on purpose so the next illustration in the app chain takes over.
 *  3. Write lib/free-exercise-db-photos.ts (remote URL map).
 *  4. With `--bundle`: download the winning photo for every matched id,
 *     crop it to a 512x512 square, recompress it to <=60 KB and emit the
 *     platform-split bundling modules (lib/bundled-exercise-photos[.native].ts).
 *
 * Flags: --bundle (download + optimize + emit bundling modules),
 *        --report (print the per-id match table for manual review),
 *        --debug <id> (print every candidate score for one id).
 */

const dataUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const sourceUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main";
const datasetCache = "scripts/.cache/free-exercise-db-exercises.json";
const sourceFiles = ["lib/workout-data.ts", "lib/catalog-expansion.ts"];
const photosDir = "assets/exercise-photos";
const MATCH_THRESHOLD = 7.2;

/** Ids whose concept needs an explicit alias because the dataset names it differently. */
const idAliases = {
  "pec-deck": "butterfly machine fly",
  "reverse-pec-deck": "reverse machine fly",
  "chest-supported-row": "incline dumbbell row",
  "scaption-raise": "dumbbell scaption",
  "close-grip-bench": "close-grip press",
  "kneeling-cable-press": "cable chest press",
  "jumping-jacks": "star jump",
  "diamond-push-up": "pushups close triceps position",
  "farmer-carry": "farmer walk",
  "box-step-cardio": "box jump",
  "outdoor-run": "trail running",
  "meadows-row": "one-arm long bar row",
  "landmine-press": "barbell shoulder press",
  "bicycle-crunch": "cross-body crunch",
};

/**
 * Manual photo decisions approved during the contact-sheet QA review.
 * `exercise` is the exact free-exercise-db name, `image` is the 0-based index
 * into that exercise's `images` array (0.jpg / 1.jpg in the repo).
 */
const idPhotoOverrides = {
  "dips": { exercise: "Dips - Chest Version", image: 1 },
  "calf-raise": { exercise: "Standing Calf Raises", image: 0 },
  "plank": { exercise: "Plank", image: 1 },
  "bulgarian-split-squat": { exercise: "Split Squat with Dumbbells", image: 1 },
  "walking-lunge": { exercise: "Dumbbell Lunges", image: 1 },
  "v-up": { exercise: "Jackknife Sit-Up", image: 1 },
  "single-cable-press": { exercise: "Standing Cable Chest Press", image: 0 },
};

/**
 * Ids that must not show a free-exercise-db photo: the only dataset candidates
 * were visually wrong (a wrong photo is worse than none — the next workout-data
 * illustration step takes over).
 */
const idPhotoExclusions = new Set([
  "air-bike", // dataset "Air Bike" is a floor abdominal drill, not the bike machine
  "side-plank", // no Side Plank exercise in the dataset
  "high-knees",
  "neutral-pulldown",
  "landmine-chest-press",
  "cable-lateral-raise",
]);

/** Adjacent words that legitimately form one movement word. */
const compounds = new Set(["pushup", "pullup", "situp", "stepup", "getup"]);

const synonym = {
  db: "dumbbell",
  dumbbells: "dumbbell",
  kettlebells: "kettlebell",
  pushup: "pushup",
  pushups: "pushup",
  pullup: "pullup",
  pullups: "pullup",
  ups: "up",
  rower: "row",
  rowing: "row",
  rows: "row",
  pulls: "pull",
  curls: "curl",
  raises: "raise",
  extensions: "extension",
  flyes: "fly",
  flye: "fly",
  crossover: "fly",
  butterfly: "fly",
  crunches: "crunch",
  squats: "squat",
  lunges: "lunge",
  presses: "press",
  swings: "swing",
  shrugs: "shrug",
  jumps: "jump",
  jumping: "jump",
  running: "run",
  walking: "walk",
  dips: "dip",
  climbers: "climber",
  touches: "touch",
  touchers: "touch",
  tricep: "triceps",
  rear: "rear",
  kickbacks: "kickback",
  stairmaster: "stair climber",
  wheel: "roller",
  cycles: "bike",
  cycling: "bike",
  bicycle: "bike",
  carries: "carry",
  battle: "battling",
  woodchop: "wood chop",
};

/** Words that never discriminate between exercises. */
const neutral = new Set(["one", "two", "single", "arm", "arms", "hand", "hands", "grip", "with", "on", "the", "to", "of", "and", "a", "style", "bar", "medium", "attachment", "response", "up", "down", "version", "cardio", "power"]);

/** Position/equipment words: a small bonus when the id asks for them, a penalty when a candidate adds them. */
const modifiers = new Set([
  "flat", "wide", "narrow", "close", "neutral", "reverse",
  "low", "high", "seated", "standing", "lying", "floor", "incline", "decline",
  "weighted", "smith", "machine", "side", "front", "back", "straight", "bent",
  "knee", "knees", "leg", "over", "under", "cable", "band", "bands", "body",
  "barbell", "dumbbell", "kettlebell", "ez", "sled", "plate", "ball", "supported",
  "inner", "outer", "alternate", "alternating", "exercise", "hanging", "parallel",
  "split", "bulgarian", "overhead", "behind", "bench", "rear",
]);

/** Modifier words that routinely accompany the movement without changing it (lighter penalty). */
const companions = new Set(["machine", "bench", "cable", "barbell", "dumbbell", "kettlebell", "ball", "plate", "sled", "band", "bands", "exercise"]);

/** Modifier penalty weight per word. */
const modifierPenalty = (token) => (companions.has(token) ? 0.35 : 0.7);

/** Movement words; an unexpected movement word in a candidate is a strong mismatch signal. */
const movement = new Set([
  "press", "fly", "row", "curl", "squat", "lunge", "deadlift", "extension",
  "raise", "crunch", "plank", "dip", "pushup", "pullup", "pulldown", "pullover",
  "shrug", "thrust", "bridge", "kickback", "pushdown", "twist", "swing",
  "carry", "walk", "run", "jog", "jump", "skip", "hop", "climb", "swim",
  "chop", "rotation", "situp", "climber", "bike", "clean", "snatch", "jerk", "getup",
]);

/** Movements close enough that an extra one is only a mild mismatch. */
const movementFamilies = [
  new Set(["run", "walk", "jog"]),
  new Set(["jump", "skip", "hop"]),
  new Set(["carry", "walk"]),
];

/** Body-part words in a candidate that the id never asked for. */
const bodyParts = new Set([
  "chest", "lats", "lat", "shoulder", "shoulders", "delt", "deltoid", "biceps", "triceps",
  "quadriceps", "quads", "hamstring", "hamstrings", "glute", "glutes", "calf", "calves",
  "abs", "abdominal", "abdominals", "oblique", "obliques", "forearm", "forearms",
  "hip", "hips", "thigh", "thighs", "neck", "traps", "adductor", "adductors", "abductor", "abductors",
]);

const groupMuscles = {
  "Грудь": { primary: ["chest"] },
  "Спина": { primary: ["lats", "middle back", "lower back", "traps"] },
  "Ноги": { primary: ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"] },
  "Плечи": { primary: ["shoulders"] },
  "Бицепс": { primary: ["biceps"] },
  "Трицепс": { primary: ["triceps"] },
  "Корпус": { primary: ["abdominals"], altCategory: { "plyometrics": 0.8 } },
  "Кардио": { category: "cardio", altCategory: { "plyometrics": 1.2, "strength": 1.2, "strongman": 1.2 } },
};

const groupFileStem = {
  "Грудь": "chest", "Спина": "back", "Ноги": "legs", "Плечи": "shoulders",
  "Бицепс": "biceps", "Трицепс": "triceps", "Корпус": "core", "Кардио": "cardio",
};

/** Russian catalog equipment -> acceptable free-exercise-db equipment values. */
const equipmentDataset = {
  "Гантели": ["dumbbell"],
  "Штанга": ["barbell", "e-z curl bar"],
  "Тренажёр": ["machine", "cable"],
  "Вес тела": ["body only"],
  "Гиря": ["kettlebells"],
  "Диск": ["other"],
  "Ролик": ["other"],
  "Скамья": ["body only"],
  "Скакалка": ["other"],
  "Сани": ["other"],
  "Канаты": ["other"],
  "Платформа": ["other", "body only"],
  "Мешок": ["other"],
  "Бассейн": ["other"],
  "Без оборудования": ["body only"],
};

function rawTokens(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      let current = token;
      for (let step = 0; step < 3; step += 1) {
        const mapped = synonym[current];
        if (!mapped || mapped === current) break;
        current = mapped;
      }
      return current;
    })
    .flatMap((token) => token.split(" "));
}

function tokenSet(value) {
  const raw = rawTokens(value);
  const out = new Set();
  const consumed = new Set();
  raw.forEach((token, index) => {
    const next = raw[index + 1];
    if (next) {
      const merged = synonym[`${token}${next}`] ?? `${token}${next}`;
      if (compounds.has(merged)) {
        out.add(merged);
        consumed.add(index);
        consumed.add(index + 1);
      }
    }
  });
  raw.forEach((token, index) => {
    if (consumed.has(index)) return;
    if (!neutral.has(token) && !modifiers.has(token) && (token.length > 1 || token === "t")) out.add(token);
  });
  return out;
}

function modifierTokens(value) {
  return new Set(rawTokens(value).filter((token) => modifiers.has(token)));
}

function parseBaseCatalog(text) {
  const entries = [];
  const pattern = /id:\s*"([a-z0-9-]+)",\s*name:\s*"([^"]*)",\s*group:\s*"([^"]*)",\s*equipment:\s*"([^"]*)"/g;
  for (const match of text.matchAll(pattern)) {
    entries.push({ id: match[1], name: match[2], group: match[3], equipment: match[4] });
  }
  return entries;
}

function parseExpansionCatalog(text) {
  const entries = [];
  for (const block of text.matchAll(/makeEntries\("([^"]+)",\s*\[([\s\S]*?)\]\)/g)) {
    const group = block[1];
    for (const entry of block[2].matchAll(/\["([a-z0-9-]+)",\s*"([^"]*)",\s*"([^"]*)",/g)) {
      entries.push({ id: entry[1], name: entry[2], group, equipment: entry[3] });
    }
  }
  return entries;
}

function scoreEntry(entry, candidate) {
  const wantedSource = idAliases[entry.id] ?? entry.id;
  const wanted = tokenSet(wantedSource);
  if (!wanted.size) return null;
  const wantedModifiers = modifierTokens(wantedSource);
  const available = tokenSet(candidate.name);
  const availableRaw = new Set(rawTokens(candidate.name));
  const common = [...wanted].filter((token) => available.has(token));
  if (!common.length) return null;

  // Body-part words ("biceps", "shoulder") are soft: matching them helps a
  // little, but coverage is measured over the movement-defining tokens only.
  const softWanted = [...wanted].filter((token) => bodyParts.has(token));
  const hardWanted = [...wanted].filter((token) => !bodyParts.has(token));
  const effectiveHard = hardWanted.length ? hardWanted : [...wanted];
  const hardCommon = hardWanted.length ? common.filter((token) => !bodyParts.has(token)).length : common.length;
  const coverage = hardCommon / effectiveHard.length;
  if (effectiveHard.length >= 2 && coverage < 0.75) return null;
  // Body-part words in a candidate do not dilute precision.
  const availableCore = [...available].filter((token) => !bodyParts.has(token)).length;
  const precision = Math.min(1, hardCommon / Math.max(1, availableCore));
  let score = coverage * 6 + precision * 1.5;
  const details = { coverage, precision };

  for (const token of available) {
    if (wanted.has(token)) continue;
    if (movement.has(token)) {
      const isSibling = movementFamilies.some((family) => family.has(token) && common.some((wantedToken) => family.has(wantedToken)));
      score -= isSibling ? 1 : 4;
      details.extraMovement = (details.extraMovement ?? 0) + (isSibling ? 1 : 4);
    } else if (bodyParts.has(token)) {
      score -= 0.7;
      details.extraBodyPart = (details.extraBodyPart ?? 0) + 1;
    } else {
      score -= 0.9;
      details.extraCore = (details.extraCore ?? 0) + 1;
    }
  }

  const candidateModifiers = modifierTokens(candidate.name);
  let modifierBonus = 0;
  for (const token of wantedModifiers) {
    if (availableRaw.has(token)) modifierBonus += 0.8;
  }
  score += Math.min(2.4, modifierBonus);
  let bodyBonus = 0;
  for (const token of softWanted) {
    if (available.has(token)) bodyBonus += 0.3;
  }
  score += Math.min(0.6, bodyBonus);
  for (const token of candidateModifiers) {
    if (!wantedModifiers.has(token)) score -= modifierPenalty(token);
  }
  const idRaw = new Set(rawTokens(wantedSource));
  let neutralExtras = 0;
  for (const token of availableRaw) {
    const isNeutral = neutral.has(token) || /^\d+$/.test(token);
    if (isNeutral && !idRaw.has(token)) neutralExtras += 1;
  }
  score -= Math.min(0.9, neutralExtras * 0.15);
  details.extraModifiers = candidateModifiers.size - [...wantedModifiers].filter((token) => candidateModifiers.has(token)).length;
  details.neutralExtras = neutralExtras;

  const group = groupMuscles[entry.group];
  let groupScore = -3.5;
  if (group.category) {
    if (candidate.category === group.category) groupScore = 2.5;
    else if (group.altCategory?.[candidate.category]) groupScore = group.altCategory[candidate.category];
  } else {
    const primary = candidate.primaryMuscles ?? [];
    const secondary = candidate.secondaryMuscles ?? [];
    if (primary.some((muscle) => group.primary.includes(muscle))) groupScore = 2.5;
    else if (secondary.some((muscle) => group.primary.includes(muscle))) groupScore = 1.2;
    else if (group.altCategory?.[candidate.category]) groupScore = group.altCategory[candidate.category];
  }
  score += groupScore;

  const wantedEquipment = equipmentDataset[entry.equipment];
  const categoryDriven = Boolean(group.category || group.altCategory);
  if (wantedEquipment && !categoryDriven) {
    score += wantedEquipment.includes(candidate.equipment) ? 1.5 : -1.5;
  } else if (wantedEquipment && categoryDriven) {
    score += wantedEquipment.includes(candidate.equipment) ? 1 : 0;
  }

  return { score, groupScore, coverage, precision, details, candidateModifierPenalty: details.extraModifiers };
}

async function loadDataset() {
  try {
    const cached = await fs.readFile(datasetCache, "utf8");
    return JSON.parse(cached);
  } catch {
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error(`Unable to fetch open exercise data: ${response.status}`);
    const dataset = await response.json();
    await fs.mkdir(path.dirname(datasetCache), { recursive: true });
    await fs.writeFile(datasetCache, JSON.stringify(dataset));
    return dataset;
  }
}

function prepareCandidates(dataset) {
  return dataset
    .filter((exercise) => Array.isArray(exercise.images) && exercise.images.length)
    .map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment ?? "other",
      primaryMuscles: exercise.primaryMuscles ?? [],
      secondaryMuscles: exercise.secondaryMuscles ?? [],
      images: exercise.images,
    }));
}

function rankEntry(entry, candidates) {
  return candidates
    .map((candidate) => {
      // Parenthetical qualifiers are noise in most names but carry the real
      // movement in a few ("Hyperextensions (Back Extensions)"), so the best
      // of both readings wins.
      const stripped = candidate.name.replace(/\([^)]*\)/g, " ");
      const scored = [candidate.name, stripped]
        .map((name) => scoreEntry(entry, { ...candidate, name }))
        .filter(Boolean);
      if (!scored.length) return null;
      const best = scored.reduce((acc, item) => (item.score > acc.score ? item : acc), scored[0]);
      return { candidate, ...best };
    })
    .filter(Boolean)
    .sort((first, second) => second.score - first.score || String(first.candidate.id).localeCompare(String(second.candidate.id)));
}

function buildMapping(entries, dataset) {
  const candidates = prepareCandidates(dataset);
  const result = {};
  const unmatched = [];
  const report = [];
  for (const entry of entries) {
    if (idPhotoExclusions.has(entry.id)) {
      unmatched.push(entry.id);
      report.push({ id: entry.id, group: entry.group, matched: null, runnerUp: "исключено вручную по итогам QA-просмотра контактных листов", excluded: true });
      continue;
    }
    const override = idPhotoOverrides[entry.id];
    if (override) {
      const match = dataset.find((exercise) => exercise.name === override.exercise && Array.isArray(exercise.images));
      const image = match?.images?.[override.image ?? 0];
      if (match && image) {
        result[entry.id] = `${sourceUrl}/exercises/${image}`;
        report.push({ id: entry.id, group: entry.group, matched: `${match.name} (кадр ${override.image ?? 0})`, score: null, runnerUp: "-", override: true });
      } else {
        unmatched.push(entry.id);
        report.push({ id: entry.id, group: entry.group, matched: null, runnerUp: `переопределение не найдено в датасете: ${override.exercise}` });
      }
      continue;
    }
    const ranked = rankEntry(entry, candidates).filter((item) => item.groupScore > 0);
    const best = ranked[0];
    if (!best || best.score < MATCH_THRESHOLD) {
      unmatched.push(entry.id);
      report.push({ id: entry.id, group: entry.group, matched: null, runnerUp: best ? `${best.candidate.name} [${best.score.toFixed(1)}]` : "нет кандидатов" });
      continue;
    }
    result[entry.id] = `${sourceUrl}/exercises/${best.candidate.images[0]}`;
    report.push({
      id: entry.id,
      group: entry.group,
      matched: best.candidate.name,
      score: Number(best.score.toFixed(1)),
      runnerUp: ranked[1] ? `${ranked[1].candidate.name} [${ranked[1].score.toFixed(1)}]` : "-",
    });
  }
  return { result, unmatched, report };
}

function groupFallbackMapping(dataset) {
  const preferred = {
    "Грудь": "Barbell Bench Press - Medium Grip",
    "Спина": "One-Arm Dumbbell Row",
    "Ноги": "Barbell Squat",
    "Плечи": "Standing Military Press",
    "Бицепс": "Barbell Curl",
    "Трицепс": "Triceps Pushdown - V-Bar Attachment",
    "Корпус": "Plank",
    "Кардио": "Elliptical Trainer",
  };
  const result = {};
  for (const [group, name] of Object.entries(preferred)) {
    const match = dataset.find((exercise) => exercise.name === name && exercise.images?.[0]);
    if (match) result[group] = `${sourceUrl}/exercises/${match.images[0]}`;
  }
  return result;
}

async function optimizePhoto(sourcePath, targetPath) {
  const tempSquare = `${targetPath}.tmp.jpg`;
  const build = (size, quality) => execFileSync("convert", [
    sourcePath, "-auto-orient", "-resize", `${size}x${size}^`, "-gravity", "center",
    "-extent", `${size}x${size}`, "-strip", "-interlace", "JPEG", "-quality", String(quality), tempSquare,
  ]);
  build(512, 72);
  let quality = 72;
  while (quality >= 34) {
    if ((await fs.stat(tempSquare)).size <= 60 * 1024) break;
    quality -= 6;
    build(512, quality);
  }
  if ((await fs.stat(tempSquare)).size > 100 * 1024) build(448, 58);
  await fs.rename(tempSquare, targetPath);
  return (await fs.stat(targetPath)).size;
}

async function downloadPhoto(url, attempt = 1) {
  const response = await fetch(url);
  if (!response.ok) {
    if (attempt < 3) return downloadPhoto(url, attempt + 1);
    throw new Error(`Unable to download ${url}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

const runBundle = process.argv.includes("--bundle");
const writeReport = process.argv.includes("--report");
const debugIndex = process.argv.indexOf("--debug");

const workoutText = await fs.readFile(sourceFiles[0], "utf8");
const expansionText = await fs.readFile(sourceFiles[1], "utf8");
const entries = [...parseBaseCatalog(workoutText), ...parseExpansionCatalog(expansionText)];
const seen = new Set();
const uniqueEntries = entries.filter((entry) => (seen.has(entry.id) ? false : (seen.add(entry.id), true)));
const dataset = await loadDataset();

if (debugIndex >= 0) {
  const debugId = process.argv[debugIndex + 1];
  const entry = uniqueEntries.find((item) => item.id === debugId);
  if (!entry) throw new Error(`Unknown catalog id: ${debugId}`);
  const ranked = rankEntry(entry, prepareCandidates(dataset));
  console.log(ranked.slice(0, 15).map((item) => `${item.score.toFixed(2).padStart(7)}  group ${item.groupScore}  ${item.candidate.name} [${item.candidate.category}/${item.candidate.equipment}] ${JSON.stringify(item.details)}`).join("\n"));
  process.exit(0);
}

const { result, unmatched, report } = buildMapping(uniqueEntries, dataset);
const fallbacks = groupFallbackMapping(dataset);

const header = `/**\n * Exercise photos from yuhonas/free-exercise-db (Unlicense).\n * Source: https://github.com/yuhonas/free-exercise-db\n * Generated deterministically from the local exercise identifiers.\n */\n`;
const lines = (record) => Object.entries(record).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`).join("\n");
const output = `${header}export const freeExerciseDbPhotos: Record<string, string> = {\n${lines(result)}\n};\n\nexport const freeExerciseDbGroupFallbackPhotos: Record<string, string> = {\n${lines(fallbacks)}\n};\n\nexport const freeExerciseDbPhotoCoverage = { matched: ${Object.keys(result).length}, unmatched: ${JSON.stringify(unmatched)} } as const;\n`;
await fs.writeFile("lib/free-exercise-db-photos.ts", output);

if (writeReport) {
  console.log(report.map((row) => `${row.id.padEnd(24)} ${row.group.padEnd(8)} ${row.matched ? `${row.matched} [${row.score}]` : `НЕТ ФОТО (лучший кандидат: ${row.runnerUp})`}`).join("\n"));
}

let bundleSummary = null;
if (runBundle) {
  await fs.mkdir(photosDir, { recursive: true });
  const nativeLines = [];
  const webLines = [];
  let totalBytes = 0;
  for (const [id, url] of Object.entries(result)) {
    const targetPath = path.join(photosDir, `${id}.jpg`);
    const sourcePath = `${targetPath}.source`;
    await fs.writeFile(sourcePath, await downloadPhoto(url));
    const size = await optimizePhoto(sourcePath, targetPath);
    await fs.rm(sourcePath);
    totalBytes += size;
    nativeLines.push(`  ${JSON.stringify(id)}: require("../assets/exercise-photos/${id}.jpg"),`);
    webLines.push(`  ${JSON.stringify(id)}: ${JSON.stringify(url)},`);
  }
  const groupNativeLines = [];
  const groupWebLines = [];
  for (const [group, url] of Object.entries(fallbacks)) {
    const targetPath = path.join(photosDir, `group-${groupFileStem[group] ?? "misc"}.jpg`);
    const sourcePath = `${targetPath}.source`;
    await fs.writeFile(sourcePath, await downloadPhoto(url));
    const size = await optimizePhoto(sourcePath, targetPath);
    await fs.rm(sourcePath);
    totalBytes += size;
    groupNativeLines.push(`  ${JSON.stringify(group)}: require("../assets/exercise-photos/${path.basename(targetPath)}"),`);
    groupWebLines.push(`  ${JSON.stringify(group)}: ${JSON.stringify(url)},`);
  }
  const bundleHeader = `/**\n * Offline exercise photos bundled from yuhonas/free-exercise-db (Unlicense).\n * Generated by scripts/build-free-exercise-photo-map.mjs --bundle; do not edit by hand.\n */\n`;
  const fileNames = [
    ...Object.keys(result).map((id) => `${id}.jpg`),
    ...Object.keys(fallbacks).map((group) => `group-${groupFileStem[group] ?? "misc"}.jpg`),
  ];
  const nativeOutput = `${bundleHeader}export const bundledExercisePhotos: Record<string, number> = {\n${nativeLines.join("\n")}\n};\n\nexport const bundledExerciseGroupFallbackPhotos: Record<string, number> = {\n${groupNativeLines.join("\n")}\n};\n\nexport const bundledExercisePhotoFileNames: string[] = ${JSON.stringify(fileNames)};\n`;
  const webOutput = `${bundleHeader}export const bundledExercisePhotos: Record<string, string> = {\n${webLines.join("\n")}\n};\n\nexport const bundledExerciseGroupFallbackPhotos: Record<string, string> = {\n${groupWebLines.join("\n")}\n};\n\nexport const bundledExercisePhotoFileNames: string[] = ${JSON.stringify(fileNames)};\n`;
  await fs.writeFile("lib/bundled-exercise-photos.native.ts", nativeOutput);
  await fs.writeFile("lib/bundled-exercise-photos.ts", webOutput);
  // Drop stale asset files for ids that lost their photo (overrides/exclusions).
  const expectedFiles = new Set(fileNames);
  for (const file of await fs.readdir(photosDir)) {
    if (file.endsWith(".jpg") && !expectedFiles.has(file)) await fs.rm(path.join(photosDir, file));
  }
  bundleSummary = { files: fileNames.length, totalBytes, totalMb: Number((totalBytes / 1024 / 1024).toFixed(2)) };
}

const exclusionReasons = {
  "air-bike": "в датасете «Air Bike» — упражнение на пресс лёжа, машины в датасете нет",
  "side-plank": "Side Plank в датасете нет",
  "high-knees": "кандидат Knee Tuck Jump — прыжок с блином, не бег с высоким подъёмом колен",
  "neutral-pulldown": "кандидат V-Bar Pulldown — на кадре присед в раме",
  "landmine-chest-press": "лендмайна в датасете нет, кандидат Neck Press — жим лёжа",
  "cable-lateral-raise": "кандидат Cable Seated Lateral Raise — кадр читается как присед",
};

function buildReportMarkdown(report) {
  const lines = [];
  lines.push("# Маппинг упражнений на фото free-exercise-db");
  lines.push("");
  lines.push(`Сгенерировано scripts/build-free-exercise-photo-map.mjs (порог ${MATCH_THRESHOLD}; штрафы за лишние движения, несоответствие группы мышц и оборудования). Ручные переопределения и исключения — по итогам QA-просмотра контактных листов (утверждённый список правок).`);
  lines.push("");
  lines.push("| id | Группа | Фото в датасете | Счёт |");
  lines.push("|---|---|---|---|");
  for (const row of report) {
    const photo = row.matched ?? "— (офлайн-фото нет, сработает следующая ступень цепочки)";
    const score = row.matched ? (row.score == null ? "— (ручное)" : row.score) : "—";
    lines.push(`| ${row.id} | ${row.group} | ${photo} | ${score} |`);
  }
  const overridden = report.filter((row) => row.override);
  if (overridden.length) {
    lines.push("", "## Ручные переопределения (утверждённый список правок)", "");
    for (const row of overridden) lines.push(`- \`${row.id}\` → ${row.matched}`);
  }
  const excluded = report.filter((row) => row.excluded);
  if (excluded.length) {
    lines.push("", "## Без фото (неверное фото хуже отсутствующего)", "");
    for (const row of excluded) lines.push(`- ${row.id} — ${exclusionReasons[row.id] ?? "исключено вручную по итогам QA-просмотра"}`);
  }
  const noCandidate = report.filter((row) => !row.matched && !row.excluded);
  if (noCandidate.length) {
    lines.push("", "## Без фото (нет аналога в датасете)", "");
    for (const row of noCandidate) lines.push(`- ${row.id}`);
  }
  lines.push("", "## Сомнительные маппинги (проверить по контактным листам)", "");
  for (const note of [
    "- `box-step-cardio` → Box Jump (Multiple Response) — платформа, прыжок",
    "- `diamond-push-up` → Push-Ups - Close Triceps Position — узкий хват, не «алмаз»",
    "- `hanging-knee-raise` → Hanging Leg Raise — прямые ноги вместо коленей",
    "- `meadows-row` → One-Arm Long Bar Row — тяга Медоуза заменена одноручной тягой",
    "- `incline-walk` → Walking, Treadmill — ходьба по дорожке вместо горки",
    "- `bicycle-crunch` → Cross-Body Crunch — скручивание без «велосипеда»",
    "- `machine-low-row` → Seated Cable Rows — горизонтальная тяга блока",
    "- `triceps-kickback` → Tricep Dumbbell Kickback — ок по движению, проверьте позу",
    "- `landmine-press` → Barbell Shoulder Press — лендмайна в датасете нет",
  ]) lines.push(note);
  return `${lines.join("\n")}\n`;
}

const contactIndex = process.argv.indexOf("--contact");
if (contactIndex >= 0) {
  const contactDir = process.argv[contactIndex + 1];
  if (!contactDir) throw new Error("--contact requires a target directory");
  await fs.mkdir(contactDir, { recursive: true });
  await fs.writeFile(path.join(contactDir, "mapping-report.md"), buildReportMarkdown(report));
  const ids = Object.keys(result).sort();
  const tilesPerSheet = 48;
  let sheetIndex = 0;
  for (let offset = 0; offset < ids.length; offset += tilesPerSheet) {
    sheetIndex += 1;
    const slice = ids.slice(offset, offset + tilesPerSheet);
    const outputPath = path.join(contactDir, `contact-${sheetIndex}.png`);
    const args = ["-font", "DejaVu-Sans", "-label", "%t", "-tile", "8x6", "-geometry", "200x200+4+6", "-pointsize", "13"];
    args.push(...slice.map((id) => path.join(photosDir, `${id}.jpg`)), outputPath);
    execFileSync("montage", args);
  }
  console.log(`contact sheets: ${sheetIndex} -> ${path.join(contactDir, "contact-1..N.png")}`);
}

console.log(JSON.stringify({
  catalog: uniqueEntries.length,
  matched: Object.keys(result).length,
  unmatched,
  bundle: bundleSummary,
}, null, 2));
