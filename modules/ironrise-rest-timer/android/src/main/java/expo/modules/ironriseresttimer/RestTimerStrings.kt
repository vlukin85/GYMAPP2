package expo.modules.ironriseresttimer

/**
 * Тексты нативных уведомлений на двух языках.
 *
 * Язык приходит из JS в payload поле `lang` ("ru" | "en") и дальше едет в
 * extras каждого действия и в состояние уведомления подхода, поэтому
 * пере-посты из receiver'ов сохраняют выбранный в настройках язык.
 * Неизвестное или пустое значение — русский (дефолт приложения).
 */
internal fun isEnglishLang(lang: String?): Boolean = lang == "en"

internal object RestTimerStrings {
  fun countdownTitle(lang: String?): String =
    if (isEnglishLang(lang)) "Rest between sets" else "Отдых между подходами"

  fun countdownUntilNextSet(lang: String?): String =
    if (isEnglishLang(lang)) "Until the next set" else "До следующего подхода"

  fun heartRateWithTarget(lang: String?, bpm: Int, label: String, fromBpm: Int, toBpm: Int): String =
    if (isEnglishLang(lang)) "HR $bpm · target $label $fromBpm–$toBpm"
    else "ЧСС $bpm · цель $label $fromBpm–$toBpm"

  fun heartRateTarget(lang: String?, label: String, fromBpm: Int, toBpm: Int): String =
    if (isEnglishLang(lang)) "Target HR: $label · $fromBpm–$toBpm bpm"
    else "Цель пульса: $label · $fromBpm–$toBpm уд/мин"

  fun nextSetSummary(lang: String?, weight: String, reps: String): String =
    if (isEnglishLang(lang)) " · Next: $weight kg × $reps"
    else " · Далее: $weight кг × $reps"

  fun skip(lang: String?): String =
    if (isEnglishLang(lang)) "Skip" else "Пропустить"

  fun extend30(lang: String?): String =
    if (isEnglishLang(lang)) "+30 sec" else "+30 секунд"

  fun nextSet(lang: String?): String =
    if (isEnglishLang(lang)) "Next set" else "Следующий подход"

  fun nextExercise(lang: String?): String =
    if (isEnglishLang(lang)) "Next exercise" else "Следующее упражнение"

  fun restCompletedTitle(lang: String?): String =
    if (isEnglishLang(lang)) "Rest complete" else "Отдых завершён"

  fun restCompletedBodyNextSet(lang: String?): String =
    if (isEnglishLang(lang)) "Time for the next set." else "Время следующего подхода."

  fun restCompletedBodyLastSet(lang: String?): String =
    if (isEnglishLang(lang)) "Last set completed." else "Последний подход завершён."

  fun restTimerChannel(lang: String?): String =
    if (isEnglishLang(lang)) "Rest timer" else "Таймер отдыха"

  fun workoutChannel(lang: String?): String =
    if (isEnglishLang(lang)) "Workout" else "Тренировка"

  fun restCompletedChannel(lang: String?): String =
    if (isEnglishLang(lang)) "Rest complete" else "Отдых завершён"

  fun planSummary(lang: String?, weight: String, reps: Int): String =
    if (isEnglishLang(lang)) "Plan: $weight kg × $reps"
    else "План: $weight кг × $reps"

  fun exercisePosition(lang: String?, index: Int, count: Int): String =
    if (isEnglishLang(lang)) " · Exercise $index of $count"
    else " · Упражнение $index из $count"

  fun exerciseFallback(lang: String?): String =
    if (isEnglishLang(lang)) "Exercise" else "Упражнение"

  fun activeSetTitle(lang: String?, setNumber: Int, setsCount: Int, exerciseName: String): String =
    if (isEnglishLang(lang)) "Set $setNumber of $setsCount · $exerciseName"
    else "Подход $setNumber из $setsCount · $exerciseName"

  fun finishSet(lang: String?): String =
    if (isEnglishLang(lang)) "Finish set" else "Завершить подход"

  fun setResultTitle(lang: String?, setNumber: Int, exerciseName: String): String =
    if (isEnglishLang(lang)) "Set result $setNumber · $exerciseName"
    else "Результат подхода $setNumber · $exerciseName"

  fun setResultValue(lang: String?, weight: String, reps: Int): String =
    if (isEnglishLang(lang)) "$weight kg × $reps" else "$weight кг × $reps"

  fun weightUp(lang: String?): String =
    if (isEnglishLang(lang)) "+5 kg" else "+5 кг"

  fun weightDown(lang: String?): String =
    if (isEnglishLang(lang)) "−5 kg" else "−5 кг"

  fun repsUp(lang: String?): String =
    if (isEnglishLang(lang)) "+1 rep" else "+1 повтор"

  fun repsDown(lang: String?): String =
    if (isEnglishLang(lang)) "−1 rep" else "−1 повтор"

  fun cancelSet(lang: String?): String =
    if (isEnglishLang(lang)) "Cancel" else "Отменить"

  fun more(lang: String?): String =
    if (isEnglishLang(lang)) "More" else "Ещё"

  fun resultInputLabel(lang: String?): String =
    if (isEnglishLang(lang)) "Weight × reps, e.g. 80 x 8"
    else "Вес × повторы, напр. 80 x 8"

  fun done(lang: String?): String =
    if (isEnglishLang(lang)) "Done" else "Готово"
}
