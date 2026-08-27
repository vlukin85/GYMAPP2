package expo.modules.ironriseresttimer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

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
    }
  }
}
