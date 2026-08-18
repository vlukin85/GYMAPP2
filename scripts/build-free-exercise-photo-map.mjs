import fs from "node:fs/promises";

const dataUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const sourceUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main";
const sourceFiles = ["lib/workout-data.ts", "lib/catalog-expansion.ts"];
const synonym = {
  db: "dumbbell",
  dumbbells: "dumbbell",
  kettlebells: "kettlebell",
  pushup: "pushups",
  pushups: "pushup",
  pullup: "pullups",
  pullups: "pullup",
  rower: "rowing",
  curls: "curl",
  raises: "raise",
  extensions: "extension",
  press: "press",
  machine: "machine",
  cable: "cable",
  smith: "smith",
  barbell: "barbell",
  dumbbell: "dumbbell",
  squat: "squat",
  lunge: "lunge",
  deadlift: "deadlift",
};
const ignored = new Set(["single", "arm", "one", "flat", "wide", "neutral", "low", "high", "standing", "seated", "lying", "floor", "reverse", "weighted", "cardio", "outdoor", "power"]);

function tokens(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean).map((token) => synonym[token] ?? token).filter((token) => !ignored.has(token));
}

function score(id, candidate) {
  const wanted = new Set(tokens(id));
  const available = new Set(tokens(candidate.id));
  const common = [...wanted].filter((token) => available.has(token));
  if (!common.length) return 0;
  const coverage = common.length / Math.max(1, wanted.size);
  const precision = common.length / Math.max(1, available.size);
  return coverage * 5 + precision * 2 + (candidate.id.toLowerCase().includes(id.replace(/-/g, "_")) ? 3 : 0);
}

const catalogText = (await Promise.all(sourceFiles.map((file) => fs.readFile(file, "utf8")))).join("\n");
const ids = [...catalogText.matchAll(/(?:id:\s*|\[\s*)"([a-z0-9-]+)"/g)].map((match) => match[1]);
const uniqueIds = [...new Set(ids)].filter((id) => !id.includes("strength") && !id.includes("power") && !id.includes("full-body"));
const response = await fetch(dataUrl);
if (!response.ok) throw new Error(`Unable to fetch open exercise data: ${response.status}`);
const dataset = await response.json();

const result = {};
const unmatched = [];
for (const id of uniqueIds) {
  const matches = dataset
    .filter((exercise) => Array.isArray(exercise.images) && exercise.images[0])
    .map((exercise) => ({ exercise, score: score(id, exercise) }))
    .filter((item) => item.score >= 3.2)
    .sort((first, second) => second.score - first.score);
  const best = matches[0]?.exercise;
  if (!best) {
    unmatched.push(id);
    continue;
  }
  result[id] = `${sourceUrl}/exercises/${best.images[0]}`;
}

const output = `/**\n * Exercise photos from yuhonas/free-exercise-db (Unlicense).\n * Source: https://github.com/yuhonas/free-exercise-db\n * Generated deterministically from the local exercise identifiers.\n */\nexport const freeExerciseDbPhotos: Record<string, string> = ${JSON.stringify(result, null, 2)};\n\nexport const freeExerciseDbPhotoCoverage = { matched: ${Object.keys(result).length}, unmatched: ${JSON.stringify(unmatched)} } as const;\n`;
await fs.writeFile("lib/free-exercise-db-photos.ts", output);
console.log(JSON.stringify({ matched: Object.keys(result).length, unmatched }, null, 2));
