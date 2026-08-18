import { describe, expect, it } from "vitest";
import { filterActiveWorkoutCatalog, reorderActiveWorkoutExercises } from "../lib/active-workout-utils";

describe("каталог для активной тренировки", () => {
  const catalogue = [
    { id: "bench", name: "Жим лёжа", group: "Грудь", equipment: "Штанга" },
    { id: "pull", name: "Тяга верхнего блока", group: "Спина", equipment: "Блочный тренажёр" },
    { id: "fly", name: "Сведение рук", group: "Грудь", equipment: "Тренажёр" },
  ];

  it("сочетает поиск по названию с фильтрацией по группе", () => {
    expect(filterActiveWorkoutCatalog(catalogue, "Грудь", "жим").map((item) => item.id)).toEqual(["bench"]);
  });

  it("ищет по оборудованию и поддерживает группу Все", () => {
    expect(filterActiveWorkoutCatalog(catalogue, "Все", "блочный").map((item) => item.id)).toEqual(["pull"]);
  });

  it("перемещает упражнение в новый индекс без изменения исходного списка", () => {
    const items = ["bench", "pull", "squat"];
    expect(reorderActiveWorkoutExercises(items, 2, 0)).toEqual(["squat", "bench", "pull"]);
    expect(items).toEqual(["bench", "pull", "squat"]);
  });
});
