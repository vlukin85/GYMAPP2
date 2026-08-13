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

export type CompletedWorkout = {
  id: string;
  programId: string;
  date: string;
  durationMinutes: number;
  totalVolume: number;
};

export const muscleGroups: MuscleGroup[] = ["Все" as MuscleGroup, "Грудь", "Спина", "Ноги", "Плечи", "Руки", "Корпус", "Кардио"];

const images = {
  chest: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80",
  back: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
  legs: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=900&q=80",
  shoulders: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
  arms: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=900&q=80",
  core: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
  cardio: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80",
};

export const exercises: Exercise[] = [
  { id: "bench-press", name: "Жим штанги лёжа", group: "Грудь", equipment: "Штанга", description: "Базовое упражнение для грудных мышц. Сводите лопатки, удерживайте стопы на полу и опускайте гриф к нижней части груди.", image: images.chest, videoUrl: "https://www.youtube.com/results?search_query=жим+штанги+лежа+техника", recordKg: 92.5, recordReps: 5 },
  { id: "incline-db-press", name: "Жим гантелей на наклонной", group: "Грудь", equipment: "Гантели", description: "Работает по верхней части груди. Двигайте гантели по естественной дуге и не разгибайте локти до щелчка.", image: images.chest, videoUrl: "https://www.youtube.com/results?search_query=жим+гантелей+на+наклонной+скамье", recordKg: 34, recordReps: 8 },
  { id: "lat-pulldown", name: "Тяга верхнего блока", group: "Спина", equipment: "Тренажёр", description: "Тяните рукоять к верхней части груди, направляя локти вниз. Не раскачивайте корпус.", image: images.back, videoUrl: "https://www.youtube.com/results?search_query=тяга+верхнего+блока+техника", recordKg: 70, recordReps: 8 },
  { id: "barbell-row", name: "Тяга штанги в наклоне", group: "Спина", equipment: "Штанга", description: "Сохраняйте нейтральную спину, подтягивайте гриф к поясу и контролируйте опускание.", image: images.back, videoUrl: "https://www.youtube.com/results?search_query=тяга+штанги+в+наклоне+техника", recordKg: 85, recordReps: 6 },
  { id: "squat", name: "Приседания со штангой", group: "Ноги", equipment: "Штанга", description: "Опускайтесь до комфортной глубины, держите колени по направлению носков и сохраняйте напряжение корпуса.", image: images.legs, videoUrl: "https://www.youtube.com/results?search_query=приседания+со+штангой+техника", recordKg: 120, recordReps: 4 },
  { id: "leg-press", name: "Жим ногами", group: "Ноги", equipment: "Тренажёр", description: "Плотно прижмите таз к спинке и не блокируйте колени в верхней точке.", image: images.legs, videoUrl: "https://www.youtube.com/results?search_query=жим+ногами+техника", recordKg: 210, recordReps: 8 },
  { id: "shoulder-press", name: "Жим гантелей сидя", group: "Плечи", equipment: "Гантели", description: "Начинайте движение от уровня ушей, держите запястья над локтями и не прогибайтесь в пояснице.", image: images.shoulders, videoUrl: "https://www.youtube.com/results?search_query=жим+гантелей+сидя+техника", recordKg: 26, recordReps: 8 },
  { id: "lateral-raise", name: "Разведения гантелей в стороны", group: "Плечи", equipment: "Гантели", description: "Поднимайте руки до уровня плеч с мягким локтем, не используя инерцию.", image: images.shoulders, videoUrl: "https://www.youtube.com/results?search_query=разведения+гантелей+в+стороны", recordKg: 12, recordReps: 12 },
  { id: "biceps-curl", name: "Сгибания рук со штангой", group: "Руки", equipment: "Штанга", description: "Зафиксируйте локти возле корпуса и поднимайте вес без раскачивания плечами.", image: images.arms, videoUrl: "https://www.youtube.com/results?search_query=сгибания+рук+со+штангой", recordKg: 42.5, recordReps: 8 },
  { id: "triceps-pushdown", name: "Разгибания на блоке", group: "Руки", equipment: "Тренажёр", description: "Прижмите локти к корпусу и полностью разгибайте руки, сохраняя плечи неподвижными.", image: images.arms, videoUrl: "https://www.youtube.com/results?search_query=разгибания+рук+на+верхнем+блоке", recordKg: 45, recordReps: 10 },
  { id: "plank", name: "Планка на локтях", group: "Корпус", equipment: "Без оборудования", description: "Создайте прямую линию от плеч до пяток, напрягите пресс и спокойно дышите.", image: images.core, videoUrl: "https://www.youtube.com/results?search_query=планка+на+локтях+техника", recordKg: 0, recordReps: 90 },
  { id: "treadmill", name: "Беговая дорожка", group: "Кардио", equipment: "Тренажёр", description: "Начните с лёгкой ходьбы, постепенно увеличьте темп и завершите заминкой.", image: images.cardio, videoUrl: "https://www.youtube.com/results?search_query=беговая+дорожка+техника", recordKg: 0, recordReps: 25 },
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

export function getExercise(id: string) { return exercises.find((exercise) => exercise.id === id); }
export function getProgram(id: string) { return defaultPrograms.find((program) => program.id === id); }
export function calculateVolume(weight: number, reps: number, sets: number) { return weight * reps * sets; }
export function formatDuration(minutes: number) { return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`; }
