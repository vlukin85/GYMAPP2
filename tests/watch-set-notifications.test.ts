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
const actionReceiver = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerActionReceiver.kt",
  ),
  "utf8",
);
const completionReceiver = readFileSync(
  resolve(
    process.cwd(),
    "modules/ironrise-rest-timer/android/src/main/java/expo/modules/ironriseresttimer/RestTimerCompletionReceiver.kt",
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
const resultCardBuilder =
  nativeModule.match(/private fun postResultActionCard[\s\S]*?\n}\n/)?.[0] ?? "";
const clearActiveSet =
  nativeModule.match(/internal fun clearActiveSetNotification[\s\S]*?\n}\n/)?.[0] ??
  "";
const cancelResultCards =
  nativeModule.match(/internal fun cancelResultActionCards[\s\S]*?\n}\n/)?.[0] ?? "";
const cancelRestCards =
  nativeModule.match(/internal fun cancelRestActionCards[\s\S]*?\n}\n/)?.[0] ?? "";

describe("управление тренировкой с часов Huawei через зеркалируемые уведомления", () => {
  it("показывает зеркало выполняющегося подхода с планом, подсказкой и тапом-завершением", () => {
    expect(nativeModule).toContain('Function("showActiveSetNotification")');
    expect(nativeModule).toContain('Function("clearActiveSetNotification")');
    expect(nativeModule).toContain(
      '"Подход ${state.setIndex + 1} из ${state.setsCount.coerceAtLeast(state.setIndex + 1)}',
    );
    expect(nativeModule).toContain(
      '"План: ${formatSetWeightKg(state.planWeightKg)} кг × ${state.planReps}"',
    );
    // Псевдокнопка: тап по карточке на часах = contentIntent «Завершить подход».
    expect(activeSetBuilder).toContain('" · Коснитесь, чтобы завершить подход"');
    expect(activeSetBuilder).toContain(
      "setContentIntent(setActionPendingIntent(context, ACTION_FINISH_SET, state, ACTIVE_SET_CONTENT_REQUEST_CODE))",
    );
    // Кнопка для телефона остаётся: на часы addAction не переносятся, но и не мешают.
    expect(activeSetBuilder).toContain('"Завершить подход"');
    expect(activeSetBuilder).not.toContain("+30 секунд");
    expect(activeSetBuilder.match(/builder\.addAction/g)?.length).toBe(1);
    expect(nativeModule).toContain("ACTION_FINISH_SET");
    expect(nativeModule).toContain("ACTIVE_SET_CONTENT_REQUEST_CODE = 40118");
  });

  it("после завершения подхода открывает ввод результата с текущими значениями", () => {
    expect(nativeModule).toContain('"Результат подхода ${state.setIndex + 1}');
    expect(setResultBuilder).toContain(
      '"${formatSetWeightKg(state.currentWeightKg)} кг × ${state.currentReps} · коснитесь, чтобы подтвердить"',
    );
    expect(actionReceiver).toContain("ACTION_FINISH_SET");
    expect(actionReceiver).toContain("showSetResultNotification(context");
    // Значения ввода результата хранятся в статике receiver'а.
    expect(actionReceiver).toContain("var currentWeightKg: Double");
    expect(actionReceiver).toContain("var currentReps: Int");
  });

  it("каждое действие ввода результата — отдельная карточка со своим contentIntent", () => {
    // Псевдокнопки вместо addAction: у каждого действия свой id уведомления.
    expect(nativeModule).toContain("SET_RESULT_NOTIFICATION_ID = 40109");
    expect(nativeModule).toContain("RESULT_WEIGHT_UP_NOTIFICATION_ID = 40121");
    expect(nativeModule).toContain("RESULT_WEIGHT_DOWN_NOTIFICATION_ID = 40122");
    expect(nativeModule).toContain("RESULT_REPS_UP_NOTIFICATION_ID = 40123");
    expect(nativeModule).toContain("RESULT_REPS_DOWN_NOTIFICATION_ID = 40124");
    expect(nativeModule).toContain("RESULT_CANCEL_NOTIFICATION_ID = 40125");
    expect(setResultBuilder).toContain("id = RESULT_WEIGHT_UP_NOTIFICATION_ID");
    expect(setResultBuilder).toContain("id = RESULT_WEIGHT_DOWN_NOTIFICATION_ID");
    expect(setResultBuilder).toContain("id = RESULT_REPS_UP_NOTIFICATION_ID");
    expect(setResultBuilder).toContain("id = RESULT_REPS_DOWN_NOTIFICATION_ID");
    expect(setResultBuilder).toContain("id = RESULT_CANCEL_NOTIFICATION_ID");
    expect(setResultBuilder).toContain("action = ACTION_ADJUST_WEIGHT_UP");
    expect(setResultBuilder).toContain("action = ACTION_ADJUST_WEIGHT_DOWN");
    expect(setResultBuilder).toContain("action = ACTION_ADJUST_REPS_UP");
    expect(setResultBuilder).toContain("action = ACTION_ADJUST_REPS_DOWN");
    expect(setResultBuilder).toContain("action = ACTION_CANCEL_SET");
    expect(setResultBuilder).toContain('"Коснитесь, чтобы прибавить 5 кг к весу"');
    expect(setResultBuilder).toContain('"Коснитесь, чтобы убрать 5 кг"');
    expect(setResultBuilder).toContain('"Коснитесь, чтобы прибавить повтор"');
    expect(setResultBuilder).toContain('"Коснитесь, чтобы убрать повтор"');
    expect(setResultBuilder).toContain('"Коснитесь, чтобы отменить и вернуться к подходу"');
    // Карточка-действие несёт свой contentIntent.
    expect(resultCardBuilder).toContain(
      "setContentIntent(setActionPendingIntent(context, action, state, requestCode))",
    );
    // Раскладка «Ещё» больше не нужна: все действия видны одновременно.
    expect(nativeModule).not.toContain('"Ещё"');
    expect(nativeModule).not.toContain("ACTION_MORE");
    expect(nativeModule).not.toContain("resultLayout");
    // RemoteInput на зеркальных уведомлениях Huawei не поддерживается.
    expect(nativeModule).not.toContain("RemoteInput");
    expect(actionReceiver).not.toContain("RemoteInput");
  });

  it("карточка «Готово» главная: высокие приоритет, сортировка и обновляемый contentIntent", () => {
    expect(setResultBuilder).toContain("setPriority(NotificationCompat.PRIORITY_HIGH)");
    expect(setResultBuilder).toContain("setSortKey(RESULT_CARD_SORT_KEY_COMMIT)");
    expect(setResultBuilder).toContain(
      "setActionPendingIntent(context, ACTION_COMMIT_SET, state, COMMIT_SET_REQUEST_CODE)",
    );
    // ContentIntent пересоздаётся при каждом показе — тап коммитит ТЕКУЩИЕ значения.
    expect(setResultBuilder).toMatch(
      /commitIntent = setActionPendingIntent\(context, ACTION_COMMIT_SET, state, COMMIT_SET_REQUEST_CODE\)[\s\S]*?setContentIntent\(commitIntent\)/,
    );
    // Кнопка «Готово» для телефона сохранена.
    expect(setResultBuilder).toContain('"Готово"');
    // Карточки-действия тихие: не вибрируют при каждом обновлении.
    expect(resultCardBuilder).toContain("setPriority(NotificationCompat.PRIORITY_LOW)");
    expect(resultCardBuilder).toContain('setSortKey(sortKey)');
    expect(nativeModule).toContain('RESULT_CARD_SORT_KEY_COMMIT = "0"');
    expect(nativeModule).toContain('RESULT_CARD_SORT_KEY_CANCEL = "5"');
  });

  it("корректировки пересчитывают значения и пере-постят карточку «Готово»", () => {
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
    // Карточки-действия не пере-постятся: пере-постится только showSetResultNotification.
    expect(actionReceiver).not.toContain("postResultActionCard");
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

  it("дублирует действия отдыха тихими карточками-псевдокнопками", () => {
    expect(completionReceiver).toContain("REST_NEXT_SET_CARD_NOTIFICATION_ID");
    expect(completionReceiver).toContain("REST_NEXT_EXERCISE_CARD_NOTIFICATION_ID");
    expect(nativeModule).toContain("REST_NEXT_SET_CARD_NOTIFICATION_ID = 40131");
    expect(nativeModule).toContain("REST_NEXT_EXERCISE_CARD_NOTIFICATION_ID = 40132");
    expect(completionReceiver).toContain('"Следующий подход"');
    expect(completionReceiver).toContain('"Следующее упражнение"');
    // Тап по карточке = ACTION_START broadcast с теми же extras, что у addAction.
    expect(completionReceiver).toContain("nextSetCard.setContentIntent(nextSetIntent)");
    expect(completionReceiver).toContain(
      "nextExerciseCard.setContentIntent(nextExerciseIntent)",
    );
    expect(completionReceiver).toContain('"finish-exercise"');
    // Карточки тихие и не ongoing.
    expect(completionReceiver).toContain("COMPLETION_ACTIONS_CHANNEL");
    expect(completionReceiver).toContain("setPriority(NotificationCompat.PRIORITY_LOW)");
    expect(completionReceiver).toMatch(
      /COMPLETION_ACTIONS_CHANNEL[\s\S]*?setOngoing\(false\)/,
    );
    expect(completionReceiver).not.toContain("RemoteInput");
  });

  it("очищает все псевдокнопки при смене состояния и завершении тренировки", () => {
    // Результат → отдых: отсчёт снимает зеркало подхода и все карточки результата.
    expect(nativeModule).toMatch(
      /showCountdownNotification[\s\S]*?cancel\(ACTIVE_SET_NOTIFICATION_ID\)[\s\S]*?cancelResultActionCards\(context\)[\s\S]*?cancelRestActionCards\(context\)/,
    );
    // Завершение тренировки: clearActiveSetNotification снимает всё, включая 40131/40132.
    expect(clearActiveSet).toContain("cancel(ACTIVE_SET_NOTIFICATION_ID)");
    expect(clearActiveSet).toContain("cancelResultActionCards(context)");
    expect(clearActiveSet).toContain("cancelRestActionCards(context)");
    expect(cancelResultCards).toContain("cancel(SET_RESULT_NOTIFICATION_ID)");
    expect(cancelResultCards).toContain("cancel(RESULT_WEIGHT_UP_NOTIFICATION_ID)");
    expect(cancelResultCards).toContain("cancel(RESULT_WEIGHT_DOWN_NOTIFICATION_ID)");
    expect(cancelResultCards).toContain("cancel(RESULT_REPS_UP_NOTIFICATION_ID)");
    expect(cancelResultCards).toContain("cancel(RESULT_REPS_DOWN_NOTIFICATION_ID)");
    expect(cancelResultCards).toContain("cancel(RESULT_CANCEL_NOTIFICATION_ID)");
    expect(cancelRestCards).toContain("cancel(REST_NEXT_SET_CARD_NOTIFICATION_ID)");
    expect(cancelRestCards).toContain("cancel(REST_NEXT_EXERCISE_CARD_NOTIFICATION_ID)");
    // Подход → результат: 40108 снимается при показе ввода результата.
    expect(setResultBuilder).toContain("cancel(ACTIVE_SET_NOTIFICATION_ID)");
    // Результат → подход: «Отменить» снимает все карточки результата.
    expect(actionReceiver).toMatch(
      /ACTION_COMMIT_SET[\s\S]*?cancelResultActionCards\(context\)/,
    );
    expect(actionReceiver).toMatch(
      /ACTION_CANCEL_SET[\s\S]*?cancelResultActionCards\(context\)/,
    );
    // Тап по карточке отдыха снимает карточки отдыха.
    expect(actionReceiver).toMatch(
      /action == ACTION_START[\s\S]*?cancelRestActionCards\(context\)/,
    );
  });

  it("документирует state machine, псевдокнопки и ограничения Huawei", () => {
    expect(existsSync(resolve(process.cwd(), "docs/watch-notifications-research.md"))).toBe(
      true,
    );
    expect(research).toContain("State machine");
    expect(research).toContain("Псевдокнопки для Huawei");
    expect(research).toContain("contentIntent");
    expect(research).toContain("Gadgetbridge");
    expect(research).toContain("#5552");
    expect(research).toContain("RemoteInput");
    expect(research).toContain("commit-set");
    expect(research).toContain("Убитый процесс");
    expect(research).toContain("deep-link");
  });
});
