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

class IronriseRestTimerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("IronriseRestTimer")

    Function("showCountdown") { restEndAt: Double ->
      showCountdown(restEndAt.toLong())
    }

    Function("clearCountdown") {
      clearCountdown()
    }
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private fun showCountdown(restEndAt: Long) {
    val remaining = restEndAt - System.currentTimeMillis()
    if (remaining <= 0) {
      clearCountdown()
      return
    }
    ensureCountdownChannel(context)
    val notification = NotificationCompat.Builder(context, COUNTDOWN_CHANNEL)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle("Отдых между подходами")
      .setContentText("До следующего подхода")
      .setWhen(SystemClock.elapsedRealtime() + remaining)
      .setShowWhen(true)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(NotificationCompat.CATEGORY_WORKOUT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
    NotificationManagerCompat.from(context).notify(COUNTDOWN_NOTIFICATION_ID, notification)
    scheduleCompletionAlarm(context, restEndAt)
  }

  private fun clearCountdown() {
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
