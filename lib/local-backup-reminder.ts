import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const BACKUP_RECORD_KEY = "ironrise.local-backup.record.v1";
const BACKUP_REMINDER_CHANNEL = "local-backup";

export type LocalBackupRecord = {
  createdAt: string;
  storageEntryCount: number;
  mediaFileCount: number;
  reminderNotificationId?: string;
};

type BackupReminderResult = { scheduled: boolean; notificationId?: string };

function normalizeRecord(value: unknown): LocalBackupRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<LocalBackupRecord>;
  if (
    typeof record.createdAt !== "string" ||
    typeof record.storageEntryCount !== "number" ||
    typeof record.mediaFileCount !== "number" ||
    !Number.isFinite(record.storageEntryCount) ||
    !Number.isFinite(record.mediaFileCount) ||
    Number.isNaN(new Date(record.createdAt).getTime())
  )
    return null;
  return {
    createdAt: record.createdAt,
    storageEntryCount: record.storageEntryCount,
    mediaFileCount: record.mediaFileCount,
    ...(typeof record.reminderNotificationId === "string"
      ? { reminderNotificationId: record.reminderNotificationId }
      : {}),
  };
}

export async function loadLocalBackupRecord() {
  try {
    const raw = await AsyncStorage.getItem(BACKUP_RECORD_KEY);
    return normalizeRecord(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}

async function saveLocalBackupRecord(record: LocalBackupRecord) {
  await AsyncStorage.setItem(BACKUP_RECORD_KEY, JSON.stringify(record));
}

export function getMonthlyBackupTrigger(createdAt: string) {
  const created = new Date(createdAt);
  return {
    type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
    day: Math.min(created.getDate(), 28),
    hour: 10,
    minute: 0,
    repeats: true,
    channelId: BACKUP_REMINDER_CHANNEL,
  } as const;
}

async function scheduleMonthlyBackupReminder(
  record: LocalBackupRecord,
): Promise<BackupReminderResult> {
  if (Platform.OS === "web") return { scheduled: false };
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(BACKUP_REMINDER_CHANNEL, {
      name: "Резервные копии",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 140],
      enableVibrate: true,
      lightColor: "#E83928",
    });
  }
  const permission = await Notifications.getPermissionsAsync();
  const status =
    permission.status === "granted"
      ? permission.status
      : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return { scheduled: false };
  if (record.reminderNotificationId)
    await Notifications.cancelScheduledNotificationAsync(
      record.reminderNotificationId,
    );
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Сделайте резервную копию IronRise",
      body: "Прошёл месяц с последнего сохранения. Защитите тренировки и настройки ZIP-копией.",
      sound: false,
      data: { kind: "local-backup-reminder" },
    },
    trigger: getMonthlyBackupTrigger(record.createdAt),
  });
  return { scheduled: true, notificationId };
}

export async function recordSuccessfulLocalBackup(input: {
  createdAt: string;
  storageEntryCount: number;
  mediaFileCount: number;
}) {
  const previous = await loadLocalBackupRecord();
  const baseRecord: LocalBackupRecord = {
    ...input,
    ...(previous?.reminderNotificationId
      ? { reminderNotificationId: previous.reminderNotificationId }
      : {}),
  };
  const reminder = await scheduleMonthlyBackupReminder(baseRecord).catch(
    (): BackupReminderResult => ({ scheduled: false }),
  );
  const record: LocalBackupRecord = {
    ...baseRecord,
    ...(reminder.notificationId
      ? { reminderNotificationId: reminder.notificationId }
      : {}),
  };
  await saveLocalBackupRecord(record);
  return { record, reminderScheduled: reminder.scheduled };
}
