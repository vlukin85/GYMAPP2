# Android-сборка IronRise через GitHub Actions

Workflow **Android build** — основной маршрут Android-сборки IronRise без EAS Build. Каждый push в ветку `main` с изменениями приложения автоматически запускает проверку TypeScript, unit-тесты и **release APK**. Ручной запуск в GitHub остаётся для тестового debug APK или подписанного Android App Bundle (`.aab`) для Google Play.

> Системная кнопка **Publish** в панели Manus управляется платформой и не может быть переназначена на сторонний CI. Для Android используйте Git-маршрут: изменения попадают в `main` → GitHub Actions создаёт APK → файл доступен в Artifacts.

## Автоматический release APK

После push в `main` откройте **Actions** → **Android build** и скачайте `ironrise-release-apk` из блока **Artifacts**. Он создаётся автоматически и хранится 14 дней. GitHub скачивает Artifact как **ZIP-архив**: распакуйте его в файловом менеджере, затем устанавливайте именно файл `app-release.apk` из распакованной папки. Не переименовывайте ZIP в `.apk` и не открывайте архив как установочный пакет.

Для ручной сборки откройте **Actions** → **Android build** → **Run workflow**; выберите `debug` или `release` в поле **Вариант Android-сборки**, а в поле **Выходной артефакт** — `apk`.

Параметр архитектуры относится только к ручному debug APK. По умолчанию он собирается для `arm64-v8a` — это современные Android-смартфоны. Если телефон старый или не поддерживает 64-битные приложения, в поле **Архитектура debug APK** выберите `universal`; он содержит и `arm64-v8a`, и `armeabi-v7a`, но устанавливается дольше.

> Автоматический release APK предназначен для установки и проверки на устройстве. Для публикации в Google Play нужен отдельно подписанный AAB с постоянным production keystore.

### Если Android сообщает «пакет повреждён»

1. Удалите ранее скачанный ZIP и APK, затем повторно скачайте Artifact по Wi-Fi прямо на телефон или на компьютер.
2. Распакуйте ZIP полностью и выберите `app-release.apk`. Не устанавливайте сам ZIP-файл и не переименовывайте его в `.apk`.
3. Не отправляйте APK через мессенджеры, которые могут изменить или недокачать файл. Передавайте исходный APK по USB, через облачное хранилище или скачивайте прямо из GitHub.
4. Если ошибка появляется только при обновлении уже установленного IronRise, удалите старую тестовую версию: она могла быть подписана другим ключом. Затем повторите установку.

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

Workflow устанавливает зависимости строго по `pnpm-lock.yaml`, выполняет `pnpm check`, запускает unit-тесты в однопоточном fork-пуле, генерирует Android-проект из Expo-конфигурации и только после этих шагов запускает Gradle. Если TypeScript, тесты или обязательные secrets не проходят проверку, сборка не начинается. Автоматический push-маршрут создаёт release APK и не использует secrets; подписанный AAB всегда требует ручного `release` запуска и production keystore.
