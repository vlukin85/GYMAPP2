# Фотографии прогресса тела

Для выбора фото используется Expo ImagePicker только из действия пользователя; отмена выбора не изменяет журнал. Финальная фотография проходит через существующий local-first конвейер `cropAndPersistUserImage` и сохраняется как локальная ссылка в `FileSystem.documentDirectory/gym-diary-media/` на Android и iOS. На web используется безопасный URI-резерв.

Ограничение файла — до 8 МБ; сохраняются только JPG, PNG, WEBP или HEIC после обработки. В журнале хранится URI и дата замера, а не бинарные данные.

Источники: локальная документация Expo SDK 54 — `media/imagepicker/DOCS.md`, `storage/filesystem/DOCS.md`, `storage/document-picker/DOCS.md`.
