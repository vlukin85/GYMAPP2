export const CURRENT_RELEASE = {
  version: "1.0.1",
  title: "Что нового в 1.0.1",
  entries: [
    "Загружайте свои изображения для упражнений и обложки программ.",
    "Выбирайте ранее созданные иллюстрации из встроенной медиатеки.",
    "Свайпайте календарь по месяцам, отслеживайте выполненные занятия и завершайте тренировки досрочно.",
  ],
};

export function shouldShowReleaseNotes(lastSeenVersion: string | null, currentVersion = CURRENT_RELEASE.version) {
  return lastSeenVersion !== currentVersion;
}
