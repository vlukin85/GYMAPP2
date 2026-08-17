import Constants from "expo-constants";
import type * as SentryType from "@sentry/react-native";

let initialized = false;
let ready = false;
let sentry: typeof SentryType | null = null;

function getDsn() {
  const value = Constants.expoConfig?.extra?.sentryDsn;
  return typeof value === "string" ? value.trim() : "";
}

export function isErrorReportingConfigured() {
  return Boolean(getDsn());
}

export function initializeErrorReporting() {
  if (initialized) return ready;
  initialized = true;
  const dsn = getDsn();
  if (!dsn) return false;
  try {
    sentry = require("@sentry/react-native") as typeof SentryType;
    sentry.init({
      dsn,
      enableNative: false,
      enableAutoSessionTracking: false,
      attachStacktrace: true,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.user) event.user = undefined;
        return event;
      },
    });
    sentry.setTag("app.surface", "gym-training-diary");
    ready = true;
  } catch {
    ready = false;
  }
  return ready;
}

export function reportException(error: unknown, context: Record<string, string> = {}) {
  if (!ready || !sentry) return;
  try { sentry.captureException(error, { tags: context }); } catch { /* diagnostics must not crash the app */ }
}

export function addDiagnosticBreadcrumb(message: string, level: "info" | "warning" | "error" = "info") {
  if (!ready || !sentry) return;
  try { sentry.addBreadcrumb({ category: "startup", message, level }); } catch { /* diagnostics must not crash the app */ }
}
