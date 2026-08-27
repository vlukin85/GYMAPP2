# Android-виджет «Активная тренировка» — технические ограничения

Нативный виджет IronRise реализуется через `AppWidgetProvider`, XML-метаданные и XML-разметку `RemoteViews`. Действия из виджета передаются через явные `PendingIntent` в `BroadcastReceiver`, после чего открывают приложение и применяются экраном активной тренировки.

Периодическое обновление для секундного таймера намеренно не используется: Android не поддерживает `updatePeriodMillis` чаще одного раза в 30 минут, а частые полные обновления расходуют заряд. Состояние виджета обновляется в ответ на действия пользователя и изменения тренировки; при активном отдыхе виджет предлагает «+30 сек» и «Пропустить» вместо неточного фонового countdown.

Источники:

1. [Create a simple widget — Android Developers](https://developer.android.com/develop/ui/views/appwidgets): виджет состоит из provider, XML-метаданных и `RemoteViews`; действия передаются через provider.
2. [Create an advanced widget — Android Developers](https://developer.android.com/develop/ui/views/appwidgets/advanced): `updateAppWidget`, ограничения `updatePeriodMillis` и рекомендации по обработке `PendingIntent`.
3. [PendingIntent — Android Developers](https://developer.android.com/reference/android/app/PendingIntent): для безопасной передачи действий используются явные intents и `FLAG_IMMUTABLE`.
