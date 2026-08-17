import { describe, expect, it } from "vitest";

describe("Sentry DSN", () => {
  it("is a valid HTTPS ingestion endpoint", async () => {
    const dsn = process.env.SENTRY_DSN;
    expect(dsn, "SENTRY_DSN должен быть задан через защищённые настройки").toBeTruthy();
    const url = new URL(dsn!);
    expect(url.protocol).toBe("https:");
    expect(url.username.length).toBeGreaterThan(0);
    expect(url.hostname).toContain("sentry.io");
    expect(url.pathname.replaceAll("/", "")).toMatch(/^\d+$/);
    const response = await fetch(`${url.protocol}//${url.host}/`, { method: "OPTIONS" });
    expect(response.status).toBeGreaterThan(0);
  });
});
