// Общие типы локализации. Отдельный файл, чтобы доменные словари
// (lib/i18n/domains/*.ts) не импортировали index.ts — иначе получается
// циклическая зависимость словарей и API.

/** Поддерживаемые языки приложения. */
export type Lang = "ru" | "en";

/** Язык по умолчанию: приложение исторически полностью на русском. */
export const DEFAULT_LANG: Lang = "ru";

/** Значения для подстановки в плейсхолдеры вида {name}. */
export type TranslateVars = Record<string, string | number>;

/**
 * Нормализация значения языка: "en" остаётся английским, всё остальное
 * (включая пустое значение и мусор в хранилище) — русский.
 */
export function normalizeLangValue(value: unknown): Lang {
  return value === "en" ? "en" : "ru";
}

/** Словарь одного языка: плоские ключи вида "settings.sectionTitle". */
export type Dict = Record<string, string>;

/** Доменный словарь: одинаковый набор ключей в русском и английском. */
export type DomainDict<K extends string = string> = {
  ru: Record<K, string>;
  en: Record<K, string>;
};

/**
 * Объявляет доменный словарь и проверяет на этапе компиляции, что наборы
 * ключей ru и en совпадают: пропущенный или лишний ключ в одном из языков —
 * ошибка TypeScript, а не пустая строка в интерфейсе.
 */
export function defineDomain<K extends string>(domain: {
  ru: Record<K, string>;
  en: Record<K, string>;
}): DomainDict<K> {
  return domain;
}
