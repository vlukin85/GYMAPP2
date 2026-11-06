import { describe, expect, it } from "vitest";
import { getExerciseIllustration } from "../lib/exercise-art";
import { exercises } from "../lib/workout-data";
import { expandedExercises } from "../lib/catalog-expansion";

const decode = (art: string) => decodeURIComponent(art.replace("data:image/svg+xml;utf8,", ""));

/** По одному id на каждую ветку композиции — с реалистичными группой и оборудованием. */
const compositionRepresentatives: { id: string; group: string; equipment: string }[] = [
  { id: "bench-press", group: "Грудь", equipment: "Штанга" },
  { id: "incline-db-press", group: "Грудь", equipment: "Гантели" },
  { id: "db-flat-press", group: "Грудь", equipment: "Гантели" },
  { id: "db-fly", group: "Грудь", equipment: "Гантели" },
  { id: "push-up", group: "Грудь", equipment: "Вес тела" },
  { id: "lat-pulldown", group: "Спина", equipment: "Тренажёр" },
  { id: "seated-cable-row", group: "Спина", equipment: "Тренажёр" },
  { id: "barbell-row", group: "Спина", equipment: "Штанга" },
  { id: "romanian-deadlift", group: "Ноги", equipment: "Штанга" },
  { id: "squat", group: "Ноги", equipment: "Штанга" },
  { id: "leg-press", group: "Ноги", equipment: "Тренажёр" },
  { id: "leg-curl", group: "Ноги", equipment: "Тренажёр" },
  { id: "calf-raise", group: "Ноги", equipment: "Тренажёр" },
  { id: "walking-lunge", group: "Ноги", equipment: "Гантели" },
  { id: "shoulder-press", group: "Плечи", equipment: "Гантели" },
  { id: "lateral-raise", group: "Плечи", equipment: "Гантели" },
  { id: "biceps-curl", group: "Бицепс", equipment: "Штанга" },
  { id: "triceps-pushdown", group: "Трицепс", equipment: "Тренажёр" },
  { id: "dips", group: "Грудь", equipment: "Вес тела" },
  { id: "plank", group: "Корпус", equipment: "Без оборудования" },
  { id: "cable-crunch", group: "Корпус", equipment: "Тренажёр" },
  { id: "treadmill", group: "Кардио", equipment: "Тренажёр" },
  { id: "rower", group: "Кардио", equipment: "Тренажёр" },
  { id: "pull-up", group: "Спина", equipment: "Вес тела" },
  { id: "exercise-bike", group: "Кардио", equipment: "Тренажёр" },
  { id: "jump-rope", group: "Кардио", equipment: "Скакалка" },
  { id: "hanging-leg-raise", group: "Корпус", equipment: "Вес тела" },
];

const expectValidSvg = (art: string) => {
  expect(art.startsWith("data:image/svg+xml;utf8,")).toBe(true);
  const svg = decode(art);
  expect(svg.startsWith("<svg")).toBe(true);
  expect(svg.endsWith("</svg>")).toBe(true);
  expect(svg).toContain('viewBox="0 0 240 240"');
  expect(svg).not.toMatch(/NaN|undefined|null/);
  return svg;
};

describe("exercise illustrations", () => {
  it("renders distinct illustrations for well-known exercises", () => {
    const ids = ["bench-press", "squat", "lat-pulldown", "plank", "treadmill", "biceps-curl"];
    const arts = ids.map((id) => getExerciseIllustration(id, "Грудь", "Штанга"));
    expect(new Set(arts).size).toBe(ids.length);
    arts.forEach(expectValidSvg);
  });

  it("covers every composition branch with a valid svg", () => {
    for (const { id, group, equipment } of compositionRepresentatives) {
      expectValidSvg(getExerciseIllustration(id, group, equipment));
    }
    // Каждая ветка даёт уникальную разметку — композиции не сводятся к одной картинке.
    const bodies = compositionRepresentatives.map(({ id, group, equipment }) => decode(getExerciseIllustration(id, group, equipment)));
    expect(new Set(bodies).size).toBe(compositionRepresentatives.length);
  });

  it("illustrates every catalog exercise without falling back", () => {
    const all = [...exercises, ...expandedExercises];
    const arts = all.map((exercise) => expectValidSvg(getExerciseIllustration(exercise.id, exercise.group, exercise.equipment)));
    expect(arts.length).toBeGreaterThanOrEqual(140);
    expect(new Set(arts).size).toBeGreaterThan(100);
  });

  it("falls back to a generic figure for custom exercise ids", () => {
    const svg = expectValidSvg(getExerciseIllustration("custom-2f8a41", "Спина", "Гантели"));
    expect(svg).toContain("<rect"); // маркировка оборудования гантелями из fallback-ветки
    const another = expectValidSvg(getExerciseIllustration("custom-9b77de", "Ноги", "Тренажёр"));
    expect(another).not.toBe(svg);
  });

  it("keeps colors deterministic for the same id", () => {
    expect(getExerciseIllustration("bench-press", "Грудь", "Штанга"))
      .toBe(getExerciseIllustration("bench-press", "Грудь", "Штанга"));
  });

  it("covers program covers with equipment-based compositions", () => {
    const strength = expectValidSvg(getExerciseIllustration("program-cover-strength", "Сила", "Штанга"));
    const cardio = expectValidSvg(getExerciseIllustration("program-cover-conditioning", "Выносливость", "Кардио"));
    expect(strength).not.toBe(cardio);
    expectValidSvg(getExerciseIllustration("program-some-uuid", "Программа тренировок", "План"));
  });
});
