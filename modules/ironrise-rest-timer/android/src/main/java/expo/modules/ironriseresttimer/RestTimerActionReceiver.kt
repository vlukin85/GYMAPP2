package expo.modules.ironriseresttimer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationManagerCompat

class RestTimerActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    val restEndAt = intent.getLongExtra(EXTRA_REST_END_AT, 0)
    Log.d(REST_TIMER_LOG_TAG, "notification action received: action=$action restEndAt=$restEndAt")
    if (action == ACTION_SKIP) {
      clearCountdownNotification(context)
      savePendingAction(context, "skip", System.currentTimeMillis())
      return
    }
    if (action == ACTION_START) {
      clearCountdownNotification(context)
      val nextActionKind = intent.getStringExtra(EXTRA_NEXT_ACTION_KIND) ?: "start"
      val exerciseId = intent.getStringExtra(EXTRA_EXERCISE_ID) ?: ""
      Log.d(REST_TIMER_LOG_TAG, "primary action selected: kind=$nextActionKind exerciseId=$exerciseId")
      savePendingAction(context, nextActionKind, System.currentTimeMillis(), exerciseId)
      return
    }
    if (action == ACTION_EXTEND) {
      val extendedEndAt = maxOf(restEndAt, System.currentTimeMillis()) + 30_000
      val targetLabel = intent.getStringExtra(EXTRA_TARGET_LABEL) ?: ""
      val targetFrom = intent.getIntExtra(EXTRA_TARGET_FROM, 0)
      val targetTo = intent.getIntExtra(EXTRA_TARGET_TO, 0)
      val completionSound = intent.getStringExtra(EXTRA_COMPLETION_SOUND) ?: "female"
      val completionVolume = intent.getFloatExtra(EXTRA_COMPLETION_VOLUME, 0.8f)
      val completionVibrationEnabled = intent.getBooleanExtra(EXTRA_COMPLETION_VIBRATION, true)
      val completionVibrationPattern = intent.getStringExtra(EXTRA_COMPLETION_VIBRATION_PATTERN) ?: "short"
      val nextActionKind = intent.getStringExtra(EXTRA_NEXT_ACTION_KIND) ?: "start"
      val exerciseId = intent.getStringExtra(EXTRA_EXERCISE_ID) ?: ""
      val nextSetIndex = intent.getIntExtra(EXTRA_NEXT_SET_INDEX, -1)
      val nextSetWeight = intent.getStringExtra(EXTRA_NEXT_SET_WEIGHT) ?: ""
      val nextSetReps = intent.getStringExtra(EXTRA_NEXT_SET_REPS) ?: ""
      Log.d(REST_TIMER_LOG_TAG, "rest extended: endAt=$extendedEndAt action=$nextActionKind exerciseId=$exerciseId")
      showCountdownNotification(context, extendedEndAt, targetLabel, targetFrom, targetTo, 0, "", completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern, nextActionKind, exerciseId, nextSetIndex, nextSetWeight, nextSetReps)
      savePendingAction(context, "extend", extendedEndAt)
      return
    }
    if (action == ACTION_FINISH_SET) {
      val state = activeSetStateFromIntent(intent)
      if (state.setIndex < 0) return
      // Значения ввода результата инициализируются планом и хранятся в статике,
      // а параллельно едут в extras каждого действия — на случай смерти процесса.
      currentWeightKg = state.planWeightKg
      currentReps = state.planReps
      resultLayout = 0
      showSetResultNotification(context, state.copy(currentWeightKg = state.planWeightKg, currentReps = state.planReps, resultLayout = 0))
      return
    }
    if (action == ACTION_ADJUST_WEIGHT_UP || action == ACTION_ADJUST_WEIGHT_DOWN) {
      val state = activeSetStateFromIntent(intent)
      if (state.setIndex < 0) return
      val weight = currentWeight(state)
      val adjusted = if (action == ACTION_ADJUST_WEIGHT_UP) weight + SET_RESULT_WEIGHT_STEP_KG else (weight - SET_RESULT_WEIGHT_STEP_KG).coerceAtLeast(0.0)
      currentWeightKg = adjusted
      currentReps = state.currentReps
      resultLayout = state.resultLayout
      showSetResultNotification(context, state.copy(currentWeightKg = adjusted))
      return
    }
    if (action == ACTION_ADJUST_REPS_UP || action == ACTION_ADJUST_REPS_DOWN) {
      val state = activeSetStateFromIntent(intent)
      if (state.setIndex < 0) return
      val reps = currentRepsOf(state)
      val adjusted = if (action == ACTION_ADJUST_REPS_UP) reps + 1 else (reps - 1).coerceAtLeast(1)
      currentWeightKg = state.currentWeightKg
      currentReps = adjusted
      resultLayout = state.resultLayout
      showSetResultNotification(context, state.copy(currentReps = adjusted))
      return
    }
    if (action == ACTION_MORE) {
      val state = activeSetStateFromIntent(intent)
      if (state.setIndex < 0) return
      val nextLayout = (state.resultLayout + 1) % SET_RESULT_LAYOUT_COUNT
      currentWeightKg = state.currentWeightKg
      currentReps = state.currentReps
      resultLayout = nextLayout
      showSetResultNotification(context, state.copy(resultLayout = nextLayout))
      return
    }
    if (action == ACTION_COMMIT_SET) {
      val state = activeSetStateFromIntent(intent)
      if (state.setIndex < 0) return
      val weight = currentWeight(state)
      val reps = currentRepsOf(state)
      Log.d(REST_TIMER_LOG_TAG, "set committed: exerciseId=${state.exerciseId} setIndex=${state.setIndex} weight=$weight reps=$reps")
      NotificationManagerCompat.from(context).cancel(SET_RESULT_NOTIFICATION_ID)
      currentWeightKg = 0.0
      currentReps = 0
      resultLayout = 0
      savePendingAction(context, "commit-set", System.currentTimeMillis(), state.exerciseId, state.setIndex, formatSetWeightKg(weight), reps.toString())
      return
    }
    if (action == ACTION_CANCEL_SET) {
      val state = activeSetStateFromIntent(intent)
      if (state.setIndex < 0) return
      Log.d(REST_TIMER_LOG_TAG, "set result cancelled: exerciseId=${state.exerciseId} setIndex=${state.setIndex}")
      NotificationManagerCompat.from(context).cancel(SET_RESULT_NOTIFICATION_ID)
      currentWeightKg = state.planWeightKg
      currentReps = state.planReps
      resultLayout = 0
      showActiveSetNotification(context, state.exerciseName, state.setIndex, state.setsCount, state.planWeightKg, state.planReps, state.exerciseIndex, state.exercisesCount, state.exerciseId)
    }
  }

  private fun currentWeight(state: ActiveSetNotificationState): Double =
    if (currentWeightKg > 0.0) currentWeightKg else state.currentWeightKg

  private fun currentRepsOf(state: ActiveSetNotificationState): Int =
    if (currentReps > 0) currentReps else state.currentReps

  private companion object {
    // Текущие значения ввода результата живут в статике receiver'а; extras остаются
    // резервной копией на случай, если процесс успел перезапуститься между нажатиями.
    var currentWeightKg: Double = 0.0
    var currentReps: Int = 0
    var resultLayout: Int = 0
  }
}
