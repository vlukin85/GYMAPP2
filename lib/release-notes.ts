export const CURRENT_RELEASE = {
  version: "1.0.3",
  previousVersion: "1.0.2",
  entries: [
    "Сканируйте неизвестный штрихкод: Open Food Facts подставит название и КБЖУ на 100 г, если продукт найден в открытой базе.",
    "Задавайте личные ежедневные цели калорий, белков, жиров и углеводов; следите за прогрессом прямо на главном экране.",
    "Открывайте недельный отчёт питания с графиками калорий и БЖУ за последние 7 дней.",
  ],
};

export function releaseNotesTitle(version: string) {
  return `Что нового в ${version}`;
}

export function shouldShowReleaseNotes(lastSeenVersion: string | null, currentVersion = CURRENT_RELEASE.version) {
  return lastSeenVersion !== currentVersion;
}
