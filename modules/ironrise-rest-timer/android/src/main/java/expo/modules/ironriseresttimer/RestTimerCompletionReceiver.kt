package expo.modules.ironriseresttimer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

private const val COMPLETION_CHANNEL = "ironrise-rest-complete-v3"
private const val COMPLETION_ACCENT_COLOR = "#7C3AED"

class RestTimerCompletionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    NotificationManagerCompat.from(context).cancel(COUNTDOWN_NOTIFICATION_ID)
    val completionSound = intent.getStringExtra(EXTRA_COMPLETION_SOUND) ?: "female"
    val completionVolume = intent.getFloatExtra(EXTRA_COMPLETION_VOLUME, 0.8f).coerceIn(0.1f, 1f)
    val completionVibrationEnabled = intent.getBooleanExtra(EXTRA_COMPLETION_VIBRATION, true)
    val completionVibrationPattern = intent.getStringExtra(EXTRA_COMPLETION_VIBRATION_PATTERN) ?: "short"
    val restEndAt = intent.getLongExtra(EXTRA_REST_END_AT, System.currentTimeMillis())
    val nextActionKind = intent.getStringExtra(EXTRA_NEXT_ACTION_KIND) ?: "start"
    val exerciseId = intent.getStringExtra(EXTRA_EXERCISE_ID) ?: ""
    val finishExercise = nextActionKind == "finish-exercise"
    val primaryActionLabel = if (finishExercise) "Завершить упражнение" else "Начать подход"
    val primaryActionIcon = if (finishExercise) android.R.drawable.ic_menu_save else android.R.drawable.ic_media_play
    val soundUri = completionSoundUri(context, completionSound)
    val channelId = ensureCompletionChannel(context, completionSound, completionVibrationEnabled, completionVibrationPattern, soundUri)
    val notification = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle("Отдых завершён")
      .setContentText(if (finishExercise) "Последний подход завершён." else "Время следующего подхода.")
      .setAutoCancel(true)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setColor(android.graphics.Color.parseColor(COMPLETION_ACCENT_COLOR))
      .addAction(primaryActionIcon, primaryActionLabel, restActionPendingIntent(context, ACTION_START, System.currentTimeMillis(), "", 0, 0, START_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId))
      .addAction(android.R.drawable.ic_input_add, "+30 секунд", restActionPendingIntent(context, ACTION_EXTEND, restEndAt, "", 0, 0, EXTEND_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId))
      .apply {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) soundUri?.let { setSound(it) }
      }
      .build()
    NotificationManagerCompat.from(context).notify(COMPLETION_NOTIFICATION_ID, notification)
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) soundUri?.let { uri ->
      RingtoneManager.getRingtone(context, uri)?.apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) volume = completionVolume
        play()
      }
    }
  }

  private fun ensureCompletionChannel(context: Context, completionSound: String, vibrationEnabled: Boolean, vibrationPatternId: String, soundUri: android.net.Uri?): String {
    val channelId = "$COMPLETION_CHANNEL-$completionSound-${if (vibrationEnabled) vibrationPatternId else "silent"}"
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return channelId
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(channelId, "Отдых завершён", NotificationManager.IMPORTANCE_HIGH).apply {
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      enableVibration(vibrationEnabled)
      if (vibrationEnabled) vibrationPattern = completionVibrationPattern(vibrationPatternId)
      if (soundUri == null) {
        setSound(null, null)
      } else {
        setSound(soundUri, AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build())
      }
    }
    manager.createNotificationChannel(channel)
    return channelId
  }

  private fun completionVibrationPattern(patternId: String) = when (patternId) {
    "long" -> longArrayOf(0, 900)
    "pulse" -> longArrayOf(0, 160, 110, 160, 110, 160)
    else -> longArrayOf(0, 240)
  }
}
