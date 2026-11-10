// Английский словарь: собирается из тех же доменных словарей, что и русский.
// Набор ключей обязан совпадать — это гарантирует defineDomain в каждом
// домене и тест tests/i18n.test.ts.
import { DOMAINS } from "./domains";
import type { DictKey } from "./ru";

export const EN = Object.assign(
  {},
  ...DOMAINS.map((domain) => domain.en),
) as Record<DictKey, string>;
