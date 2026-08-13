export type MuscleGroup = "Грудь" | "Спина" | "Ноги" | "Плечи" | "Руки" | "Корпус" | "Кардио";

export type Exercise = {
  id: string;
  name: string;
  group: MuscleGroup;
  equipment: string;
  description: string;
  image: string;
  videoUrl: string;
  recordKg: number;
  recordReps: number;
};

export type ProgramExercise = {
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number;
};

export type WorkoutProgram = {
  id: string;
  name: string;
  description: string;
  exercises: ProgramExercise[];
};

export type ScheduledWorkout = {
  programId: string;
  time: string;
  reminderMinutes: number;
  notificationId?: string;
};

export type CompletedWorkout = {
  id: string;
  programId: string;
  date: string;
  durationMinutes: number;
  totalVolume: number;
};

export type ExerciseHistoryEntry = {
  date: string;
  sets: { weight: number; reps: number }[];
  volume: number;
  bestOneRepMax?: number;
};

export type OneRepMaxFormula = "epley" | "brzycki";

export type PersonalRecord = {
  exerciseId: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
  achievedAt: string;
};

export type BarbellProfile = {
  barWeightKg: number;
  availablePlatesKg: number[];
};

export const muscleGroups: MuscleGroup[] = ["Все" as MuscleGroup, "Грудь", "Спина", "Ноги", "Плечи", "Руки", "Корпус", "Кардио"];

const images = {
  benchPress: "/manus-storage/bench-press_66796a36.png",
  inclinePress: "/manus-storage/incline-db-press_49ef423f.png",
  latPulldown: "/manus-storage/lat-pulldown_eb6f38cd.png",
  barbellRow: "/manus-storage/barbell-row_36fa13b9.png",
  squat: "/manus-storage/squat_4d6ca0e2.png",
  legPress: "/manus-storage/leg-press_59116493.png",
  shoulderPress: "/manus-storage/shoulder-press_088f14dc.png",
  lateralRaise: "/manus-storage/lateral-raise_251ec658.png",
  bicepsCurl: "/manus-storage/biceps-curl_d8740daf.png",
  tricepsPushdown: "/manus-storage/triceps-pushdown_ec9f7117.png",
  plank: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
  treadmill: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80&sig=3",
  dumbbellRow: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
  romanianDeadlift: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
  walkingLunge: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80&sig=5",
  dips: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80",
  legCurl: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=900&q=80",
  calfRaise: "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=900&q=80",
  cableCrunch: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80",
  rower: "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=900&q=80",
};

export const exercises: Exercise[] = [
  { id: "bench-press", name: "Жим штанги лёжа", group: "Грудь", equipment: "Штанга", description: "Базовое упражнение для грудных мышц. Сводите лопатки, удерживайте стопы на полу и опускайте гриф к нижней части груди.", image: images.benchPress, videoUrl: "https://www.youtube.com/results?search_query=жим+штанги+лежа+техника", recordKg: 92.5, recordReps: 5 },
  { id: "incline-db-press", name: "Жим гантелей на наклонной", group: "Грудь", equipment: "Гантели", description: "Работает по верхней части груди. Двигайте гантели по естественной дуге и не разгибайте локти до щелчка.", image: images.inclinePress, videoUrl: "https://www.youtube.com/results?search_query=жим+гантелей+на+наклонной+скамье", recordKg: 34, recordReps: 8 },
  { id: "lat-pulldown", name: "Тяга верхнего блока", group: "Спина", equipment: "Тренажёр", description: "Тяните рукоять к верхней части груди, направляя локти вниз. Не раскачивайте корпус.", image: images.latPulldown, videoUrl: "https://www.youtube.com/results?search_query=тяга+верхнего+блока+техника", recordKg: 70, recordReps: 8 },
  { id: "barbell-row", name: "Тяга штанги в наклоне", group: "Спина", equipment: "Штанга", description: "Сохраняйте нейтральную спину, подтягивайте гриф к поясу и контролируйте опускание.", image: images.barbellRow, videoUrl: "https://www.youtube.com/results?search_query=тяга+штанги+в+наклоне+техника", recordKg: 85, recordReps: 6 },
  { id: "squat", name: "Приседания со штангой", group: "Ноги", equipment: "Штанга", description: "Опускайтесь до комфортной глубины, держите колени по направлению носков и сохраняйте напряжение корпуса.", image: images.squat, videoUrl: "https://www.youtube.com/results?search_query=приседания+со+штангой+техника", recordKg: 120, recordReps: 4 },
  { id: "leg-press", name: "Жим ногами", group: "Ноги", equipment: "Тренажёр", description: "Плотно прижмите таз к спинке и не блокируйте колени в верхней точке.", image: images.legPress, videoUrl: "https://www.youtube.com/results?search_query=жим+ногами+техника", recordKg: 210, recordReps: 8 },
  { id: "shoulder-press", name: "Жим гантелей сидя", group: "Плечи", equipment: "Гантели", description: "Начинайте движение от уровня ушей, держите запястья над локтями и не прогибайтесь в пояснице.", image: images.shoulderPress, videoUrl: "https://www.youtube.com/results?search_query=жим+гантелей+сидя+техника", recordKg: 26, recordReps: 8 },
  { id: "lateral-raise", name: "Разведения гантелей в стороны", group: "Плечи", equipment: "Гантели", description: "Поднимайте руки до уровня плеч с мягким локтем, не используя инерцию.", image: images.lateralRaise, videoUrl: "https://www.youtube.com/results?search_query=разведения+гантелей+в+стороны", recordKg: 12, recordReps: 12 },
  { id: "biceps-curl", name: "Сгибания рук со штангой", group: "Руки", equipment: "Штанга", description: "Зафиксируйте локти возле корпуса и поднимайте вес без раскачивания плечами.", image: images.bicepsCurl, videoUrl: "https://www.youtube.com/results?search_query=сгибания+рук+со+штангой", recordKg: 42.5, recordReps: 8 },
  { id: "triceps-pushdown", name: "Разгибания на блоке", group: "Руки", equipment: "Тренажёр", description: "Прижмите локти к корпусу и полностью разгибайте руки, сохраняя плечи неподвижными.", image: images.tricepsPushdown, videoUrl: "https://www.youtube.com/results?search_query=разгибания+рук+на+верхнем+блоке", recordKg: 45, recordReps: 10 },
  { id: "plank", name: "Планка на локтях", group: "Корпус", equipment: "Без оборудования", description: "Создайте прямую линию от плеч до пяток, напрягите пресс и спокойно дышите.", image: images.plank, videoUrl: "https://www.youtube.com/results?search_query=планка+на+локтях+техника", recordKg: 0, recordReps: 90 },
  { id: "treadmill", name: "Беговая дорожка", group: "Кардио", equipment: "Тренажёр", description: "Начните с лёгкой ходьбы, постепенно увеличьте темп и завершите заминкой.", image: images.treadmill, videoUrl: "https://www.youtube.com/results?search_query=беговая+дорожка+техника", recordKg: 0, recordReps: 25 },
  { id: "dumbbell-row", name: "Тяга гантели к поясу", group: "Спина", equipment: "Гантели", description: "Упритесь свободной рукой в скамью, тяните локоть к тазу и не разворачивайте плечо.", image: images.dumbbellRow, videoUrl: "https://www.youtube.com/results?search_query=тяга+гантели+к+поясу+техника", recordKg: 36, recordReps: 10 },
  { id: "romanian-deadlift", name: "Румынская тяга", group: "Ноги", equipment: "Штанга", description: "Отводите таз назад, держите гриф близко к ногам и сохраняйте нейтральную спину.", image: images.romanianDeadlift, videoUrl: "https://www.youtube.com/results?search_query=румынская+тяга+техника", recordKg: 100, recordReps: 8 },
  { id: "walking-lunge", name: "Выпады с гантелями", group: "Ноги", equipment: "Гантели", description: "Делайте контролируемый шаг, опускайте заднее колено к полу и сохраняйте корпус устойчивым.", image: images.walkingLunge, videoUrl: "https://www.youtube.com/results?search_query=выпады+с+гантелями+техника", recordKg: 22, recordReps: 12 },
  { id: "dips", name: "Отжимания на брусьях", group: "Грудь", equipment: "Вес тела", description: "Опускайтесь контролируемо, слегка наклоняйте корпус вперёд и не проваливайтесь в плечах.", image: images.dips, videoUrl: "https://www.youtube.com/results?search_query=отжимания+на+брусьях+техника", recordKg: 0, recordReps: 12 },
  { id: "leg-curl", name: "Сгибания ног в тренажёре", group: "Ноги", equipment: "Тренажёр", description: "Фиксируйте таз, сгибайте ноги плавно и задерживайтесь в точке сокращения.", image: images.legCurl, videoUrl: "https://www.youtube.com/results?search_query=сгибание+ног+в+тренажере+техника", recordKg: 55, recordReps: 12 },
  { id: "calf-raise", name: "Подъёмы на носки стоя", group: "Ноги", equipment: "Тренажёр", description: "Опускайте пятки до растяжения и поднимайтесь на носки с полной амплитудой.", image: images.calfRaise, videoUrl: "https://www.youtube.com/results?search_query=подъем+на+носки+стоя+техника", recordKg: 80, recordReps: 15 },
  { id: "cable-crunch", name: "Скручивания на верхнем блоке", group: "Корпус", equipment: "Тренажёр", description: "Скручивайте корпус за счёт пресса, не тяните рукоять руками и не округляйте поясницу чрезмерно.", image: images.cableCrunch, videoUrl: "https://www.youtube.com/results?search_query=скручивания+на+верхнем+блоке+техника", recordKg: 42, recordReps: 12 },
  { id: "rower", name: "Гребной тренажёр", group: "Кардио", equipment: "Тренажёр", description: "Отталкивайтесь ногами, затем подключайте корпус и руки; возвращайтесь в обратном порядке.", image: images.rower, videoUrl: "https://www.youtube.com/results?search_query=гребной+тренажер+техника", recordKg: 0, recordReps: 20 },
];

export const defaultPrograms: WorkoutProgram[] = [
  { id: "upper-strength", name: "Верх тела · Сила", description: "Грудь, спина и плечи", exercises: [
    { exerciseId: "bench-press", sets: 4, reps: 6, weight: 80, rest: 120 },
    { exerciseId: "barbell-row", sets: 4, reps: 6, weight: 70, rest: 120 },
    { exerciseId: "shoulder-press", sets: 3, reps: 8, weight: 22, rest: 90 },
  ] },
  { id: "leg-day", name: "Ноги · Объём", description: "Сила и выносливость ног", exercises: [
    { exerciseId: "squat", sets: 4, reps: 8, weight: 90, rest: 150 },
    { exerciseId: "leg-press", sets: 3, reps: 10, weight: 160, rest: 120 },
  ] },
];

export const completedWorkouts: CompletedWorkout[] = [
  { id: "w1", programId: "upper-strength", date: "2026-08-10", durationMinutes: 52, totalVolume: 4860 },
  { id: "w2", programId: "leg-day", date: "2026-08-08", durationMinutes: 61, totalVolume: 8520 },
  { id: "w3", programId: "upper-strength", date: "2026-08-05", durationMinutes: 49, totalVolume: 4520 },
];

export const exerciseHistory: Record<string, ExerciseHistoryEntry[]> = {
  "bench-press": [
    { date: "10 авг", sets: [{ weight: 80, reps: 6 }, { weight: 80, reps: 6 }, { weight: 77.5, reps: 6 }, { weight: 77.5, reps: 5 }], volume: 1875 },
    { date: "05 авг", sets: [{ weight: 77.5, reps: 6 }, { weight: 77.5, reps: 6 }, { weight: 75, reps: 7 }], volume: 1470 },
    { date: "01 авг", sets: [{ weight: 75, reps: 8 }, { weight: 75, reps: 8 }, { weight: 75, reps: 7 }], volume: 1725 },
  ],
  "barbell-row": [
    { date: "10 авг", sets: [{ weight: 70, reps: 6 }, { weight: 70, reps: 6 }, { weight: 67.5, reps: 6 }], volume: 1245 },
    { date: "05 авг", sets: [{ weight: 67.5, reps: 8 }, { weight: 67.5, reps: 7 }, { weight: 65, reps: 8 }], volume: 1540 },
  ],
  "shoulder-press": [
    { date: "10 авг", sets: [{ weight: 22, reps: 8 }, { weight: 22, reps: 8 }, { weight: 20, reps: 9 }], volume: 512 },
    { date: "03 авг", sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 9 }, { weight: 18, reps: 10 }], volume: 560 },
  ],
  "squat": [
    { date: "08 авг", sets: [{ weight: 90, reps: 8 }, { weight: 90, reps: 8 }, { weight: 87.5, reps: 8 }, { weight: 85, reps: 8 }], volume: 2820 },
    { date: "01 авг", sets: [{ weight: 85, reps: 8 }, { weight: 85, reps: 8 }, { weight: 82.5, reps: 8 }], volume: 2020 },
  ],
  "leg-press": [
    { date: "08 авг", sets: [{ weight: 160, reps: 10 }, { weight: 160, reps: 10 }, { weight: 150, reps: 10 }], volume: 4700 },
  ],
};

export function getExerciseHistory(id: string) { return exerciseHistory[id] ?? []; }

export function getExercise(id: string) { return exercises.find((exercise) => exercise.id === id); }
export function getProgram(id: string) { return defaultPrograms.find((program) => program.id === id); }
export function calculateVolume(weight: number, reps: number, sets: number) { return weight * reps * sets; }

/** Estimated one-repetition maximum using Epley or Brzycki. */
export function estimateOneRepMax(weight: number, reps: number, formula: OneRepMaxFormula = "epley") {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  const cappedReps = Math.min(reps, 30);
  return formula === "brzycki"
    ? weight * (36 / (37 - cappedReps))
    : weight * (1 + cappedReps / 30);
}

export function bestOneRepMax(sets: { weight: number; reps: number }[], formula: OneRepMaxFormula = "epley") {
  return Math.max(0, ...sets.map((set) => estimateOneRepMax(set.weight, set.reps, formula)));
}

export function getLoadZones(oneRepMax: number) {
  return [70, 80, 90].map((percent) => ({ percent, weight: oneRepMax * (percent / 100) }));
}

export function roundToWeightIncrement(weight: number, increment: number) {
  if (weight <= 0 || increment <= 0) return 0;
  return Math.round(weight / increment) * increment;
}

export function calculateBarbellPlateLayout(targetWeightKg: number, profile: BarbellProfile) {
  let remaining = Math.max(0, Math.round(((targetWeightKg - profile.barWeightKg) / 2) * 100) / 100);
  const perSide: number[] = [];
  const plates = [...profile.availablePlatesKg].filter((plate) => plate > 0).sort((a, b) => b - a);
  for (const plate of plates) {
    while (remaining + 0.001 >= plate) {
      perSide.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
  }
  const loadedWeightKg = profile.barWeightKg + perSide.reduce((sum, plate) => sum + plate * 2, 0);
  return { targetWeightKg, loadedWeightKg, perSide, differenceKg: Math.round((targetWeightKg - loadedWeightKg) * 100) / 100 };
}

export function formatPlateLayout(perSide: number[]) {
  if (perSide.length === 0) return "без блинов";
  const counts = perSide.reduce<Record<string, number>>((acc, plate) => { const key = String(plate); acc[key] = (acc[key] ?? 0) + 1; return acc; }, {});
  return Object.entries(counts).sort(([a], [b]) => Number(b) - Number(a)).map(([plate, count]) => count > 1 ? `${count}×${plate}` : plate).join(" + ");
}

export function recommendWorkingWeight(input: { history: ExerciseHistoryEntry[]; targetReps: number; incrementKg: number; formula?: OneRepMaxFormula }) {
  const latest = input.history[0];
  if (!latest?.sets.length) return { weightKg: 0, changeKg: 0, reason: "Сначала зафиксируй первое выполнение" };
  const bestSet = latest.sets.reduce((best, set) => set.weight * set.reps > best.weight * best.reps ? set : best, latest.sets[0]);
  const estimatedOneRm = bestOneRepMax(latest.sets, input.formula);
  const baseWeight = bestSet.reps >= input.targetReps + 2 ? bestSet.weight * 1.025 : bestSet.reps < input.targetReps ? bestSet.weight * 0.975 : bestSet.weight;
  const strengthCap = estimatedOneRm * 0.85;
  const weightKg = roundToWeightIncrement(Math.min(baseWeight, strengthCap), input.incrementKg);
  const changeKg = Math.round((weightKg - bestSet.weight) * 100) / 100;
  const reason = changeKg > 0 ? `последний лучший подход ${bestSet.weight} кг × ${bestSet.reps}; можно повысить нагрузку` : changeKg < 0 ? `последний подход ${bestSet.weight} кг × ${bestSet.reps}; лучше закрепить технику` : `последний подход ${bestSet.weight} кг × ${bestSet.reps}; повтори рабочий вес`;
  return { weightKg, changeKg, reason };
}
export function formatDuration(minutes: number) { return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`; }

export function getMonthCalendarDays(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; });
}

export function getReminderTriggerDate(date: string, time: string, reminderMinutes: number) {
  const start = new Date(`${date}T${time}:00`);
  return new Date(start.getTime() - reminderMinutes * 60_000);
}
