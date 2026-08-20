# Таймер отдыха на экране блокировки Android

## Проверенные возможности

`NotificationCompat.Builder.setChronometerCountDown(true)` включает убывающий хронометр в Android-уведомлении, если перед этим установлен `setUsesChronometer(true)`. Метод требует Android API 24 или выше. IronRise использует `SystemClock.elapsedRealtime() + remainingMs` как базу хронометра, поэтому счётчик продолжает идти, пока JavaScript-процесс приложения неактивен.

Системная вибрация завершения должна быть настроена на отдельном Android notification channel. Каналы запоминают пользовательские настройки, поэтому для исправления ранее созданного канала завершения используется новый идентификатор `ironrise-rest-complete-v2` с `IMPORTANCE_HIGH`, `enableVibration(true)` и явным паттерном вибрации. Пользователь всё равно может отключить вибрацию канала в системных настройках Android.

## Ограничения и fallback

Expo Notifications остаётся fallback для web и сборок без локального модуля. Локальный Expo-модуль запускает `AlarmManager` для завершения отдыха: при разрешении точных будильников используется `setExactAndAllowWhileIdle`; иначе — `setAndAllowWhileIdle`, который Android может отложить в энергосберегающем режиме. Из-за отсутствия Android SDK в sandbox Gradle-компиляция локального Kotlin-модуля не выполнялась; Expo autolinking подтвердил обнаружение модуля, а Android prebuild завершился успешно. Требуется новая Android-сборка и проверка на физическом устройстве.

## Источники

- https://developer.android.com/reference/androidx/core/app/NotificationCompat.Builder#setChronometerCountDown(boolean)
- https://docs.expo.dev/versions/latest/sdk/notifications/
- https://docs.expo.dev/modules/get-started/
