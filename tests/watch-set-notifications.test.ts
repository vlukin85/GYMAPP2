import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const nativeModule = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/IronriseRestTimerModule.kt",
  ),
  "utf8",
);
const strings = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerStrings.kt",
  ),
  "utf8",
);
const actionReceiver = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerActionReceiver.kt",
  ),
  "utf8",
);
const nativeBridge = readFileSync(
  resolve(process.cwd(), "modules/ironrise-rest-timer/src/index.ts"),
  "utf8",
);
const workoutScreen = readFileSync(resolve(process.cwd(), "app/workout.tsx"), "utf8");
const research = readFileSync(
  resolve(process.cwd(), "docs/watch-notifications-research.md"),
  "utf8",
);

const activeSetBuilder =
  nativeModule.match(/internal fun buildActiveSetNotification[\s\S]*?\n}\n/)?.[0] ??
  "";
const setResultBuilder =
  nativeModule.match(/internal fun showSetResultNotification[\s\S]*?\n}\n/)?.[0] ??
  "";

describe("управление тренировкой с часов Huawei через зеркалируемые уведомления", () => {
  it("показывает зеркало выполняющегося подхода с планом и действием завершения", () => {
    expect(nativeModule).toContain('Function("showActiveSetNotification")');
    expect(nativeModule).toContain('Function("clearActiveSetNotification")');
    // Тексты живут в RestTimerStrings: оба языка присутствуют, а билдер
    // уведомления выбирает вариант по state.lang.
    expect(strings).toContain("Подход $setNumber из $setsCount · $exerciseName");
    expect(strings).toContain("Set $setNumber of $setsCount · $exerciseName");
    expect(strings).toContain("План: $weight кг × $reps");
    expect(strings).toContain("Plan: $weight kg × $reps");
    expect(nativeModule).toContain("RestTimerStrings.activeSetTitle(");
    expect(nativeModule).toContain("RestTimerStrings.planSummary(");
    expect(activeSetBuilder).toContain("RestTimerStrings.finishSet(state.lang)");
    expect(activeSetBuilder).not.toContain("+30 секунд");
    expect(activeSetBuilder.match(/builder\.addAction/g)?.length).toBe(1);
    expect(nativeModule).toContain("ACTION_FINISH_SET");
  });

  it("после завершения подхода открывает ввод результата с текущими значениями", () => {
    expect(strings).toContain("Результат подхода $setNumber · $exerciseName");
    expect(strings).toContain("Set result $setNumber · $exerciseName");
    expect(nativeModule).toContain("RestTimerStrings.setResultTitle(");
    expect(setResultBuilder).toContain("RestTimerStrings.setResultValue(");
    expect(strings).toContain('"$weight кг × $reps"');
    expect(strings).toContain('"$weight kg × $reps"');
    expect(actionReceiver).toContain("ACTION_FINISH_SET");
    expect(actionReceiver).toContain("showSetResultNotification(context");
    // Значения ввода результата хранятся в статике receiver'а.
    expect(actionReceiver).toContain("var currentWeightKg: Double");
    expect(actionReceiver).toContain("var currentReps: Int");
    expect(actionReceiver).toContain("var resultLayout: Int");
  });

  it("держит не более трёх действий в ряду и переключает раскладку кнопкой «Ещё»", () => {
    expect(setResultBuilder.match(/builder\.addAction/g)?.length).toBe(3);
    expect(strings).toContain('"Ещё"');
    expect(strings).toContain('"More"');
    expect(strings).toContain('"Готово"');
    expect(strings).toContain('"Done"');
    expect(strings).toContain('"+5 кг"');
    expect(strings).toContain('"+5 kg"');
    expect(strings).toContain('"−5 кг"');
    expect(strings).toContain('"−5 kg"');
    expect(strings).toContain('"+1 повтор"');
    expect(strings).toContain('"+1 rep"');
    expect(strings).toContain('"−1 повтор"');
    expect(strings).toContain('"−1 rep"');
    expect(strings).toContain('"Отменить"');
    expect(strings).toContain('"Cancel"');
    expect(nativeModule).toContain("RestTimerStrings.more(state.lang)");
    expect(nativeModule).toContain("RestTimerStrings.done(state.lang)");
    expect(nativeModule).toContain("ACTION_MORE");
    expect(nativeModule).toContain("SET_RESULT_LAYOUT_COUNT");
    expect(actionReceiver).toContain(
      "(state.resultLayout + 1) % SET_RESULT_LAYOUT_COUNT",
    );
    // RemoteInput теперь используется в «Готово» — см. тест про прямой ввод.
  });

  it("корректировки пересчитывают значения и пере-постят уведомление результата", () => {
    expect(actionReceiver).toContain("ACTION_ADJUST_WEIGHT_UP");
    expect(actionReceiver).toContain("ACTION_ADJUST_WEIGHT_DOWN");
    expect(actionReceiver).toContain("ACTION_ADJUST_REPS_UP");
    expect(actionReceiver).toContain("ACTION_ADJUST_REPS_DOWN");
    expect(nativeModule).toContain("SET_RESULT_WEIGHT_STEP_KG = 5.0");
    expect(actionReceiver).toContain(
      "weight + SET_RESULT_WEIGHT_STEP_KG else (weight - SET_RESULT_WEIGHT_STEP_KG)",
    );
    expect(actionReceiver).toContain(".coerceAtLeast(1)");
    expect(actionReceiver).toContain("ACTION_CANCEL_SET");
    expect(actionReceiver).toContain(
      "showActiveSetNotification(context, state.exerciseName, state.setIndex",
    );
  });

  it("сохраняет commit-set в pendingAction с финальными weight и reps", () => {
    expect(actionReceiver).toContain('ACTION_COMMIT_SET');
    expect(actionReceiver).toContain(
      'savePendingAction(context, "commit-set", System.currentTimeMillis(), state.exerciseId, state.setIndex, formatSetWeightKg(weight), reps.toString())',
    );
    expect(nativeBridge).toContain(
      'kind: "skip" | "extend" | "start" | "finish-exercise" | "commit-set"',
    );
    expect(workoutScreen).toContain('action.kind === "commit-set"');
    expect(workoutScreen).toContain("setPendingNativeSetCommit({");
  });

  it("применяет результат с часов тем же кодом, что и завершение подхода из интерфейса", () => {
    expect(workoutScreen).toContain("const completeSetDraft = (");
    expect(workoutScreen).toMatch(
      /const finishSetFromWidget[\s\S]*?completeSetDraft\(setIndex, completedDraft\)/,
    );
    expect(workoutScreen).toMatch(
      /const finishSetFromWatch[\s\S]*?completeSetDraft\(targetIndex, completedDraft\)/,
    );
    expect(workoutScreen).toMatch(
      /finishSetFromWatch\(\s*commit\.exerciseId,\s*commit\.setIndex,\s*commit\.weight,\s*commit\.reps,?\s*\)/,
    );
  });

  it("показывает и обновляет зеркало подхода из JS и убирает его вне подхода", () => {
    expect(nativeBridge).toContain("showNativeActiveSetNotification(");
    expect(nativeBridge).toContain("clearNativeActiveSetNotification()");
    expect(nativeBridge).toContain("NativeActiveSetPayload = {");
    expect(workoutScreen).toContain("showNativeActiveSetNotification({");
    expect(workoutScreen).toContain("clearNativeActiveSetNotification()");
    expect(workoutScreen).toContain("planWeightKg: Number(activePlan.weight) || 0");
    expect(workoutScreen).toContain("exerciseIndex: sessionExercises.findIndex(");
  });

  it("опрашивает нативные действия и во время выполняющегося подхода", () => {
    expect(workoutScreen).toContain("if (!restEndAt && !activeSet) return;");
    expect(workoutScreen).toContain("synchronize();");
    expect(workoutScreen).toContain("clearNativeActiveSetNotification();");
  });

  it("переключает упражнение из нативного уведомления отдыха", () => {
    expect(strings).toContain('"Следующий подход"');
    expect(strings).toContain('"Next set"');
    expect(strings).toContain('"Следующее упражнение"');
    expect(strings).toContain('"Next exercise"');
    expect(nativeModule).toContain("RestTimerStrings.nextSet(lang)");
    expect(nativeModule).toContain("RestTimerStrings.nextExercise(lang)");
    expect(actionReceiver).toContain("ACTION_START");
    expect(workoutScreen).toContain("setPendingExerciseAdvance(exerciseId)");
    expect(workoutScreen).toContain("openExercise(next.exerciseId)");
  });

  it("принимает вес и повторы цифрами в действии «Готово» через RemoteInput", () => {
    expect(nativeModule).toContain(
      'internal const val EXTRA_RESULT_INPUT = "ironrise_result_input"',
    );
    expect(setResultBuilder).toContain("RemoteInput.Builder(EXTRA_RESULT_INPUT)");
    expect(setResultBuilder).toContain(
      "RestTimerStrings.resultInputLabel(state.lang)",
    );
    expect(strings).toContain('"Вес × повторы, напр. 80 x 8"');
    expect(strings).toContain('"Weight × reps, e.g. 80 x 8"');
    expect(setResultBuilder).toContain(".addRemoteInput(remoteInput)");
    // PendingIntent действия с RemoteInput обязан быть mutable: система
    // дописывает введённый текст в extras перед доставкой broadcast.
    expect(setResultBuilder).toContain(
      "COMMIT_SET_REQUEST_CODE, mutable = true",
    );
    expect(nativeModule).toContain(
      "if (mutable) PendingIntent.FLAG_MUTABLE else PendingIntent.FLAG_IMMUTABLE",
    );
    // Тап по карточке и ввод из клавиатуры уведомления приходят в один
    // ACTION_COMMIT_SET broadcast.
    expect(actionReceiver).toContain("RemoteInput.getResultsFromIntent(intent)");
    expect(actionReceiver).toContain("applyResultInput(");
  });

  it("parseResultInput понимает форматы «80 x 8» и отбрасывает мусор", () => {
    const parseFn =
      actionReceiver.match(/internal fun parseResultInput[\s\S]*?\n}\n/)?.[0] ??
      "";
    const pattern =
      actionReceiver.match(/Regex\("""([^"]+)"""/)?.[1] ?? "";
    // Разделители: латинская x, русская х, ×, *, пробел, запятая.
    expect(pattern).toContain("[xх×*]");
    expect(pattern).toContain("|\\s+|,");
    // Вес десятичный: точка или запятая («80,5 x 6» = 80.5 кг × 6).
    expect(pattern).toContain("(?:[.,]\\d+)?");
    expect(parseFn).toContain("matchEntire");
    expect(parseFn).toContain("toDoubleOrNull()");
    expect(parseFn).toContain("toIntOrNull()");
    // Мусор и пусто → null; «0 x 8» (вес > 0) и «80 x 0» (повторы >= 1) → null.
    expect(parseFn).toContain("weight <= 0.0");
    expect(parseFn).toContain("reps < 1");
  });

  it("документирует state machine и ограничения Huawei", () => {
    expect(existsSync(resolve(process.cwd(), "docs/watch-notifications-research.md"))).toBe(
      true,
    );
    expect(research).toContain("State machine");
    expect(research).toContain("«Ещё»");
    expect(research).toContain("RemoteInput");
    expect(research).toContain("commit-set");
    expect(research).toContain("Убитый процесс");
    expect(research).toContain("Прямой ввод результата в уведомлении (телефон)");
    expect(research).toContain("«80 x 8»");
    expect(research).toContain("«80х8»");
    expect(research).toContain("«80×8»");
    expect(research).toContain("«80*8»");
    expect(research).toContain("«80 8»");
    expect(research).toContain("«80,8»");
    expect(research).toContain("«80,5 x 6»");
    expect(research).toContain("mutable");
  });
});
