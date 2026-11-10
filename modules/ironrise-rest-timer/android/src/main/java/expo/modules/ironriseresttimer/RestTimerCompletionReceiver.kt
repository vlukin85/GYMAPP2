package expo.modules.ironriseresttimer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
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
    val nextSetIndex = intent.getIntExtra(EXTRA_NEXT_SET_INDEX, -1)
    val nextSetWeight = intent.getStringExtra(EXTRA_NEXT_SET_WEIGHT) ?: ""
    val nextSetReps = intent.getStringExtra(EXTRA_NEXT_SET_REPS) ?: ""
    // Язык пришёл из JS в payload отсчёта и сохранён в extras действия:
    // финальное уведомление повторяет язык исходного.
    val lang = intent.getStringExtra(EXTRA_LANG) ?: "ru"
    val finishExercise = nextActionKind == "finish-exercise"
    val primaryActionLabel =
      if (finishExercise) RestTimerStrings.nextExercise(lang) else RestTimerStrings.nextSet(lang)
    val primaryActionIcon = if (finishExercise) android.R.drawable.ic_menu_save else android.R.drawable.ic_media_play
    Log.d(REST_TIMER_LOG_TAG, "rest completed: action=$nextActionKind exerciseId=$exerciseId nextSetIndex=$nextSetIndex lang=$lang")
    val soundUri = completionSoundUri(context, completionSound)
    val channelId = ensureCompletionChannel(context, completionSound, completionVibrationEnabled, completionVibrationPattern, soundUri, lang)
    val builder = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(R.drawable.ironrise_notification)
      .setContentTitle(RestTimerStrings.restCompletedTitle(lang))
      .setContentText(
        (if (finishExercise) RestTimerStrings.restCompletedBodyLastSet(lang)
        else RestTimerStrings.restCompletedBodyNextSet(lang)) +
          nextSetSummary(nextSetIndex, nextSetWeight, nextSetReps, lang)
      )
      .setAutoCancel(true)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setColor(android.graphics.Color.parseColor(COMPLETION_ACCENT_COLOR))
    builder.addAction(
      primaryActionIcon,
      primaryActionLabel,
      restActionPendingIntent(context, ACTION_START, System.currentTimeMillis(), "", 0, 0, START_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps, lang)
    )
    builder.addAction(
      android.R.drawable.ic_input_add,
      RestTimerStrings.extend30(lang),
      restActionPendingIntent(context, ACTION_EXTEND, restEndAt, "", 0, 0, EXTEND_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps, lang)
    )
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) soundUri?.let { builder.setSound(it) }
    NotificationManagerCompat.from(context).notify(COMPLETION_NOTIFICATION_ID, builder.build())
    // Вибрация канала уведомлений не гарантирована: на части оболочек она
    // глушится режимом «Не беспокоить», системными настройками канала или
    // просто не проигрывается, когда уведомление заменяет предыдущее.
    // Дублируем сигнал явным Vibrator-вызовом по выбранному паттерну —
    // совпадающие по времени вибрации Android объединяет в одну.
    if (completionVibrationEnabled) vibrate(context, completionVibrationPattern)
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) soundUri?.let { uri ->
      RingtoneManager.getRingtone(context, uri)?.apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) volume = completionVolume
        play()
      }
    }
  }

  private fun vibrate(context: Context, patternId: String) {
    val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getSystemService(VibratorManager::class.java).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    } ?: return
    if (!vibrator.hasVibrator()) return
    val pattern = completionVibrationPattern(patternId)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(pattern, -1)
    }
  }

  private fun ensureCompletionChannel(context: Context, completionSound: String, vibrationEnabled: Boolean, vibrationPatternId: String, soundUri: android.net.Uri?, lang: String = "ru"): String {
    val channelId = "$COMPLETION_CHANNEL-$completionSound-${if (vibrationEnabled) vibrationPatternId else "silent"}"
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return channelId
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(channelId, RestTimerStrings.restCompletedChannel(lang), NotificationManager.IMPORTANCE_HIGH).apply {
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
