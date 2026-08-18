export type CatalogFilterExercise = { id: string; name: string; group: string; equipment: string };

/** Filters the local exercise catalogue by a muscle group and a case-insensitive name/equipment query. */
export function filterActiveWorkoutCatalog<T extends CatalogFilterExercise>(items: T[], group: string, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
  return items.filter((item) => {
    const matchesGroup = group === "Все" || item.group === group;
    const searchable = `${item.name} ${item.equipment}`.toLocaleLowerCase("ru-RU");
    return matchesGroup && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

/** Moves one exercise to a new position without mutating the active workout list. */
export function reorderActiveWorkoutExercises<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
