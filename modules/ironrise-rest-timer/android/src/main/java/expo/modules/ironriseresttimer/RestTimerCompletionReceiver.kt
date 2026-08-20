package expo.modules.ironriseresttimer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

private const val COMPLETION_CHANNEL = "ironrise-rest-complete-v2"
private const val COMPLETION_ACCENT_COLOR = "#7C3AED"

class RestTimerCompletionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    NotificationManagerCompat.from(context).cancel(COUNTDOWN_NOTIFICATION_ID)
    ensureCompletionChannel(context)
    val notification = NotificationCompat.Builder(context, COMPLETION_CHANNEL)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle("Отдых завершён")
      .setContentText("Время следующего подхода.")
      .setAutoCancel(true)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setColor(android.graphics.Color.parseColor(COMPLETION_ACCENT_COLOR))
      .build()
    NotificationManagerCompat.from(context).notify(COMPLETION_NOTIFICATION_ID, notification)
  }

  private fun ensureCompletionChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(COMPLETION_CHANNEL, "Отдых завершён", NotificationManager.IMPORTANCE_HIGH).apply {
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 350, 130, 700)
      setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI, null)
    }
    manager.createNotificationChannel(channel)
  }
}
