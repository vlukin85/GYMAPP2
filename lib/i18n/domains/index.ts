// Реестр доменных словарей — ЕДИНСТВЕННОЕ место регистрации.
//
// Чтобы добавить новый домен локализации:
//   1. создайте lib/i18n/domains/<домен>.ts через defineDomain({ ru, en });
//   2. добавьте одну строку импорта и одну строку в DOMAINS ниже.
// Больше нигде править не нужно: lib/i18n/ru.ts и lib/i18n/en.ts собирают
// словари из этого реестра, а index.ts выводит из них тип ключей.
import { settings } from "./settings";
import { catalog } from "./catalog";
import { programs } from "./programs";
import { transfer } from "./transfer";
import { tabs } from "./tabs";
import { stats } from "./stats";
import { calendar } from "./calendar";
import { body } from "./body";
import { nutrition } from "./nutrition";
import { workout } from "./workout";
import { common } from "./common";
import { workoutServices } from "./workout-services";

export const DOMAINS = [
  settings,
  catalog,
  programs,
  transfer,
  tabs,
  stats,
  calendar,
  body,
  nutrition,
  workout,
  common,
  workoutServices,
] as const;
