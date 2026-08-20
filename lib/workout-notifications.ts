import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getReminderTriggerDate } from "./workout-data";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

const REST_TIMER_CHANNEL = "rest-timer";

export type RestTimerNotificationIds = {
  activeId?: string;
  completionId?: string;
};

function formatRestNotificationTime(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

async function ensureLocalNotificationAccess(channelId: string, channelName: string) {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: channelName,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 220, 120, 260],
      lightColor: "#E83928",
      sound: "default",
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const status = existing.status === "granted" ? existing.status : (await Notifications.requestPermissionsAsync()).status;
  return status === "granted";
}

/**
 * Creates a lock-screen-facing notification only while the app is backgrounded.
 * Android does not expose a live countdown surface in managed Expo, so the active
 * notification shows the remaining rest time and a second native alert fires exactly
 * at completion, even while the phone is locked.
 */
export async function scheduleRestTimerLockScreenNotification(restEndAt: number): Promise<RestTimerNotificationIds | undefined> {
  if (Platform.OS === "web") return undefined;
  const seconds = Math.max(1, Math.ceil((restEndAt - Date.now()) / 1000));
  if (!(await ensureLocalNotificationAccess(REST_TIMER_CHANNEL, "Таймер отдыха"))) return undefined;

  const activeId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Отдых между подходами",
      body: `Осталось ${formatRestNotificationTime(seconds)}. IronRise сообщит, когда можно продолжить.`,
      sticky: Platform.OS === "android",
      autoDismiss: Platform.OS !== "android",
      data: { kind: "rest-timer", restEndAt },
    },
    trigger: null,
  });
  const completionId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Отдых завершён",
      body: "Время следующего подхода.",
      sound: true,
      data: { kind: "rest-timer-complete", restEndAt },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: Platform.OS === "android" ? REST_TIMER_CHANNEL : undefined,
    },
  });
  return { activeId, completionId };
}

export async function clearRestTimerLockScreenNotification(ids?: RestTimerNotificationIds) {
  if (Platform.OS === "web" || !ids) return;
  await Promise.all([
    ids.activeId ? Notifications.dismissNotificationAsync(ids.activeId).catch(() => undefined) : undefined,
    ids.completionId ? Notifications.cancelScheduledNotificationAsync(ids.completionId).catch(() => undefined) : undefined,
  ]);
}

export async function scheduleWorkoutReminder(input: { date: string; time: string; reminderMinutes: number; programName: string }) {
  if (Platform.OS === "web") return undefined;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("workouts", { name: "Тренировки", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 180, 100, 180], lightColor: "#FF4FD8" });
  const permission = await Notifications.getPermissionsAsync();
  const status = permission.status === "granted" ? permission.status : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") throw new Error("Notifications permission was not granted");
  const triggerDate = getReminderTriggerDate(input.date, input.time, input.reminderMinutes);
  if (triggerDate.getTime() <= Date.now()) return undefined;
  return Notifications.scheduleNotificationAsync({ content: { title: "Скоро тренировка", body: `${input.programName} — через ${input.reminderMinutes} мин.`, sound: true, data: { date: input.date } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate, channelId: "workouts" } });
}

export async function cancelWorkoutReminder(notificationId?: string) {
  if (!notificationId || Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
