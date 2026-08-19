import { describe, expect, it } from "vitest";
import { CURRENT_RELEASE, releaseNotesTitle, shouldShowReleaseNotes } from "../lib/release-notes";

describe("release notes", () => {
  it("shows notes only for a new version", () => {
    expect(shouldShowReleaseNotes(null, "1.0.1")).toBe(true);
    expect(shouldShowReleaseNotes("1.0.0", "1.0.1")).toBe(true);
    expect(shouldShowReleaseNotes("1.0.1", "1.0.1")).toBe(false);
  });
  it("builds the title from the running app version and describes the current delta", () => {
    expect(releaseNotesTitle("1.0.3")).toBe("Что нового в 1.0.3");
    expect(CURRENT_RELEASE.previousVersion).toBe("1.0.2");
    expect(CURRENT_RELEASE.entries).toHaveLength(3);
  });
});
