# Настройка Google Fit в IronRise

Google Fit — **основной** источник данных IronRise (шаги, активные калории,
дистанция, пульс за день и взвешивания). Health Connect остаётся резервом и
выбирается в настройках, если Google Fit недоступен.

## Честные оговорки — прочитай до начала

1. **Google Fit API объявлен устаревшим.** Google отключает Fitness API к
   концу 2026 года. Приложение продолжит работать до этого срока, но
   закладывай переход на альтернативу (Health Connect уже встроен в IronRise
   как резервный источник).
2. **Регистрация новых проектов закрыта с 01.05.2024.** Включить Fitness API
   в новом проекте Google Cloud можно только если Google всё же позволяет
   это для твоего аккаунта, либо нужно использовать проект, созданный
   раньше. Проверить доступность можно только в консоли — включи
   «Fitness API» в API Library и посмотри, активируется ли она.
3. **Состав тела из Google Fit недоступен.** Библиотека
   `react-native-google-fit` не отдаёт образцы процента жира, мышечной,
   костной и водной массы (только вес). При источнике Google Fit
   IronRise сохраняет только вес; состав тела работает через резервный
   путь Health Connect (весы OKOK → OKOK International → Health Connect).
4. **Скоуп `fitness.body.read` — Restricted.** Для публикации в Google Play
   он требует верификации Google. Для личного использования достаточно
   не публиковать OAuth consent screen, а добавить свой e-mail в test users.

## Пошаговая настройка

### 1. Google Cloud Console

1. Открой [Google API Console](https://console.cloud.google.com/) и создай
   (или выбери старый) проект.
2. В **APIs & Services → Library** включи **Fitness API** (если включение
   недоступно — см. оговорку №2).
3. **OAuth consent screen**: тип **External**, заполни название приложения и
   почту разработчика, добавь свой e-mail в **Test users**.
4. **Credentials → Create Credentials → OAuth Client ID**, тип **Android**:
   - **Package name**: `com.app.gymtrainingdiary` (package из
     `app.config.ts`, поле `android.package`).
   - **SHA-1**: отпечаток подписи, которой собирается APK (см. ниже).

### 2. Где взять SHA-1

Из готового APK:

```bash
keytool -printcert -jarfile app-release.apk
```

или из keystore напрямую:

```bash
# debug-подпись Expo/RN по умолчанию
keytool -list -v -keystore android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android

# release-подпись
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

Скопируй строку **SHA1** (формат `XX:XX:XX:…`) в OAuth Client ID. Для
debug- и release-подписей нужны **отдельные** Client ID с разными SHA-1
(можно в одном проекте).

### 3. Сборка приложения

Expo config plugin библиотеки уже подключён в `app.config.ts` (добавляет
`<queries>` для пакета `com.google.android.apps.fitness` в манифест):

```bash
npx expo prebuild --platform android
npx expo run:android
```

### 4. Подключение в приложении

1. Настройки → **Google Fit** → **Подключить Google Fit**.
2. В системном диалоге Google разреши чтение активности, веса и пульса.
3. Статус в секции сменится на **ГОТОВ**.

## Скоупы

IronRise запрашивает:

- `https://www.googleapis.com/auth/fitness.activity.read` — шаги, калории,
  дистанция (не Restricted);
- `https://www.googleapis.com/auth/fitness.body.read` — вес (**Restricted**,
  для личного использования достаточно test users, см. оговорку №4);
- `https://www.googleapis.com/auth/fitness.heart_rate.read` — пульс за день.

## Откуда берутся данные

Цепочка для весов: **весы → OKOK International → приложение Google Fit →
Fitness API → IronRise**. Health Connect в этой цепочке не нужен: OKOK пишет
измерения в приложение Google Fit, а IronRise читает их напрямую через
Fit API. Включи синхронизацию с Google Fit в настройках OKOK International.

Карточка «Активность · сегодня» на вкладке «Статистика» читает данные через
единый провайдер: при источнике Google Fit — из Fit API, при недоступности
или отказе — автоматически из Health Connect (резерв). Пульс во время
тренировки всегда читается из Health Connect — этот путь не переключается.

## Ссылки

- Fitness API: <https://developers.google.com/fit>
- Отказ от Fit API и сроки: <https://developers.google.com/fit/improvements>
- OAuth для Android: <https://developers.google.com/fit/android/get-started>
- Restricted scopes и верификация:
  <https://support.google.com/cloud/answer/9110914>
- Библиотека: <https://github.com/StasDoskalenko/react-native-google-fit>
