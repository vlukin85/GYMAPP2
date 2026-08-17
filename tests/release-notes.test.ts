import { describe, expect, it } from "vitest";
import { shouldShowReleaseNotes } from "../lib/release-notes";

describe("release notes", () => {
  it("shows notes only for a new version", () => {
    expect(shouldShowReleaseNotes(null, "1.0.1")).toBe(true);
    expect(shouldShowReleaseNotes("1.0.0", "1.0.1")).toBe(true);
    expect(shouldShowReleaseNotes("1.0.1", "1.0.1")).toBe(false);
  });
});
