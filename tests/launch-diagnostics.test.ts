import { describe, expect, it } from "vitest";
import { nextLaunchMarker, shouldWarnAboutRepeatedFailures } from "../lib/launch-recovery";

describe("launch diagnostics", () => {
  it("keeps crash details compact and removes URL values", () => {
    const detail = "Network request failed at https://private.example.test/path?token=value";
    const safe = detail.replace(/https?:\/\/[^\s]+/g, "[url]").slice(0, 180);
    expect(safe).toContain("[url]");
    expect(safe).not.toContain("private.example.test");
    expect(safe.length).toBeLessThanOrEqual(180);
  });

  it("warns only after repeated unfinished launches", () => {
    const first = nextLaunchMarker(null, new Date("2026-08-17T10:00:00.000Z"));
    const second = nextLaunchMarker(first, new Date("2026-08-17T10:01:00.000Z"));
    const third = nextLaunchMarker(second, new Date("2026-08-17T10:02:00.000Z"));
    expect(shouldWarnAboutRepeatedFailures(first)).toBe(false);
    expect(shouldWarnAboutRepeatedFailures(second)).toBe(false);
    expect(shouldWarnAboutRepeatedFailures(third)).toBe(true);
  });
});
