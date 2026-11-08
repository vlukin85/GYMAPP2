import {
  getHealthConnectStatus,
  readActivityWeek as readHealthConnectActivityWeek,
  readDailyActivity as readHealthConnectDailyActivity,
  type DailyActivityReading,
} from "./health-connect";
import { getGoogleFitStatus, readGoogleFitActivityWeek, readGoogleFitDailyActivity } from "./google-fit";
import { loadHealthSource, type HealthSourceId } from "./health-source";
import type { ActivityWeekDay } from "./health-connect-activity";

/**
 * Единая точка чтения дневной активности для карточки «Активность · сегодня».
 * Источник выбирается настройкой: Google Fit — основной, Health Connect —
 * резерв. Если Google Fit не готов (не авторизован, недоступен, ошибка),
 * данные читаются из Health Connect по прежнему пути. Пульс для тренировок
 * этот провайдер не затрагивает — он всегда идёт из Health Connect.
 */

export const GOOGLE_FIT_CONNECT_HINT = "Подключите Google Fit в настройках";

export type ActivityProviderStatus = {
  source: HealthSourceId;
  /** Данные доступны: Google Fit готов либо сработал резерв Health Connect. */
  connected: boolean;
  /** Подсказка для карточки, когда основной источник не подключён. */
  hint: string | null;
};

type HealthConnectActivityStatus = Awaited<ReturnType<typeof getHealthConnectStatus>>;

function healthConnectReady(status: HealthConnectActivityStatus): boolean {
  return status.state === "ready" && status.activityGranted;
}

/** Статус источника для карточки: кто отдаёт данные и что подсказать пользователю. */
export async function getActivityStatus(): Promise<ActivityProviderStatus> {
  const source = await loadHealthSource();
  if (source === "google-fit") {
    const fitStatus = await getGoogleFitStatus();
    if (fitStatus.state === "ready") return { source, connected: true, hint: null };
    const healthConnect = await getHealthConnectStatus();
    if (healthConnectReady(healthConnect)) return { source, connected: true, hint: null };
    return {
      source,
      connected: false,
      hint: fitStatus.state === "unauthorized" ? GOOGLE_FIT_CONNECT_HINT : null,
    };
  }
  const healthConnect = await getHealthConnectStatus();
  return { source, connected: healthConnectReady(healthConnect), hint: null };
}

/** Активность за сегодня из выбранного источника (с фолбэком на Health Connect). */
export async function getActivityToday(): Promise<DailyActivityReading> {
  const source = await loadHealthSource();
  if (source === "google-fit") {
    const fitStatus = await getGoogleFitStatus();
    if (fitStatus.state === "ready") {
      try {
        return await readGoogleFitDailyActivity();
      } catch {
        // Фолбэк ниже: ошибка Google Fit не должна оставлять карточку пустой.
      }
    }
  }
  return readHealthConnectDailyActivity();
}

/** Неделя активности из выбранного источника (с фолбэком на Health Connect). */
export async function getActivityWeek(): Promise<ActivityWeekDay[]> {
  const source = await loadHealthSource();
  if (source === "google-fit") {
    const fitStatus = await getGoogleFitStatus();
    if (fitStatus.state === "ready") {
      try {
        return await readGoogleFitActivityWeek();
      } catch {
        // Фолбэк ниже: ошибка Google Fit не должна оставлять график пустым.
      }
    }
  }
  return readHealthConnectActivityWeek();
}
