import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const BACKUP_RECORD_KEY = "ironrise.local-backup.record.v1";
const BACKUP_REMINDER_PREFERENCES_KEY =
  "ironrise.local-backup.reminder-preferences.v1";
const BACKUP_REMINDER_CHANNEL = "local-backup";

export type BackupReminderFrequency = "weekly" | "monthly";
export type LocalBackupReminderPreferences = {
  enabled: boolean;
  frequency: BackupReminderFrequency;
};
export type LocalBackupRecord = {
  createdAt: string;
  storageEntryCount: number;
  mediaFileCount: number;
  reminderNotificationId?: string;
};

export const DEFAULT_LOCAL_BACKUP_REMINDER_PREFERENCES: LocalBackupReminderPreferences =
  { enabled: true, frequency: "monthly" };

type BackupReminderResult = { scheduled: boolean; notificationId?: string };

function normalizePreferences(value: unknown): LocalBackupReminderPreferences {
  if (!value || typeof value !== "object")
    return DEFAULT_LOCAL_BACKUP_REMINDER_PREFERENCES;
  const preferences = value as Partial<LocalBackupReminderPreferences>;
  return {
    enabled: preferences.enabled !== false,
    frequency: preferences.frequency === "weekly" ? "weekly" : "monthly",
  };
}

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

export async function loadLocalBackupReminderPreferences() {
  try {
    const raw = await AsyncStorage.getItem(BACKUP_REMINDER_PREFERENCES_KEY);
    return normalizePreferences(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_LOCAL_BACKUP_REMINDER_PREFERENCES;
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

export function getWeeklyBackupTrigger(createdAt: string) {
  const created = new Date(createdAt);
  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: created.getDay() + 1,
    hour: 10,
    minute: 0,
    repeats: true,
    channelId: BACKUP_REMINDER_CHANNEL,
  } as const;
}

export function getBackupReminderTrigger(
  createdAt: string,
  frequency: BackupReminderFrequency,
) {
  return frequency === "weekly"
    ? getWeeklyBackupTrigger(createdAt)
    : getMonthlyBackupTrigger(createdAt);
}

async function scheduleBackupReminder(
  record: LocalBackupRecord,
  preferences: LocalBackupReminderPreferences,
): Promise<BackupReminderResult> {
  if (Platform.OS === "web") return { scheduled: false };
  if (record.reminderNotificationId)
    await Notifications.cancelScheduledNotificationAsync(
      record.reminderNotificationId,
    );
  if (!preferences.enabled) return { scheduled: false };
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
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Сделайте резервную копию IronRise",
      body:
        preferences.frequency === "weekly"
          ? "Проверьте, что свежая ZIP-копия тренировок и настроек сохранена на устройстве."
          : "Прошёл месяц с последнего сохранения. Защитите тренировки и настройки ZIP-копией.",
      sound: false,
      data: { kind: "local-backup-reminder" },
    },
    trigger: getBackupReminderTrigger(record.createdAt, preferences.frequency),
  });
  return { scheduled: true, notificationId };
}

export async function saveLocalBackupReminderPreferences(
  preferences: LocalBackupReminderPreferences,
) {
  const normalized = normalizePreferences(preferences);
  const record = await loadLocalBackupRecord();
  if (!record) {
    await AsyncStorage.setItem(
      BACKUP_REMINDER_PREFERENCES_KEY,
      JSON.stringify(normalized),
    );
    return { preferences: normalized, record: null, reminderScheduled: false };
  }
  const reminder = await scheduleBackupReminder(record, normalized).catch(
    (): BackupReminderResult => ({ scheduled: false }),
  );
  const nextRecord: LocalBackupRecord = {
    ...record,
    ...(reminder.notificationId
      ? { reminderNotificationId: reminder.notificationId }
      : {}),
  };
  if (!normalized.enabled) delete nextRecord.reminderNotificationId;
  await Promise.all([
    AsyncStorage.setItem(
      BACKUP_REMINDER_PREFERENCES_KEY,
      JSON.stringify(normalized),
    ),
    saveLocalBackupRecord(nextRecord),
  ]);
  return {
    preferences: normalized,
    record: nextRecord,
    reminderScheduled: reminder.scheduled,
  };
}

export async function recordSuccessfulLocalBackup(input: {
  createdAt: string;
  storageEntryCount: number;
  mediaFileCount: number;
}) {
  const [previous, preferences] = await Promise.all([
    loadLocalBackupRecord(),
    loadLocalBackupReminderPreferences(),
  ]);
  const baseRecord: LocalBackupRecord = {
    ...input,
    ...(previous?.reminderNotificationId
      ? { reminderNotificationId: previous.reminderNotificationId }
      : {}),
  };
  const reminder = await scheduleBackupReminder(baseRecord, preferences).catch(
    (): BackupReminderResult => ({ scheduled: false }),
  );
  const record: LocalBackupRecord = {
    ...baseRecord,
    ...(reminder.notificationId
      ? { reminderNotificationId: reminder.notificationId }
      : {}),
  };
  if (!preferences.enabled) delete record.reminderNotificationId;
  await saveLocalBackupRecord(record);
  return { record, preferences, reminderScheduled: reminder.scheduled };
}
