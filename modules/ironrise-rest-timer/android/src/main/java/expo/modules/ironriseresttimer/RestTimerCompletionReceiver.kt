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
    val completionSound = intent.getStringExtra(EXTRA_COMPLETION_SOUND) ?: "female"
    val completionVolume = intent.getFloatExtra(EXTRA_COMPLETION_VOLUME, 0.8f).coerceIn(0.1f, 1f)
    val completionVibrationEnabled = intent.getBooleanExtra(EXTRA_COMPLETION_VIBRATION, true)
    val restEndAt = intent.getLongExtra(EXTRA_REST_END_AT, System.currentTimeMillis())
    val channelId = ensureCompletionChannel(context, completionSound, completionVibrationEnabled)
    val notification = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle("Отдых завершён")
      .setContentText("Время следующего подхода.")
      .setAutoCancel(true)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setColor(android.graphics.Color.parseColor(COMPLETION_ACCENT_COLOR))
      .addAction(android.R.drawable.ic_media_play, "Начать подход", restActionPendingIntent(context, ACTION_START, System.currentTimeMillis(), "", 0, 0, START_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled))
      .addAction(android.R.drawable.ic_input_add, "+30 секунд", restActionPendingIntent(context, ACTION_EXTEND, restEndAt, "", 0, 0, EXTEND_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled))
      .build()
    NotificationManagerCompat.from(context).notify(COMPLETION_NOTIFICATION_ID, notification)
    completionSoundUri(context, completionSound)?.let { uri ->
      RingtoneManager.getRingtone(context, uri)?.apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) volume = completionVolume
        play()
      }
    }
  }

  private fun ensureCompletionChannel(context: Context, completionSound: String, vibrationEnabled: Boolean): String {
    val channelId = "$COMPLETION_CHANNEL-$completionSound-${if (vibrationEnabled) "v" else "silent"}"
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return channelId
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(channelId, "Отдых завершён", NotificationManager.IMPORTANCE_HIGH).apply {
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      enableVibration(vibrationEnabled)
      if (vibrationEnabled) vibrationPattern = longArrayOf(0, 350, 130, 700)
      setSound(null, null)
    }
    manager.createNotificationChannel(channel)
    return channelId
  }
}
