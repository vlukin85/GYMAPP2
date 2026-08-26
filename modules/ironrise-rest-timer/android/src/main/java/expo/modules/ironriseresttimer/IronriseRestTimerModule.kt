package expo.modules.ironriseresttimer

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

internal const val COUNTDOWN_CHANNEL = "ironrise-rest-countdown-v1"
internal const val COUNTDOWN_NOTIFICATION_ID = 40101
internal const val COMPLETION_NOTIFICATION_ID = 40102
internal const val ALARM_REQUEST_CODE = 40103
internal const val SKIP_REQUEST_CODE = 40104
internal const val EXTEND_REQUEST_CODE = 40105
internal const val START_REQUEST_CODE = 40106
internal const val EDIT_SET_REQUEST_CODE = 40107
internal const val ACTION_SKIP = "expo.modules.ironriseresttimer.SKIP"
internal const val ACTION_EXTEND = "expo.modules.ironriseresttimer.EXTEND"
internal const val ACTION_START = "expo.modules.ironriseresttimer.START"
internal const val ACTION_EDIT_SET = "expo.modules.ironriseresttimer.EDIT_SET"
internal const val REMOTE_INPUT_SET_VALUES = "expo.modules.ironriseresttimer.SET_VALUES"
internal const val EXTRA_REST_END_AT = "restEndAt"
internal const val EXTRA_TARGET_LABEL = "targetLabel"
internal const val EXTRA_TARGET_FROM = "targetFrom"
internal const val EXTRA_TARGET_TO = "targetTo"
internal const val EXTRA_COMPLETION_SOUND = "completionSound"
internal const val EXTRA_COMPLETION_VOLUME = "completionVolume"
internal const val EXTRA_COMPLETION_VIBRATION = "completionVibration"
internal const val EXTRA_COMPLETION_VIBRATION_PATTERN = "completionVibrationPattern"
internal const val EXTRA_NEXT_ACTION_KIND = "nextActionKind"
internal const val EXTRA_EXERCISE_ID = "exerciseId"
internal const val EXTRA_NEXT_SET_INDEX = "nextSetIndex"
internal const val EXTRA_NEXT_SET_WEIGHT = "nextSetWeight"
internal const val EXTRA_NEXT_SET_REPS = "nextSetReps"
private const val ACTION_PREFERENCES = "ironrise.rest.timer.actions"
internal const val REST_TIMER_LOG_TAG = "IronRiseRestTimer"

class IronriseRestTimerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("IronriseRestTimer")

    Function("showCountdown") { payload: Map<String, Any?> ->
      showCountdownNotification(
        context = context,
        restEndAt = (payload["restEndAt"] as? Number)?.toLong() ?: 0L,
        targetLabel = payload["targetLabel"] as? String ?: "",
        targetFromBpm = (payload["targetFromBpm"] as? Number)?.toInt() ?: 0,
        targetToBpm = (payload["targetToBpm"] as? Number)?.toInt() ?: 0,
        currentHeartRateBpm = (payload["currentHeartRateBpm"] as? Number)?.toInt() ?: 0,
        heartRateZoneColor = payload["heartRateZoneColor"] as? String ?: "",
        completionSound = payload["completionSound"] as? String ?: "female",
        completionVolume = ((payload["completionVolume"] as? Number)?.toFloat() ?: 0.8f).coerceIn(0.1f, 1f),
        completionVibrationEnabled = payload["completionVibrationEnabled"] as? Boolean ?: true,
        completionVibrationPattern = payload["completionVibrationPattern"] as? String ?: "short",
        nextActionKind = payload["nextActionKind"] as? String ?: "start",
        exerciseId = payload["exerciseId"] as? String ?: "",
        nextSetIndex = (payload["nextSetIndex"] as? Number)?.toInt() ?: -1,
        nextSetWeight = payload["nextSetWeight"] as? String ?: "",
        nextSetReps = payload["nextSetReps"] as? String ?: ""
      )
    }

    Function("previewCompletionSound") { completionSound: String ->
      completionSoundUri(context, completionSound)?.let { RingtoneManager.getRingtone(context, it)?.play() }
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

internal fun showCountdownNotification(
  context: Context,
  restEndAt: Long,
  targetLabel: String,
  targetFromBpm: Int,
  targetToBpm: Int,
  currentHeartRateBpm: Int,
  heartRateZoneColor: String,
  completionSound: String,
  completionVolume: Float = 0.8f,
  completionVibrationEnabled: Boolean = true,
  completionVibrationPattern: String = "short",
  nextActionKind: String = "start",
  exerciseId: String = "",
  nextSetIndex: Int = -1,
  nextSetWeight: String = "",
  nextSetReps: String = ""
) {
  val remaining = restEndAt - System.currentTimeMillis()
  if (remaining <= 0) {
    Log.d(REST_TIMER_LOG_TAG, "countdown ignored: rest already finished")
    clearCountdownNotification(context)
    return
  }
  ensureCountdownChannel(context)
  val finishExercise = nextActionKind == "finish-exercise"
  val primaryActionLabel = if (finishExercise) "Завершить упражнение" else "Начать подход"
  val primaryActionIcon = if (finishExercise) android.R.drawable.ic_menu_save else android.R.drawable.ic_media_play
  Log.d(REST_TIMER_LOG_TAG, "countdown shown: endAt=$restEndAt action=$nextActionKind exerciseId=$exerciseId nextSetIndex=$nextSetIndex")

  val content = when {
    targetLabel.isBlank() -> "До следующего подхода"
    currentHeartRateBpm > 0 -> "ЧСС $currentHeartRateBpm · цель $targetLabel $targetFromBpm–$targetToBpm"
    else -> "Цель пульса: $targetLabel · $targetFromBpm–$targetToBpm уд/мин"
  } + nextSetSummary(nextSetIndex, nextSetWeight, nextSetReps)

  val builder = NotificationCompat.Builder(context, COUNTDOWN_CHANNEL)
    .setSmallIcon(context.applicationInfo.icon)
    .setContentTitle("Отдых между подходами")
    .setContentText(content)
    .setWhen(restEndAt)
    .setShowWhen(true)
    .setUsesChronometer(true)
    .setChronometerCountDown(true)
    .setOngoing(true)
    .setOnlyAlertOnce(true)
    .setCategory(NotificationCompat.CATEGORY_WORKOUT)
    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    .setPriority(NotificationCompat.PRIORITY_LOW)

  if (heartRateZoneColor.isNotBlank()) {
    runCatching { builder.setColor(android.graphics.Color.parseColor(heartRateZoneColor)) }
  }
  builder.addAction(
    android.R.drawable.ic_menu_close_clear_cancel,
    "Пропустить",
    restActionPendingIntent(context, ACTION_SKIP, restEndAt, targetLabel, targetFromBpm, targetToBpm, SKIP_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
  )
  if (!finishExercise && nextSetIndex >= 0) {
    builder.addAction(
      buildEditSetAction(context, restEndAt, targetLabel, targetFromBpm, targetToBpm, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
    )
  } else {
    builder.addAction(
      android.R.drawable.ic_input_add,
      "+30 секунд",
      restActionPendingIntent(context, ACTION_EXTEND, restEndAt, targetLabel, targetFromBpm, targetToBpm, EXTEND_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
    )
  }
  builder.addAction(
    primaryActionIcon,
    primaryActionLabel,
    restActionPendingIntent(context, ACTION_START, restEndAt, targetLabel, targetFromBpm, targetToBpm, START_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
  )
  NotificationManagerCompat.from(context).notify(COUNTDOWN_NOTIFICATION_ID, builder.build())
  scheduleCompletionAlarm(context, restEndAt, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
}

internal fun buildEditSetAction(
  context: Context,
  restEndAt: Long,
  targetLabel: String,
  targetFromBpm: Int,
  targetToBpm: Int,
  completionSound: String,
  completionVolume: Float,
  completionVibrationEnabled: Boolean,
  completionVibrationPattern: String,
  nextActionKind: String,
  exerciseId: String,
  nextSetIndex: Int,
  nextSetWeight: String,
  nextSetReps: String
): NotificationCompat.Action {
  val remoteInput = RemoteInput.Builder(REMOTE_INPUT_SET_VALUES)
    .setLabel("Вес × повторы, например 80 × 10")
    .build()
  return NotificationCompat.Action.Builder(
    android.R.drawable.ic_menu_edit,
    "Вес × повторы",
    restActionPendingIntent(context, ACTION_EDIT_SET, restEndAt, targetLabel, targetFromBpm, targetToBpm, EDIT_SET_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps, allowRemoteInput = true)
  ).addRemoteInput(remoteInput).build()
}

internal fun nextSetSummary(nextSetIndex: Int, weight: String, reps: String): String =
  if (nextSetIndex >= 0 && (weight.isNotBlank() || reps.isNotBlank())) " · Далее: $weight кг × $reps" else ""

internal fun clearCountdownNotification(context: Context) {
  Log.d(REST_TIMER_LOG_TAG, "countdown cleared")
  NotificationManagerCompat.from(context).cancel(COUNTDOWN_NOTIFICATION_ID)
  NotificationManagerCompat.from(context).cancel(COMPLETION_NOTIFICATION_ID)
  val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  completionPendingIntent(context, PendingIntent.FLAG_NO_CREATE)?.let { alarmManager.cancel(it) }
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

internal fun restActionPendingIntent(
  context: Context,
  action: String,
  restEndAt: Long,
  targetLabel: String,
  targetFromBpm: Int,
  targetToBpm: Int,
  requestCode: Int,
  completionSound: String = "female",
  completionVolume: Float = 0.8f,
  completionVibrationEnabled: Boolean = true,
  completionVibrationPattern: String = "short",
  nextActionKind: String = "start",
  exerciseId: String = "",
  nextSetIndex: Int = -1,
  nextSetWeight: String = "",
  nextSetReps: String = "",
  allowRemoteInput: Boolean = false
): PendingIntent {
  val intent = Intent(context, RestTimerActionReceiver::class.java).apply {
    this.action = action
    putExtra(EXTRA_REST_END_AT, restEndAt)
    putExtra(EXTRA_TARGET_LABEL, targetLabel)
    putExtra(EXTRA_TARGET_FROM, targetFromBpm)
    putExtra(EXTRA_TARGET_TO, targetToBpm)
    putExtra(EXTRA_COMPLETION_SOUND, completionSound)
    putExtra(EXTRA_COMPLETION_VOLUME, completionVolume)
    putExtra(EXTRA_COMPLETION_VIBRATION, completionVibrationEnabled)
    putExtra(EXTRA_COMPLETION_VIBRATION_PATTERN, completionVibrationPattern)
    putExtra(EXTRA_NEXT_ACTION_KIND, nextActionKind)
    putExtra(EXTRA_EXERCISE_ID, exerciseId)
    putExtra(EXTRA_NEXT_SET_INDEX, nextSetIndex)
    putExtra(EXTRA_NEXT_SET_WEIGHT, nextSetWeight)
    putExtra(EXTRA_NEXT_SET_REPS, nextSetReps)
  }
  val mutabilityFlag =
    if (allowRemoteInput && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE
    else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_IMMUTABLE
    else 0
  return PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or mutabilityFlag)
}

internal fun savePendingAction(
  context: Context,
  kind: String,
  restEndAt: Long,
  exerciseId: String = "",
  setIndex: Int = -1,
  weight: String = "",
  reps: String = ""
) {
  Log.d(REST_TIMER_LOG_TAG, "pending action saved: kind=$kind at=$restEndAt exerciseId=$exerciseId setIndex=$setIndex")
  context.getSharedPreferences(ACTION_PREFERENCES, Context.MODE_PRIVATE).edit()
    .putString("kind", kind)
    .putLong("restEndAt", restEndAt)
    .putString("exerciseId", exerciseId)
    .putInt("setIndex", setIndex)
    .putString("weight", weight)
    .putString("reps", reps)
    .apply()
}

internal fun consumePendingAction(context: Context): Map<String, Any>? {
  val preferences = context.getSharedPreferences(ACTION_PREFERENCES, Context.MODE_PRIVATE)
  val kind = preferences.getString("kind", null) ?: return null
  val restEndAt = preferences.getLong("restEndAt", 0)
  val exerciseId = preferences.getString("exerciseId", "") ?: ""
  val setIndex = preferences.getInt("setIndex", -1)
  val weight = preferences.getString("weight", "") ?: ""
  val reps = preferences.getString("reps", "") ?: ""
  preferences.edit().clear().apply()
  Log.d(REST_TIMER_LOG_TAG, "pending action consumed: kind=$kind at=$restEndAt exerciseId=$exerciseId setIndex=$setIndex")
  return buildMap {
    put("kind", kind)
    put("restEndAt", restEndAt)
    put("exerciseId", exerciseId)
    if (setIndex >= 0) put("setIndex", setIndex)
    if (weight.isNotBlank()) put("weight", weight)
    if (reps.isNotBlank()) put("reps", reps)
  }
}

internal fun completionPendingIntent(
  context: Context,
  flags: Int,
  completionSound: String = "female",
  restEndAt: Long = 0,
  completionVolume: Float = 0.8f,
  completionVibrationEnabled: Boolean = true,
  completionVibrationPattern: String = "short",
  nextActionKind: String = "start",
  exerciseId: String = "",
  nextSetIndex: Int = -1,
  nextSetWeight: String = "",
  nextSetReps: String = ""
): PendingIntent {
  val intent = Intent(context, RestTimerCompletionReceiver::class.java).apply {
    action = "expo.modules.ironriseresttimer.COMPLETE"
    putExtra(EXTRA_COMPLETION_SOUND, completionSound)
    putExtra(EXTRA_REST_END_AT, restEndAt)
    putExtra(EXTRA_COMPLETION_VOLUME, completionVolume)
    putExtra(EXTRA_COMPLETION_VIBRATION, completionVibrationEnabled)
    putExtra(EXTRA_COMPLETION_VIBRATION_PATTERN, completionVibrationPattern)
    putExtra(EXTRA_NEXT_ACTION_KIND, nextActionKind)
    putExtra(EXTRA_EXERCISE_ID, exerciseId)
    putExtra(EXTRA_NEXT_SET_INDEX, nextSetIndex)
    putExtra(EXTRA_NEXT_SET_WEIGHT, nextSetWeight)
    putExtra(EXTRA_NEXT_SET_REPS, nextSetReps)
  }
  return PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE or flags)
}

internal fun scheduleCompletionAlarm(
  context: Context,
  restEndAt: Long,
  completionSound: String,
  completionVolume: Float,
  completionVibrationEnabled: Boolean,
  completionVibrationPattern: String,
  nextActionKind: String,
  exerciseId: String,
  nextSetIndex: Int,
  nextSetWeight: String,
  nextSetReps: String
) {
  val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  val pendingIntent = completionPendingIntent(context, 0, completionSound, restEndAt, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && manager.canScheduleExactAlarms()) {
    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  } else {
    manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  }
}

internal fun completionSoundUri(context: Context, completionSound: String) = when (completionSound) {
  "silent" -> null
  else -> {
    val resourceName = when (completionSound) {
      "male" -> "rest_complete_male"
      "siren" -> "rest_complete_siren"
      else -> "rest_complete_female"
    }
    val resourceId = context.resources.getIdentifier(resourceName, "raw", context.packageName)
    if (resourceId == 0) null else android.net.Uri.parse("android.resource://${context.packageName}/$resourceId")
  }
}
