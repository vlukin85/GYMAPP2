package expo.modules.ironriseresttimer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

class RestTimerEarlyWarningReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val sound = intent.getStringExtra(EXTRA_COMPLETION_SOUND) ?: "female"
    val volume = intent.getFloatExtra(EXTRA_COMPLETION_VOLUME, 0.8f).coerceIn(0.1f, 1f)
    val vibrationEnabled = intent.getBooleanExtra(EXTRA_COMPLETION_VIBRATION, true)
    Log.d(REST_TIMER_LOG_TAG, "early warning received: sound=$sound vibration=$vibrationEnabled")

    if (sound != "silent") {
      completionSoundUri(context, sound)?.let { uri ->
        RingtoneManager.getRingtone(context, uri)?.apply {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) this.volume = volume
          play()
        }
      }
    }

    if (vibrationEnabled) {
      val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.getSystemService(VibratorManager::class.java).defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
      }
      if (vibrator.hasVibrator()) {
        val pattern = when (intent.getStringExtra(EXTRA_COMPLETION_VIBRATION_PATTERN)) {
          "long" -> longArrayOf(0, 420)
          "pulse" -> longArrayOf(0, 130, 80, 130)
          else -> longArrayOf(0, 180)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
        } else {
          @Suppress("DEPRECATION")
          vibrator.vibrate(pattern, -1)
        }
      }
    }
  }
}
