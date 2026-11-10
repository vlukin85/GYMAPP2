// Русский словарь: собирается из всех доменных словарей реестра.
// Ключи берутся как есть — набор совпадает с английским (проверяется
// defineDomain в каждом домене).
import { DOMAINS } from "./domains";

/** Ключи одного домена; распределяется по объединению доменов реестра. */
type UnionKeys<T> = T extends unknown ? keyof T : never;

/**
 * Полный набор ключей всех доменов — тип для t() и доменных словарей.
 * Важно: keyof по объединению словарей даёт их пересечение (то есть never при
 * нескольких доменах с разными ключами), поэтому ключи собираются распределённо.
 */
export type DictKey = Extract<UnionKeys<(typeof DOMAINS)[number]["ru"]>, string>;

export const RU = Object.assign(
  {},
  ...DOMAINS.map((domain) => domain.ru),
) as Record<DictKey, string>;
