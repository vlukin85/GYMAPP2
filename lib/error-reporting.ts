import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

let initialized = false;

function getDsn() {
  const value = Constants.expoConfig?.extra?.sentryDsn;
  return typeof value === "string" ? value.trim() : "";
}

export function isErrorReportingConfigured() {
  return Boolean(getDsn());
}

export function initializeErrorReporting() {
  if (initialized) return isErrorReportingConfigured();
  initialized = true;
  const dsn = getDsn();
  if (!dsn) return false;
  Sentry.init({
    dsn,
    enableNative: true,
    enableAutoSessionTracking: true,
    attachStacktrace: true,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.user) event.user = undefined;
      return event;
    },
  });
  Sentry.setTag("app.surface", "gym-training-diary");
  return true;
}

export function reportException(error: unknown, context: Record<string, string> = {}) {
  if (!isErrorReportingConfigured()) return;
  Sentry.captureException(error, { tags: context });
}

export function addDiagnosticBreadcrumb(message: string, level: "info" | "warning" | "error" = "info") {
  if (!isErrorReportingConfigured()) return;
  Sentry.addBreadcrumb({ category: "startup", message, level });
}
