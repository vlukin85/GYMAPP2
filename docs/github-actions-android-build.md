# Android-сборка IronRise через GitHub Actions

Workflow **Android build** собирает APK для тестирования и подписанный Android App Bundle (`.aab`) для Google Play без EAS Build. Он запускается вручную из репозитория GitHub и до Android-сборки всегда проверяет TypeScript и запускает unit-тесты.

## Тестовый APK

Откройте **Actions** → **Android build** → **Run workflow**. Для установки на личное устройство выберите `debug` или `release` в поле **Вариант Android-сборки**, а в поле **Выходной артефакт** — `apk`. Готовый файл будет доступен в блоке **Artifacts** 14 дней.

> Тестовый APK использует стандартную тестовую подпись Android. Он подходит для проверки на устройстве, но не для публикации в Google Play.

## Production keystore и GitHub Secrets

Подписанный AAB требует постоянного upload key. Его нельзя коммитить в репозиторий, удалять или менять после первой публикации: при обновлении Google Play ожидает ту же подпись. Для IronRise уже зафиксирован Android package name `com.app.gymtrainingdiary` в `app.config.ts`; его также нельзя менять после первой загрузки приложения в Google Play.

Создайте keystore в защищённом локальном хранилище, а затем сохраните резервную копию файла и паролей вне GitHub:

```bash
keytool -genkeypair -v \
  -keystore ironrise-upload.keystore \
  -alias ironrise-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

В **Settings** → **Secrets and variables** → **Actions** → **New repository secret** добавьте четыре секрета. Значение `KEYSTORE_BASE64` создаётся локально командой `base64 -w 0 ironrise-upload.keystore`.

| Secret              | Значение                                                           |
| ------------------- | ------------------------------------------------------------------ |
| `KEYSTORE_BASE64`   | Base64-строка файла `ironrise-upload.keystore` без переносов строк |
| `KEYSTORE_PASSWORD` | Пароль хранилища ключей                                            |
| `KEY_ALIAS`         | `ironrise-upload` или выбранный вами alias                         |
| `KEY_PASSWORD`      | Пароль ключа; может совпадать с паролем хранилища                  |

> В workflow секреты применяются только при выпуске AAB. Во время job keystore восстанавливается во временном Android-проекте и не загружается как artifact.

## Выпуск подписанного AAB

После настройки секретов откройте **Actions** → **Android build** → **Run workflow** и выберите: **Вариант Android-сборки** — `release`; **Выходной артефакт** — `aab`. Когда оба этапа workflow завершатся успешно, скачайте `ironrise-release-aab` из **Artifacts** и загрузите этот файл в Google Play Console.

Для одновременной проверки APK и подготовки AAB выберите `release` и `both`. В этом случае оба файла подписываются production keystore.

## Что проверяет workflow

Workflow устанавливает зависимости строго по `pnpm-lock.yaml`, выполняет `pnpm check`, запускает unit-тесты в однопоточном fork-пуле, генерирует Android-проект из Expo-конфигурации и только после этих шагов запускает Gradle. Если TypeScript, тесты или обязательные secrets не проходят проверку, сборка AAB не начинается.
