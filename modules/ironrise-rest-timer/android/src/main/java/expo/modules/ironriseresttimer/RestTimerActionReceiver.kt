package expo.modules.ironriseresttimer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class RestTimerActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    val restEndAt = intent.getLongExtra(EXTRA_REST_END_AT, 0)
    if (action == ACTION_SKIP) {
      clearCountdownNotification(context)
      savePendingAction(context, "skip", System.currentTimeMillis())
      return
    }
    if (action == ACTION_START) {
      clearCountdownNotification(context)
      savePendingAction(context, "start", System.currentTimeMillis())
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
      showCountdownNotification(context, extendedEndAt, targetLabel, targetFrom, targetTo, 0, "", completionSound, completionVolume, completionVibrationEnabled, completionVibrationPattern)
      savePendingAction(context, "extend", extendedEndAt)
    }
  }
}
