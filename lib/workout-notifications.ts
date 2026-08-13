import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getReminderTriggerDate } from "./workout-data";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

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
