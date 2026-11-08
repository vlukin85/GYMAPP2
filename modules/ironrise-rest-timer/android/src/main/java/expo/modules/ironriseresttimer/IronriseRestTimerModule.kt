package expo.modules.ironriseresttimer

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import androidx.core.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

internal const val COUNTDOWN_CHANNEL = "ironrise-rest-countdown-v1"
internal const val ACTIVE_SET_CHANNEL = "ironrise-active-set-v1"
internal const val COUNTDOWN_NOTIFICATION_ID = 40101
internal const val COMPLETION_NOTIFICATION_ID = 40102
internal const val ALARM_REQUEST_CODE = 40103
internal const val SKIP_REQUEST_CODE = 40104
internal const val EXTEND_REQUEST_CODE = 40105
internal const val START_REQUEST_CODE = 40106
internal const val EARLY_WARNING_REQUEST_CODE = 40107
internal const val ACTIVE_SET_NOTIFICATION_ID = 40108
internal const val SET_RESULT_NOTIFICATION_ID = 40109
internal const val FINISH_SET_REQUEST_CODE = 40110
internal const val COMMIT_SET_REQUEST_CODE = 40111
internal const val ADJUST_WEIGHT_UP_REQUEST_CODE = 40112
internal const val ADJUST_WEIGHT_DOWN_REQUEST_CODE = 40113
internal const val ADJUST_REPS_UP_REQUEST_CODE = 40114
internal const val ADJUST_REPS_DOWN_REQUEST_CODE = 40115
internal const val CANCEL_SET_REQUEST_CODE = 40116
internal const val MORE_REQUEST_CODE = 40117
internal const val ACTION_SKIP = "expo.modules.ironriseresttimer.SKIP"
internal const val ACTION_EXTEND = "expo.modules.ironriseresttimer.EXTEND"
internal const val ACTION_START = "expo.modules.ironriseresttimer.START"
internal const val ACTION_FINISH_SET = "expo.modules.ironriseresttimer.FINISH_SET"
internal const val ACTION_COMMIT_SET = "expo.modules.ironriseresttimer.COMMIT_SET"
internal const val ACTION_ADJUST_WEIGHT_UP = "expo.modules.ironriseresttimer.ADJUST_WEIGHT_UP"
internal const val ACTION_ADJUST_WEIGHT_DOWN = "expo.modules.ironriseresttimer.ADJUST_WEIGHT_DOWN"
internal const val ACTION_ADJUST_REPS_UP = "expo.modules.ironriseresttimer.ADJUST_REPS_UP"
internal const val ACTION_ADJUST_REPS_DOWN = "expo.modules.ironriseresttimer.ADJUST_REPS_DOWN"
internal const val ACTION_CANCEL_SET = "expo.modules.ironriseresttimer.CANCEL_SET"
internal const val ACTION_MORE = "expo.modules.ironriseresttimer.MORE"
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
internal const val EXTRA_EXERCISE_NAME = "exerciseName"
internal const val EXTRA_SETS_COUNT = "setsCount"
internal const val EXTRA_PLAN_WEIGHT_KG = "planWeightKg"
internal const val EXTRA_PLAN_REPS = "planReps"
internal const val EXTRA_EXERCISE_INDEX = "exerciseIndex"
internal const val EXTRA_EXERCISES_COUNT = "exercisesCount"
internal const val EXTRA_CURRENT_WEIGHT_KG = "currentWeightKg"
internal const val EXTRA_CURRENT_REPS = "currentReps"
internal const val EXTRA_RESULT_LAYOUT = "resultLayout"
internal const val EXTRA_RESULT_INPUT = "ironrise_result_input"
internal const val SET_RESULT_WEIGHT_STEP_KG = 5.0
internal const val SET_RESULT_LAYOUT_COUNT = 5
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
      // Возвращаем признак реального запуска: RingtoneManager на части
      // устройств не проигрывает raw-ресурсы, вызывающая сторона должна
      // уметь откатиться на expo-audio.
      val ringtone = completionSoundUri(context, completionSound)
        ?.let { RingtoneManager.getRingtone(context, it) }
      val started = ringtone != null
      ringtone?.play()
      started
    }

    Function("clearCountdown") {
      clearCountdownNotification(context)
    }

    Function("updateActiveWorkoutWidget") { payload: Map<String, Any?> ->
      updateActiveWorkoutWidget(context, payload)
    }

    Function("updateWeeklyStatsWidget") { payload: Map<String, Any?> ->
      updateWeeklyStatsWidget(context, payload)
    }

    Function("consumeActiveWorkoutWidgetAction") {
      consumeActiveWorkoutWidgetAction(context)
    }

    Function("consumePendingAction") {
      consumePendingAction(context)
    }

    Function("showActiveSetNotification") { payload: Map<String, Any?> ->
      showActiveSetNotification(
        context = context,
        exerciseName = payload["exerciseName"] as? String ?: "",
        setIndex = (payload["setIndex"] as? Number)?.toInt() ?: -1,
        setsCount = (payload["setsCount"] as? Number)?.toInt() ?: 0,
        planWeightKg = (payload["planWeightKg"] as? Number)?.toDouble() ?: 0.0,
        planReps = (payload["planReps"] as? Number)?.toInt() ?: 0,
        exerciseIndex = (payload["exerciseIndex"] as? Number)?.toInt() ?: -1,
        exercisesCount = (payload["exercisesCount"] as? Number)?.toInt() ?: 0,
        exerciseId = payload["exerciseId"] as? String ?: ""
      )
    }

    Function("clearActiveSetNotification") {
      clearActiveSetNotification(context)
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
  val primaryActionLabel = if (finishExercise) "Следующее упражнение" else "Следующий подход"
  val primaryActionIcon = if (finishExercise) android.R.drawable.ic_menu_save else android.R.drawable.ic_media_play
  Log.d(REST_TIMER_LOG_TAG, "countdown shown: endAt=$restEndAt action=$nextActionKind exerciseId=$exerciseId nextSetIndex=$nextSetIndex")
  // Отдых означает, что предыдущий подход завершён: снимаем зеркала подхода и ввода результата.
  NotificationManagerCompat.from(context).cancel(ACTIVE_SET_NOTIFICATION_ID)
  NotificationManagerCompat.from(context).cancel(SET_RESULT_NOTIFICATION_ID)

  val content = when {
    targetLabel.isBlank() -> "До следующего подхода"
    currentHeartRateBpm > 0 -> "ЧСС $currentHeartRateBpm · цель $targetLabel $targetFromBpm–$targetToBpm"
    else -> "Цель пульса: $targetLabel · $targetFromBpm–$targetToBpm уд/мин"
  } + nextSetSummary(nextSetIndex, nextSetWeight, nextSetReps)

  val builder = NotificationCompat.Builder(context, COUNTDOWN_CHANNEL)
    .setSmallIcon(R.drawable.ironrise_notification)
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
  builder.addAction(
    android.R.drawable.ic_input_add,
    "+30 секунд",
    restActionPendingIntent(context, ACTION_EXTEND, restEndAt, targetLabel, targetFromBpm, targetToBpm, EXTEND_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
  )
  builder.addAction(
    primaryActionIcon,
    primaryActionLabel,
    restActionPendingIntent(context, ACTION_START, restEndAt, targetLabel, targetFromBpm, targetToBpm, START_REQUEST_CODE, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
  )
  NotificationManagerCompat.from(context).notify(COUNTDOWN_NOTIFICATION_ID, builder.build())
  scheduleCompletionAlarm(context, restEndAt, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
}

internal fun nextSetSummary(nextSetIndex: Int, weight: String, reps: String): String =
  if (nextSetIndex >= 0 && (weight.isNotBlank() || reps.isNotBlank())) " · Далее: $weight кг × $reps" else ""

internal fun clearCountdownNotification(context: Context) {
  Log.d(REST_TIMER_LOG_TAG, "countdown cleared")
  NotificationManagerCompat.from(context).cancel(COUNTDOWN_NOTIFICATION_ID)
  NotificationManagerCompat.from(context).cancel(COMPLETION_NOTIFICATION_ID)
  val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  completionPendingIntent(context, PendingIntent.FLAG_NO_CREATE)?.let { alarmManager.cancel(it) }
  earlyWarningPendingIntent(context, PendingIntent.FLAG_NO_CREATE)?.let { alarmManager.cancel(it) }
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
  nextSetReps: String = ""
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
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_IMMUTABLE else 0
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
  val earlyWarningAt = restEndAt - 10_000L
  if (earlyWarningAt > System.currentTimeMillis()) {
    val earlyWarning = earlyWarningPendingIntent(context, 0, completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && manager.canScheduleExactAlarms()) {
      manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, earlyWarningAt, earlyWarning)
    } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, earlyWarningAt, earlyWarning)
    } else {
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, earlyWarningAt, earlyWarning)
    }
  }
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && manager.canScheduleExactAlarms()) {
    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
    manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  } else {
    manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, restEndAt, pendingIntent)
  }
}

internal fun earlyWarningPendingIntent(
  context: Context,
  flags: Int,
  completionSound: String = "female",
  completionVolume: Float = 0.8f,
  completionVibrationEnabled: Boolean = true,
  completionVibrationPattern: String = "short",
): PendingIntent {
  val intent = Intent(context, RestTimerEarlyWarningReceiver::class.java).apply {
    action = "expo.modules.ironriseresttimer.EARLY_WARNING"
    putExtra(EXTRA_COMPLETION_SOUND, completionSound)
    putExtra(EXTRA_COMPLETION_VOLUME, completionVolume)
    putExtra(EXTRA_COMPLETION_VIBRATION, completionVibrationEnabled)
    putExtra(EXTRA_COMPLETION_VIBRATION_PATTERN, completionVibrationPattern)
  }
  return PendingIntent.getBroadcast(
    context,
    EARLY_WARNING_REQUEST_CODE,
    intent,
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE or flags,
  )
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

internal data class ActiveSetNotificationState(
  val exerciseName: String,
  val setIndex: Int,
  val setsCount: Int,
  val planWeightKg: Double,
  val planReps: Int,
  val exerciseIndex: Int,
  val exercisesCount: Int,
  val exerciseId: String,
  val currentWeightKg: Double,
  val currentReps: Int,
  val resultLayout: Int
)

internal fun formatSetWeightKg(weightKg: Double): String =
  if (weightKg == Math.floor(weightKg)) String.format(java.util.Locale.US, "%d", weightKg.toInt())
  else String.format(java.util.Locale.US, "%.1f", weightKg)

internal fun setPlanSummary(state: ActiveSetNotificationState): String {
  val plan = "План: ${formatSetWeightKg(state.planWeightKg)} кг × ${state.planReps}"
  val position = if (state.exerciseIndex >= 0 && state.exercisesCount > 0) " · Упражнение ${state.exerciseIndex + 1} из ${state.exercisesCount}" else ""
  return plan + position
}

internal fun showActiveSetNotification(
  context: Context,
  exerciseName: String,
  setIndex: Int,
  setsCount: Int,
  planWeightKg: Double,
  planReps: Int,
  exerciseIndex: Int,
  exercisesCount: Int,
  exerciseId: String
) {
  if (setIndex < 0) {
    Log.d(REST_TIMER_LOG_TAG, "active set notification ignored: setIndex=$setIndex")
    return
  }
  ensureActiveSetChannel(context)
  val state = ActiveSetNotificationState(
    exerciseName = exerciseName,
    setIndex = setIndex,
    setsCount = setsCount,
    planWeightKg = planWeightKg,
    planReps = planReps,
    exerciseIndex = exerciseIndex,
    exercisesCount = exercisesCount,
    exerciseId = exerciseId,
    currentWeightKg = planWeightKg,
    currentReps = planReps,
    resultLayout = 0
  )
  Log.d(REST_TIMER_LOG_TAG, "active set shown: exerciseId=$exerciseId setIndex=$setIndex sets=$setsCount")
  NotificationManagerCompat.from(context).cancel(SET_RESULT_NOTIFICATION_ID)
  NotificationManagerCompat.from(context).notify(ACTIVE_SET_NOTIFICATION_ID, buildActiveSetNotification(context, state))
}

internal fun buildActiveSetNotification(context: Context, state: ActiveSetNotificationState): android.app.Notification {
  val builder = NotificationCompat.Builder(context, ACTIVE_SET_CHANNEL)
    .setSmallIcon(R.drawable.ironrise_notification)
    .setContentTitle("Подход ${state.setIndex + 1} из ${state.setsCount.coerceAtLeast(state.setIndex + 1)} · ${state.exerciseName.ifBlank { "Упражнение" }}")
    .setContentText(setPlanSummary(state))
    // Не ongoing: Huawei Health зеркалирует на часы только обычные
    // уведомления панели; постоянные до часов не доходят. Уведомление
    // пере-постится при каждом изменении состояния, постоянность не нужна.
    .setOngoing(false)
    .setOnlyAlertOnce(true)
    .setCategory(NotificationCompat.CATEGORY_WORKOUT)
    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    .setPriority(NotificationCompat.PRIORITY_LOW)
  builder.addAction(
    android.R.drawable.ic_media_play,
    "Завершить подход",
    setActionPendingIntent(context, ACTION_FINISH_SET, state, FINISH_SET_REQUEST_CODE)
  )
  return builder.build()
}

internal fun showSetResultNotification(context: Context, state: ActiveSetNotificationState) {
  ensureActiveSetChannel(context)
  Log.d(REST_TIMER_LOG_TAG, "set result shown: exerciseId=${state.exerciseId} setIndex=${state.setIndex} weight=${state.currentWeightKg} reps=${state.currentReps} layout=${state.resultLayout}")
  NotificationManagerCompat.from(context).cancel(ACTIVE_SET_NOTIFICATION_ID)
  val builder = NotificationCompat.Builder(context, ACTIVE_SET_CHANNEL)
    .setSmallIcon(R.drawable.ironrise_notification)
    .setContentTitle("Результат подхода ${state.setIndex + 1} · ${state.exerciseName.ifBlank { "Упражнение" }}")
    .setContentText("${formatSetWeightKg(state.currentWeightKg)} кг × ${state.currentReps}")
    // Не ongoing по той же причине: обычное уведомление зеркалируется на часы.
    .setOngoing(false)
    .setOnlyAlertOnce(true)
    .setCategory(NotificationCompat.CATEGORY_WORKOUT)
    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
    .setPriority(NotificationCompat.PRIORITY_HIGH)
  // Зеркалируемые уведомления Huawei показывают до трёх действий в ряду, поэтому
  // «Ещё» переключает раскладку корректировок по кругу:
  // +5 кг → −5 кг → +1 повтор → −1 повтор → Отменить.
  val primaryLabel = when (state.resultLayout % SET_RESULT_LAYOUT_COUNT) {
    1 -> "−5 кг"
    2 -> "+1 повтор"
    3 -> "−1 повтор"
    4 -> "Отменить"
    else -> "+5 кг"
  }
  val primaryAction = when (state.resultLayout % SET_RESULT_LAYOUT_COUNT) {
    1 -> ACTION_ADJUST_WEIGHT_DOWN
    2 -> ACTION_ADJUST_REPS_UP
    3 -> ACTION_ADJUST_REPS_DOWN
    4 -> ACTION_CANCEL_SET
    else -> ACTION_ADJUST_WEIGHT_UP
  }
  val primaryRequestCode = when (state.resultLayout % SET_RESULT_LAYOUT_COUNT) {
    1 -> ADJUST_WEIGHT_DOWN_REQUEST_CODE
    2 -> ADJUST_REPS_UP_REQUEST_CODE
    3 -> ADJUST_REPS_DOWN_REQUEST_CODE
    4 -> CANCEL_SET_REQUEST_CODE
    else -> ADJUST_WEIGHT_UP_REQUEST_CODE
  }
  val primaryIcon = when (state.resultLayout % SET_RESULT_LAYOUT_COUNT) {
    4 -> android.R.drawable.ic_menu_revert
    else -> android.R.drawable.ic_input_add
  }
  builder.addAction(
    primaryIcon,
    primaryLabel,
    setActionPendingIntent(context, primaryAction, state, primaryRequestCode)
  )
  builder.addAction(
    android.R.drawable.ic_menu_manage,
    "Ещё",
    setActionPendingIntent(context, ACTION_MORE, state, MORE_REQUEST_CODE)
  )
  // «Готово» с RemoteInput: прямой ввод «вес × повторы» цифрами с клавиатуры
  // уведомления на телефоне (Android 7+). PendingIntent действия с RemoteInput
  // обязан быть mutable, иначе система не сможет дописать введённый текст в
  // extras. На зеркальные уведомления Huawei RemoteInput не пробрасывается —
  // там остаются кнопки-корректировки. Extras intent'а уже содержат текущие
  // вес/повторы (совместимость со старым путём и восстановлением из extras).
  val remoteInput = RemoteInput.Builder(EXTRA_RESULT_INPUT)
    .setLabel("Вес × повторы, напр. 80 x 8")
    .setAllowGeneratedReplies(false)
    .build()
  val commitAction = NotificationCompat.Action.Builder(
    android.R.drawable.ic_menu_save,
    "Готово",
    setActionPendingIntent(context, ACTION_COMMIT_SET, state, COMMIT_SET_REQUEST_CODE, mutable = true)
  )
    .addRemoteInput(remoteInput)
    .build()
  builder.addAction(commitAction)
  NotificationManagerCompat.from(context).notify(SET_RESULT_NOTIFICATION_ID, builder.build())
}

internal fun clearActiveSetNotification(context: Context) {
  Log.d(REST_TIMER_LOG_TAG, "active set notifications cleared")
  NotificationManagerCompat.from(context).cancel(ACTIVE_SET_NOTIFICATION_ID)
  NotificationManagerCompat.from(context).cancel(SET_RESULT_NOTIFICATION_ID)
}

internal fun setActionPendingIntent(
  context: Context,
  action: String,
  state: ActiveSetNotificationState,
  requestCode: Int,
  mutable: Boolean = false
): PendingIntent {
  val intent = Intent(context, RestTimerActionReceiver::class.java).apply {
    this.action = action
    putExtra(EXTRA_EXERCISE_ID, state.exerciseId)
    putExtra(EXTRA_NEXT_SET_INDEX, state.setIndex)
    putExtra(EXTRA_EXERCISE_NAME, state.exerciseName)
    putExtra(EXTRA_SETS_COUNT, state.setsCount)
    putExtra(EXTRA_PLAN_WEIGHT_KG, state.planWeightKg)
    putExtra(EXTRA_PLAN_REPS, state.planReps)
    putExtra(EXTRA_EXERCISE_INDEX, state.exerciseIndex)
    putExtra(EXTRA_EXERCISES_COUNT, state.exercisesCount)
    putExtra(EXTRA_CURRENT_WEIGHT_KG, state.currentWeightKg)
    putExtra(EXTRA_CURRENT_REPS, state.currentReps)
    putExtra(EXTRA_RESULT_LAYOUT, state.resultLayout)
  }
  // RemoteInput требует mutable PendingIntent: система дописывает введённый
  // текст в EXTRA_RESULT_INPUT перед доставкой broadcast.
  val mutabilityFlag =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      if (mutable) PendingIntent.FLAG_MUTABLE else PendingIntent.FLAG_IMMUTABLE
    } else {
      0
    }
  return PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or mutabilityFlag)
}

internal fun activeSetStateFromIntent(intent: Intent): ActiveSetNotificationState =
  ActiveSetNotificationState(
    exerciseName = intent.getStringExtra(EXTRA_EXERCISE_NAME) ?: "",
    setIndex = intent.getIntExtra(EXTRA_NEXT_SET_INDEX, -1),
    setsCount = intent.getIntExtra(EXTRA_SETS_COUNT, 0),
    planWeightKg = intent.getDoubleExtra(EXTRA_PLAN_WEIGHT_KG, 0.0),
    planReps = intent.getIntExtra(EXTRA_PLAN_REPS, 0),
    exerciseIndex = intent.getIntExtra(EXTRA_EXERCISE_INDEX, -1),
    exercisesCount = intent.getIntExtra(EXTRA_EXERCISES_COUNT, 0),
    exerciseId = intent.getStringExtra(EXTRA_EXERCISE_ID) ?: "",
    currentWeightKg = intent.getDoubleExtra(EXTRA_CURRENT_WEIGHT_KG, 0.0),
    currentReps = intent.getIntExtra(EXTRA_CURRENT_REPS, 0),
    resultLayout = intent.getIntExtra(EXTRA_RESULT_LAYOUT, 0)
  )

private fun ensureActiveSetChannel(context: Context) {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
  val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
  val channel = NotificationChannel(ACTIVE_SET_CHANNEL, "Тренировка", NotificationManager.IMPORTANCE_LOW).apply {
    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    setShowBadge(false)
    enableVibration(false)
  }
  manager.createNotificationChannel(channel)
}
