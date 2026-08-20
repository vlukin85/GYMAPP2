package expo.modules.ironriseresttimer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

private const val COMPLETION_CHANNEL = "ironrise-rest-complete-v2"
private const val COMPLETION_ACCENT_COLOR = "#7C3AED"

class RestTimerCompletionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    NotificationManagerCompat.from(context).cancel(COUNTDOWN_NOTIFICATION_ID)
    val completionSound = intent.getStringExtra(EXTRA_COMPLETION_SOUND) ?: "system"
    val restEndAt = intent.getLongExtra(EXTRA_REST_END_AT, System.currentTimeMillis())
    val channelId = ensureCompletionChannel(context, completionSound)
    val notification = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle("Отдых завершён")
      .setContentText("Время следующего подхода.")
      .setAutoCancel(true)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setColor(android.graphics.Color.parseColor(COMPLETION_ACCENT_COLOR))
      .addAction(android.R.drawable.ic_media_play, "Начать подход", restActionPendingIntent(context, ACTION_START, System.currentTimeMillis(), "", 0, 0, START_REQUEST_CODE, completionSound))
      .addAction(android.R.drawable.ic_input_add, "+30 секунд", restActionPendingIntent(context, ACTION_EXTEND, restEndAt, "", 0, 0, EXTEND_REQUEST_CODE, completionSound))
      .build()
    NotificationManagerCompat.from(context).notify(COMPLETION_NOTIFICATION_ID, notification)
  }

  private fun ensureCompletionChannel(context: Context, completionSound: String): String {
    val channelId = "$COMPLETION_CHANNEL-$completionSound"
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return channelId
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(channelId, "Отдых завершён", NotificationManager.IMPORTANCE_HIGH).apply {
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 350, 130, 700)
      setSound(completionSoundUri(completionSound), null)
    }
    manager.createNotificationChannel(channel)
    return channelId
  }
}
