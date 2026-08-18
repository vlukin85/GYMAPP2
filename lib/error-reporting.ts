/**
 * Local-only diagnostics boundary. User data and errors never leave the device.
 * The screen-level launch journal remains available for export through the share sheet.
 */
export function isErrorReportingConfigured() {
  return false;
}

export function initializeErrorReporting() {
  return false;
}

export function reportException(error: unknown, context: Record<string, string> = {}) {
  if (__DEV__) console.warn("[local-diagnostics]", context, error);
}

export function addDiagnosticBreadcrumb(message: string, level: "info" | "warning" | "error" = "info") {
  if (__DEV__) console.log(`[local-diagnostics:${level}] ${message}`);
}
