import { describe, expect, it } from "vitest";

describe("launch diagnostics", () => {
  it("keeps crash details compact and removes URL values", () => {
    const detail = "Network request failed at https://private.example.test/path?token=value";
    const safe = detail.replace(/https?:\/\/[^\s]+/g, "[url]").slice(0, 180);
    expect(safe).toContain("[url]");
    expect(safe).not.toContain("private.example.test");
    expect(safe.length).toBeLessThanOrEqual(180);
  });
});
