import { describe, expect, it } from "vitest";

describe("Sentry release credentials", () => {
  it("can access the configured Sentry project", async () => {
    const org = process.env.SENTRY_ORG;
    const project = process.env.SENTRY_PROJECT;
    const token = process.env.SENTRY_AUTH_TOKEN;
    expect(org, "SENTRY_ORG должен быть задан").toBeTruthy();
    expect(project, "SENTRY_PROJECT должен быть задан").toBeTruthy();
    expect(token, "SENTRY_AUTH_TOKEN должен быть задан").toBeTruthy();
    const url = `https://sentry.io/api/0/projects/${encodeURIComponent(org!)}/${encodeURIComponent(project!)}/releases/?query=`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12_000) });
    expect(response.status, `Sentry вернул ${response.status}`).toBeLessThan(400);
  }, 15_000);
});
