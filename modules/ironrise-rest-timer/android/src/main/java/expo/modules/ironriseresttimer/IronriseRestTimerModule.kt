package expo.modules.ironriseresttimer

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

internal const val COUNTDOWN_CHANNEL = "ironrise-rest-countdown-v1"
internal const val COUNTDOWN_NOTIFICATION_ID = 40101
internal const val COMPLETION_NOTIFICATION_ID = 40102
internal const val ALARM_REQUEST_CODE = 40103
internal const val SKIP_REQUEST_CODE = 40104
internal const val EXTEND_REQUEST_CODE = 40105
internal const val START_REQUEST_CODE = 40106
internal const val ACTION_SKIP = "expo.modules.ironriseresttimer.SKIP"
internal const val ACTION_EXTEND = "expo.modules.ironriseresttimer.EXTEND"
internal const val ACTION_START = "expo.modules.ironriseresttimer.START"
internal const val EXTRA_REST_END_AT = "restEndAt"
internal const val EXTRA_TARGET_LABEL = "targetLabel"
internal const val EXTRA_TARGET_FROM = "targetFrom"
internal const val EXTRA_TARGET_TO = "targetTo"
private const val ACTION_PREFERENCES = "ironrise.rest.timer.actions"

class IronriseRestTimerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("IronriseRestTimer")

    Function("showCountdown") { restEndAt: Double, targetLabel: String, targetFromBpm: Double, targetToBpm: Double, currentHeartRateBpm: Double ->
      showCountdownNotification(context, restEndAt.toLong(), targetLabel, targetFromBpm.toInt(), targetToBpm.toInt(), currentHeartRateBpm.toInt())
    }

    Function("clearCountdown") {
      clearCountdownNotification(context)
    }

    Function("consumePendingAction") {
      consumePendingAction(context)
    }
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext)

}

internal fun showCountdownNotification(context: Context, restEndAt: Long, targetLabel: String, targetFromBpm: Int, targetToBpm: Int, currentHeartRateBpm: Int) {
  val remaining = restEndAt - System.currentTimeMillis()
  if (remaining <= 0) {
    clearCountdownNotification(context)
    return
  }
  ensureCountdownChannel(context)
  val notification = NotificationCompat.Builder(context, COUNTDOWN_CHANNEL)
    .setSmallIcon(context.applicationInfo.icon)
    .setContentTitle("Отдых между подходами")
    .setContentText(when {
      targetLabel.isBlank() -> "До следующего подхода"
      currentHeartRateBpm > 0 -> "ЧСС $currentHeartRateBpm · цель $targetLabel $targetFromBpm–$targetToBpm"
      else -> "Цель пульса: $targetLabel · $targetFromBpm–$targetToBpm уд/мин"
    })
    .setWhen(SystemClock.elapsedRealtime() + remaining)
    .setShowWhen(true)
    .setUsesChronometer(true)
    .setChronometerCountDown(true)
    .setOngoing(true)
    .setOnlyAlertOnce(true)
    .setCategory(NotificationCompat.CATEGORY_WORKOUT)
    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    .setPriority(NotificationCompat.PRIORITY_LOW)
    .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Пропустить", restActionPendingIntent(context, ACTION_SKIP, restEndAt, targetLabel, targetFromBpm, targetToBpm, SKIP_REQUEST_CODE))
    .addAction(android.R.drawable.ic_input_add, "+30 секунд", restActionPendingIntent(context, ACTION_EXTEND, restEndAt, targetLabel, targetFromBpm, targetToBpm, EXTEND_REQUEST_CODE))
    .addAction(android.R.drawable.ic_media_play, "Начать подход", restActionPendingIntent(context, ACTION_START, restEndAt, targetLabel, targetFromBpm, targetToBpm, START_REQUEST_CODE))
    .build()
  NotificationManagerCompat.from(context).notify(COUNTDOWN_NOTIFICATION_ID, notification)
  scheduleCompletionAlarm(context, restEndAt)
}

internal fun clearCountdownNotification(context: Context) {
  NotificationManagerCompat.from(context).cancel(COUNTDOWN_NOTIFICATION_ID)
  NotificationManagerCompat.from(context).cancel(COMPLETION_NOTIFICATION_ID)
  val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  alarmManager.cancel(completionPendingIntent(context, PendingIntent.FLAG_NO_CREATE))
}

private fun ensureCountdownChannel(context: Context) {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
  val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
  val channel = NotificationChannel(COUNTDOWN_CHANNEL, "Таймер отдыха", NotificationManager.IMPORTANCE_LOW).apply {
    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    setShowBadge(false)
    enableVibration(false)
  }
  manager.createNotificationChannel(channel)
}

internal fun restActionPendingIntent(context: Context, action: String, restEndAt: Long, targetLabel: String, targetFromBpm: Int, targetToBpm: Int, requestCode: Int): PendingIntent {
  val intent = Intent(context, RestTimerActionReceiver::class.java).apply {
    this.action = action
    putExtra(EXTRA_REST_END_AT, restEndAt)
    putExtra(EXTRA_TARGET_LABEL, targetLabel)
    putExtra(EXTRA_TARGET_FROM, targetFromBpm)
    putExtra(EXTRA_TARGET_TO, targetToBpm)
  }
  return PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
}

internal fun savePendingAction(context: Context, kind: String, restEndAt: Long) {
  context.getSharedPreferences(ACTION_PREFERENCES, Context.MODE_PRIVATE).edit().putString("kind", kind).putLong("restEndAt", restEndAt).apply()
}

internal fun consumePendingAction(context: Context): Map<String, Any>? {
  val preferences = context.getSharedPreferences(ACTION_PREFERENCES, Context.MODE_PRIVATE)
  val kind = preferences.getString("kind", null) ?: return null
  val restEndAt = preferences.getLong("restEndAt", 0)
  preferences.edit().clear().apply()
  return mapOf("kind" to kind, "restEndAt" to restEndAt)
}

internal fun completionPendingIntent(context: Context, flags: Int): PendingIntent {
  val intent = Intent(context, RestTimerCompletionReceiver::class.java).apply {
    action = "expo.modules.ironriseresttimer.COMPLETE"
  }
  return PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE or flags)
}

internal fun scheduleCompletionAlarm(context: Context, restEndAt: Long) {
  val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  val pendingIntent = completionPendingIntent(context, 0)
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && manager.canScheduleExactAlarms()) {
    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  } else {
    manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  }
}
