package expo.modules.ironriseresttimer

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews

private const val WIDGET_PREFERENCES = "ironrise.active.workout.widget"
private const val WIDGET_ACTION_PREFERENCES = "ironrise.active.workout.widget.actions"
private const val WIDGET_ACTION_OPEN = "expo.modules.ironriseresttimer.widget.OPEN"
private const val WIDGET_ACTION_START_SET = "expo.modules.ironriseresttimer.widget.START_SET"
private const val WIDGET_ACTION_FINISH_SET = "expo.modules.ironriseresttimer.widget.FINISH_SET"
private const val WIDGET_ACTION_EXTEND_REST = "expo.modules.ironriseresttimer.widget.EXTEND_REST"
private const val WIDGET_ACTION_SKIP_REST = "expo.modules.ironriseresttimer.widget.SKIP_REST"
private const val WIDGET_EXTRA_EXERCISE_ID = "exerciseId"
private const val WIDGET_EXTRA_SET_INDEX = "setIndex"
private const val WIDGET_EXTRA_REST_END_AT = "restEndAt"
private const val WIDGET_EXTRA_OPEN_URL = "openUrl"

private data class ActiveWorkoutWidgetState(
  val active: Boolean = false,
  val programName: String = "IronRise",
  val exerciseName: String = "Откройте тренировку",
  val completedSets: Int = 0,
  val totalSets: Int = 0,
  val exerciseId: String = "",
  val setIndex: Int = -1,
  val activeSet: Boolean = false,
  val restEndAt: Long = 0L,
  val openUrl: String = "",
)

internal fun updateActiveWorkoutWidget(context: Context, payload: Map<String, Any?>) {
  val state = ActiveWorkoutWidgetState(
    active = payload["active"] as? Boolean ?: false,
    programName = payload["programName"] as? String ?: "IronRise",
    exerciseName = payload["exerciseName"] as? String ?: "Откройте тренировку",
    completedSets = ((payload["completedSets"] as? Number)?.toInt() ?: 0).coerceAtLeast(0),
    totalSets = ((payload["totalSets"] as? Number)?.toInt() ?: 0).coerceAtLeast(0),
    exerciseId = payload["exerciseId"] as? String ?: "",
    setIndex = (payload["setIndex"] as? Number)?.toInt() ?: -1,
    activeSet = payload["activeSet"] as? Boolean ?: false,
    restEndAt = (payload["restEndAt"] as? Number)?.toLong() ?: 0L,
    openUrl = payload["openUrl"] as? String ?: "",
  )
  saveActiveWorkoutWidgetState(context, state)
  refreshActiveWorkoutWidget(context)
}

internal fun consumeActiveWorkoutWidgetAction(context: Context): Map<String, Any>? {
  val preferences = context.getSharedPreferences(WIDGET_ACTION_PREFERENCES, Context.MODE_PRIVATE)
  val kind = preferences.getString("kind", null) ?: return null
  val exerciseId = preferences.getString(WIDGET_EXTRA_EXERCISE_ID, "") ?: ""
  val setIndex = preferences.getInt(WIDGET_EXTRA_SET_INDEX, -1)
  val restEndAt = preferences.getLong(WIDGET_EXTRA_REST_END_AT, 0L)
  preferences.edit().clear().apply()
  return buildMap {
    put("kind", kind)
    if (exerciseId.isNotBlank()) put("exerciseId", exerciseId)
    if (setIndex >= 0) put("setIndex", setIndex)
    if (restEndAt > 0) put("restEndAt", restEndAt)
  }
}

class ActiveWorkoutWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    appWidgetIds.forEach { appWidgetId ->
      appWidgetManager.updateAppWidget(appWidgetId, createActiveWorkoutWidgetViews(context, readActiveWorkoutWidgetState(context)))
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      WIDGET_ACTION_OPEN -> launchIronRise(context, readActiveWorkoutWidgetState(context).openUrl)
      WIDGET_ACTION_START_SET,
      WIDGET_ACTION_FINISH_SET,
      WIDGET_ACTION_EXTEND_REST,
      WIDGET_ACTION_SKIP_REST -> {
        val state = readActiveWorkoutWidgetState(context)
        val actionKind = when (intent.action) {
          WIDGET_ACTION_START_SET -> "start-set"
          WIDGET_ACTION_FINISH_SET -> "finish-set"
          WIDGET_ACTION_EXTEND_REST -> "extend-rest"
          else -> "skip-rest"
        }
        val currentEndAt = if (intent.action == WIDGET_ACTION_EXTEND_REST) {
          maxOf(state.restEndAt, System.currentTimeMillis()) + 30_000L
        } else if (intent.action == WIDGET_ACTION_SKIP_REST) 0L else state.restEndAt
        saveActiveWorkoutWidgetAction(context, actionKind, state.exerciseId, state.setIndex, currentEndAt)
        saveActiveWorkoutWidgetState(context, state.copy(restEndAt = currentEndAt))
        refreshActiveWorkoutWidget(context)
        launchIronRise(context, state.openUrl)
      }
    }
    super.onReceive(context, intent)
  }
}

private fun readActiveWorkoutWidgetState(context: Context): ActiveWorkoutWidgetState {
  val preferences = context.getSharedPreferences(WIDGET_PREFERENCES, Context.MODE_PRIVATE)
  return ActiveWorkoutWidgetState(
    active = preferences.getBoolean("active", false),
    programName = preferences.getString("programName", "IronRise") ?: "IronRise",
    exerciseName = preferences.getString("exerciseName", "Откройте тренировку") ?: "Откройте тренировку",
    completedSets = preferences.getInt("completedSets", 0),
    totalSets = preferences.getInt("totalSets", 0),
    exerciseId = preferences.getString(WIDGET_EXTRA_EXERCISE_ID, "") ?: "",
    setIndex = preferences.getInt(WIDGET_EXTRA_SET_INDEX, -1),
    activeSet = preferences.getBoolean("activeSet", false),
    restEndAt = preferences.getLong(WIDGET_EXTRA_REST_END_AT, 0L),
    openUrl = preferences.getString(WIDGET_EXTRA_OPEN_URL, "") ?: "",
  )
}

private fun saveActiveWorkoutWidgetState(context: Context, state: ActiveWorkoutWidgetState) {
  context.getSharedPreferences(WIDGET_PREFERENCES, Context.MODE_PRIVATE).edit()
    .putBoolean("active", state.active)
    .putString("programName", state.programName)
    .putString("exerciseName", state.exerciseName)
    .putInt("completedSets", state.completedSets)
    .putInt("totalSets", state.totalSets)
    .putString(WIDGET_EXTRA_EXERCISE_ID, state.exerciseId)
    .putInt(WIDGET_EXTRA_SET_INDEX, state.setIndex)
    .putBoolean("activeSet", state.activeSet)
    .putLong(WIDGET_EXTRA_REST_END_AT, state.restEndAt)
    .putString(WIDGET_EXTRA_OPEN_URL, state.openUrl)
    .apply()
}

private fun saveActiveWorkoutWidgetAction(context: Context, kind: String, exerciseId: String, setIndex: Int, restEndAt: Long) {
  context.getSharedPreferences(WIDGET_ACTION_PREFERENCES, Context.MODE_PRIVATE).edit()
    .putString("kind", kind)
    .putString(WIDGET_EXTRA_EXERCISE_ID, exerciseId)
    .putInt(WIDGET_EXTRA_SET_INDEX, setIndex)
    .putLong(WIDGET_EXTRA_REST_END_AT, restEndAt)
    .apply()
}

private fun refreshActiveWorkoutWidget(context: Context) {
  val manager = AppWidgetManager.getInstance(context)
  val provider = ComponentName(context, ActiveWorkoutWidgetProvider::class.java)
  val widgetIds = manager.getAppWidgetIds(provider)
  val state = readActiveWorkoutWidgetState(context)
  widgetIds.forEach { widgetId -> manager.updateAppWidget(widgetId, createActiveWorkoutWidgetViews(context, state)) }
}

private fun createActiveWorkoutWidgetViews(context: Context, state: ActiveWorkoutWidgetState): RemoteViews {
  val views = RemoteViews(context.packageName, R.layout.ironrise_active_workout_widget)
  val isResting = state.restEndAt > System.currentTimeMillis()
  val progress = if (state.totalSets > 0) "${state.completedSets.coerceAtMost(state.totalSets)} из ${state.totalSets} подходов" else "Подготовьте тренировку"
  views.setTextViewText(R.id.ironrise_widget_program, if (state.active) state.programName else "IRONRISE")
  views.setTextViewText(R.id.ironrise_widget_exercise, if (state.active) state.exerciseName else "Нет активной тренировки")
  views.setTextViewText(R.id.ironrise_widget_progress, if (isResting) "Отдых ${formatWidgetRemaining(state.restEndAt)}" else progress)
  val primaryAction = when {
    !state.active || state.exerciseId.isBlank() || state.setIndex < 0 -> WIDGET_ACTION_OPEN
    isResting -> WIDGET_ACTION_EXTEND_REST
    state.activeSet -> WIDGET_ACTION_FINISH_SET
    else -> WIDGET_ACTION_START_SET
  }
  val primaryLabel = when {
    !state.active || state.exerciseId.isBlank() || state.setIndex < 0 -> "Открыть"
    isResting -> "+30 сек"
    state.activeSet -> "Завершить подход"
    else -> "Начать подход"
  }
  val secondaryAction = if (isResting) WIDGET_ACTION_SKIP_REST else WIDGET_ACTION_OPEN
  val secondaryLabel = if (isResting) "Пропустить" else "Открыть"
  views.setTextViewText(R.id.ironrise_widget_primary_action, primaryLabel)
  views.setTextViewText(R.id.ironrise_widget_secondary_action, secondaryLabel)
  views.setOnClickPendingIntent(R.id.ironrise_widget_root, widgetPendingIntent(context, WIDGET_ACTION_OPEN, state, 6101))
  views.setOnClickPendingIntent(R.id.ironrise_widget_primary_action, widgetPendingIntent(context, primaryAction, state, 6102))
  views.setOnClickPendingIntent(R.id.ironrise_widget_secondary_action, widgetPendingIntent(context, secondaryAction, state, 6103))
  return views
}

private fun widgetPendingIntent(context: Context, action: String, state: ActiveWorkoutWidgetState, requestCode: Int): PendingIntent {
  val intent = Intent(context, ActiveWorkoutWidgetProvider::class.java).apply {
    this.action = action
    putExtra(WIDGET_EXTRA_EXERCISE_ID, state.exerciseId)
    putExtra(WIDGET_EXTRA_SET_INDEX, state.setIndex)
    putExtra(WIDGET_EXTRA_REST_END_AT, state.restEndAt)
  }
  val flags = PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
  return PendingIntent.getBroadcast(context, requestCode, intent, flags)
}

private fun launchIronRise(context: Context, openUrl: String) {
  if (openUrl.isNotBlank()) {
    val deepLinkIntent = Intent(Intent.ACTION_VIEW, Uri.parse(openUrl)).apply {
      setPackage(context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    runCatching { context.startActivity(deepLinkIntent) }.onSuccess { return }
  }
  context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launchIntent ->
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    context.startActivity(launchIntent)
  }
}

private fun formatWidgetRemaining(restEndAt: Long): String {
  val seconds = ((restEndAt - System.currentTimeMillis()).coerceAtLeast(0L) + 999L) / 1_000L
  return "%02d:%02d".format(seconds / 60L, seconds % 60L)
}
