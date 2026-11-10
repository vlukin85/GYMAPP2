# Локализация IronRise (RU/EN)

Инфраструктура рассчитана на параллельную работу нескольких агентов/разработчиков:
каждый домен (экран или группа экранов) живёт в своём файле словаря, поэтому
никто не правит чужие строки.

## Состав

| Файл                               | Что делает                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `lib/i18n/types.ts`                | `Lang`, `DEFAULT_LANG`, `DomainDict`, `defineDomain` — общие типы без циклических зависимостей                  |
| `lib/i18n/domains/<домен>.ts`      | Словарь домена: `defineDomain({ ru, en })`, одинаковый набор ключей в обоих языках                              |
| `lib/i18n/domains/index.ts`        | **Реестр доменов** — единственное место регистрации                                                             |
| `lib/i18n/ru.ts`, `lib/i18n/en.ts` | Агрегаторы: склеивают словари всех доменов реестра                                                              |
| `lib/i18n/index.ts`                | Публичный API: `t`, `getT`, `translate`, `loadAppLanguage`/`saveAppLanguage`, `LanguageProvider`, `useLanguage` |

## Готовые домены и их зона

| Домен      | Где используется                                                                                                                                                                                                 | Владелец зоны                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `settings` | `app/settings.tsx` и связанные с настройками карточки                                                                                                                                                            | экран настроек                    |
| `workout`  | `app/workout.tsx`, `app/workout-summary.tsx`, `app/share-workout.tsx`, `app/compare.tsx`, `app/progress.tsx`, `app/report.tsx`, `app/barbell.tsx`, `app/workout-history/*`, `lib/workout-notifications.ts` (fallback-тексты Expo-уведомлений) | тренировка, итоги, история        |
| `common`   | Подписи из общих структур: `MAIN_TABS` (`lib/main-tab-preferences.ts`), `HOME_WIDGETS` (`lib/home-widgets.tsx`), `APP_COLOR_THEMES` (`lib/app-color-themes.ts`); единицы длительности и тексты общих шторок изображений | данные для главного, настроек и общих шторок |

Остальные домены (`catalog`, `programs`, `transfer`, `tabs`, `stats`, `calendar`,
`body`, `nutrition`) заводят и наполняют агенты своих экранов.

### Домен `common`: переведённые данные, а не экраны

`MAIN_TABS`, `HOME_WIDGETS` и `APP_COLOR_THEMES` — это данные, которые читают
сразу несколько экранов (нижняя панель, экран «Сегодня», настройки). Поэтому
перевод лежит не в экранах, а рядом с данными: у каждого элемента есть поле с
ключом словаря, а русский текст оставлен для совместимости.

```ts
// lib/main-tab-preferences.ts
{ id: "today", title: "ГЛАВНОЕ", titleKey: "common.tab.today.title", ... }

// lib/home-widgets.tsx
{ id: "quote", title: "Цитата дня", titleKey: "common.widget.quote.title", ... }

// lib/app-color-themes.ts
{ id: "editorial", title: "IronRise Editorial", titleKey: "common.theme.editorial.title", ... }
```

Экран показывает `t(item.titleKey)` (для вкладок — ещё `t(item.settingsTitleKey)`
и `t(item.descriptionKey)`, для виджетов — `t(item.descriptionKey)`, для тем —
`t(item.hintKey)`). Русские поля `title`/`settingsTitle`/`description`/`hint`
не удалены: пока экран не переведён, он читает их, и ничего не ломается.

### Названия упражнений и программ — это данные, а не словарь

Названия 140 упражнений (`lib/workout-data.ts` + `lib/catalog-expansion.ts`) и
15 дефолтных программ живут в данных полем `nameEn?: string`, описания
программ — полем `descriptionEn?: string`:

```tsx
const name = lang === "en" ? (item.nameEn ?? item.name) : item.name;
```

В словарь их не переносим: упражнение — это запись каталога, у неё есть id,
фото и история, и название должно ехать вместе с записью. В домене `workout`
лежат только подписи интерфейса.

Описание программы выбирается хелпером `programDescription(program, lang)` из
`lib/workout-data.ts`; своя программа пользователя без перевода показывает
русское описание. Там же живут форматтеры с необязательным языком:
`formatProgramCreatedAt(createdAt, lang)`, `formatDuration(minutes, lang)` и
`formatProgramDuration(seconds, lang)` — без аргумента они возвращают прежний
русский текст.

## Как добавить новый домен — по шагам

1. Создайте файл `lib/i18n/domains/<домен>.ts`:

   ```ts
   import { defineDomain } from "../types";

   export const profile = defineDomain({
     ru: {
       "profile.headerTitle": "Профиль",
       "profile.rowsCount": "Записей: {count}",
     },
     en: {
       "profile.headerTitle": "Profile",
       "profile.rowsCount": "Records: {count}",
     },
   });
   ```

   Правила:
   - ключи плоские, с префиксом домена: `"<домен>.<смысл>"`;
   - набор ключей `ru` и `en` обязан совпадать — `defineDomain` проверяет это
     на этапе компиляции (пропущенный ключ = ошибка TypeScript);
   - плейсхолдеры — `{name}`, значения подставляются через `t("ключ", { name })`;
   - домен не импортирует `lib/i18n/index.ts` — иначе циклическая зависимость.

2. Зарегистрируйте домен в `lib/i18n/domains/index.ts` — две строки:

   ```ts
   import { profile } from "./profile";

   export const DOMAINS = [settings, profile] as const;
   ```

3. Больше ничего править не нужно: `ru.ts`/`en.ts` подхватят домен сами, а тип
   `DictKey` пополнится его ключами (ошибки компиляции покажут опечатки в `t()`).

4. В экране используйте хук:

   ```tsx
   import { useLanguage } from "@/lib/i18n";

   export default function Screen() {
     const { lang, setLang, t } = useLanguage();
     return <Text>{t("profile.headerTitle")}</Text>;
   }
   ```

5. Вне React-компонентов (сервисы, уведомления, обработчики):

   ```ts
   import { getT, t } from "@/lib/i18n";
   const translate = getT("en"); // переводчик под конкретный язык
   const current = t("profile.headerTitle"); // текущий язык приложения
   ```

## Поведение

- Язык по умолчанию — русский (`DEFAULT_LANG = "ru"`).
- Выбор хранится в AsyncStorage под ключом `ironrise.app-language.v1`
  (`APP_LANGUAGE_STORAGE_KEY`); `loadAppLanguage()`/`saveAppLanguage()`
  нормализуют значение: всё, что не `"en"`, считается русским.
- `LanguageProvider` монтируется в `app/_layout.tsx` поверх дерева экранов и
  читает сохранённый выбор при старте. `setLang` применяет язык мгновенно ко
  всем экранам и сохраняет его на устройстве.
- Английский словарь — с откатом на русский: если ключ вдруг отсутствует в `en`,
  `t()` вернёт русский текст, а не пустую строку.
- Даты и поиск форматируются по выбранному языку: в экранах берите
  `const locale = lang === "en" ? "en-US" : "ru-RU"` вместо жёсткого `"ru-RU"`.

## Чего не делать

- Не редактируйте словари других доменов — это чужая зона ответственности.
- Не добавляйте строки в `ru.ts`/`en.ts` руками: они собираются из реестра.
- Не заводите второй провайдер языка и не дублируйте `useLanguage`.
- Не удаляйте ключ из одного языка: удаляйте из обоих (или оставьте — тест
  `tests/i18n.test.ts` проверяет совпадение наборов ключей).

## Проверки

- `pnpm run check` — типы, в том числе полнота `Record<DictKey, string>`.
- `pnpm vitest run tests/i18n.test.ts` — дефолт, сохранение, плейсхолдеры,
  совпадение наборов ключей RU/EN, доставка языка в нативные уведомления.

## Домены проекта

| Домен          | Файл                        | Экраны                                                        |
| -------------- | --------------------------- | ------------------------------------------------------------- |
| `settings`     | `domains/settings.ts`       | `app/settings.tsx`                                             |
| `tabs`         | `domains/tabs.ts`           | главный экран «Сегодня»                                        |
| `catalog`      | `domains/catalog.ts`        | каталог упражнений, `app/exercise/[id].tsx`, `app/replace-exercise.tsx` |
| `programs`     | `domains/programs.ts`       | программы, `app/program/new.tsx`, `app/program/ai.tsx`, `app/recommendations.tsx` |
| `stats`        | `domains/stats.ts`          | статистика и её виджеты                                        |
| `calendar`     | `domains/calendar.ts`       | планер тренировок                                              |
| `body`         | `domains/body.ts`           | вкладка «Тело», замеры и фотографии прогресса                  |
| `nutrition`    | `domains/nutrition.ts`      | питание, `app/nutrition-import.tsx`, `app/nutrition-report.tsx` |
| `transfer`     | `domains/transfer.ts`       | `app/export.tsx`, `app/import.tsx` (CSV-обмен историей)        |
| `workout`      | `domains/workout.ts`        | активная тренировка, итоги, публикация                         |
| `common`       | `domains/common.ts`         | общие данные: вкладки, виджеты, темы; единицы длительности; шторки выбора и кадрирования изображения |
| `workoutServices` | `domains/workout-services.ts` | сервисные модули: PNG-карточка, PDF-отчёт, пост в соцсети, темп кардио, статусы Health Connect |

### Домен `workoutServices`: тексты сервисных модулей

Часть подписей живёт не в экранах, а в сервисных модулях `lib/*` и в
`components/workout-share-card.tsx`, и попадает в интерфейс как результат их
работы. Их тексты собраны в один домен, а язык у этих API — **необязательный
параметр** `lang` с дефолтом `"ru"`, поэтому вызовы без него дают прежний
русский текст:

| Модуль                              | Как передаётся язык                              |
| ----------------------------------- | ------------------------------------------------ |
| `components/workout-share-card.tsx` | пропс `lang`                                     |
| `lib/monthly-report.ts`             | `buildMonthlyReportHtml(rows, month, lang)`       |
| `lib/workout-achievements.ts`       | поле `lang` в объекте входа                       |
| `lib/cardio-metrics.ts`             | `formatCardioPace(pace, lang)`, `getWeeklyCardioMinutes(…, lang)` |
| `lib/health-connect.ts`             | `getHealthConnectStatus(lang)` и `connectHealthConnect*` |
| `lib/heart-rate-analysis.ts`        | `heartRateZoneLabel(id, lang)`                    |

Названия зон пульса (`workout.summary.zone*`) в этом домене не дублируются:
зоны сохраняются в завершённой тренировке, поэтому `label` в `HEART_RATE_ZONES`
остаётся языконезависимым, а перевод берётся `heartRateZoneLabel()` при показе.

### Общие шторки изображений: язык — пропс, а не глобальное состояние

Шторка выбора изображения и шторка кадрирования открываются с разных экранов
(обложка программы, фото упражнения, фото продукта, фото прогресса), поэтому
язык приходит в них **пропсом** `lang` с дефолтом `"ru"`, а тексты лежат в
домене `common` (`common.mediaPicker.*`, `common.imageCrop.*`):

| Модуль                              | Как передаётся язык                              |
| ----------------------------------- | ------------------------------------------------ |
| `components/media-picker-sheet.tsx` | пропс `lang`                                     |
| `components/image-crop-sheet.tsx`   | пропс `lang`                                     |
| `lib/user-media.ts`                 | `pickUserImage(lang)`                            |
| `lib/nutrition-product-media.ts`    | `pickFoodProductPhotoFromLibrary(lang)`, `captureFoodProductPhoto(lang)` |
| `lib/body-progress-media.ts`        | `pickAndPersistBodyProgressPhoto(ownerId, lang)`  |
| `lib/program-exchange.ts`           | `parseProgramExchange(content, programs, lang)`  |

Вызывающие экраны берут `lang` из `useLanguage()` и прокидывают дальше, а
вызов без языка даёт прежний русский текст ошибки.

Метки ракурсов пользовательских фото («Моё изображение», «Моё фото 2») магазин
тренировок хранит в данных как есть: подпись узнаётся по шаблону и переводится
при показе функцией `userPhotoLabel(label, lang)` из
`lib/i18n/exercise-labels.ts` (ключи `catalog.detail.photoMine`,
`catalog.detail.photoMineN`). Сами данные не переписываются.

Подписи библиотеки иллюстраций («Сила», «Объём», «Выносливость», «Full Body»)
и кандидатов изображения упражнения («Отдельная AI-иллюстрация», «Техника»,
«Открытое фото упражнения · free-exercise-db» и остальные) устроены так же, как
названия упражнений: русская подпись остаётся в данных, рядом лежит `labelEn`,
а экран показывает подпись через хелпер из `lib/i18n/exercise-labels.ts`:

| Что                                   | Где данные                                       | Хелпер                                              |
| ------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| обложки программ (`programCoverIllustrationLibrary`) | `lib/workout-data.ts`               | `illustrationLibraryLabel(item, lang)`              |
| кандидаты изображения упражнения (`getExerciseIllustrationCandidates`, `generatedExerciseIllustrationLibrary`) | `lib/workout-data.ts` | `candidateLabel(item, lang)` |

Хелперы берут `labelEn` из записи, затем ключи `catalog.illustration.*` и
`catalog.candidate.*` словаря домена `catalog`, а если перевода нет — отдают
русскую подпись. Подпись вида «AI-иллюстрация группы: Грудь» переводится вместе
с названием группы. Русские поля `label` не переименовываются: на них
завязаны данные и тесты каталога.

## Английские названия в данных

Часть подписей живёт не в словарях, а рядом с данными — это справочники, где
перевод привязан к записи, а не к месту на экране:

- **Продукты питания** — `lib/nutrition-data.ts`: у каждого из 336 продуктов
  есть `nameEn` и `categoryEn`, у штучных — `pieceLabelEn`; сами словари лежат
  в `lib/nutrition-names-en.ts`. Отображайте через `foodName()`,
  `foodCategory()`, `pieceLabelOf(product, lang)`, `mealLabel()`.
- **Метрики тела и активность** — `lib/body-store.tsx`: `labelEn`/`unitEn`/
  `shortEn` у `BODY_METRICS`, `titleEn`/`descriptionEn` у
  `DAILY_ACTIVITY_LEVELS`; выбираются через `bodyMetricLabel()`,
  `bodyMetricUnit()`, `bodyMetricShort()`, `activityLevelTitle()`,
  `activityLevelDescription()`.
- **Каталог упражнений** — `lib/workout-data.ts` и `lib/catalog-expansion.ts`:
  у каждого упражнения и программы есть `nameEn`; справочные подписи групп
  мышц, оборудования, стилей иллюстраций, библиотеки обложек и кандидатов
  изображения — в `lib/i18n/exercise-labels.ts` (`exerciseName()`,
  `muscleGroupLabel()`, `equipmentLabel()`, `artStyleLabel()`,
  `artStyleHint()`, `illustrationLibraryLabel()`, `candidateLabel()`). Они
  умеют откатываться на русский, если перевод ещё не добавлен.
