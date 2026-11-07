import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CURRENT_RELEASE, releaseNotesTitle, shouldShowReleaseNotes } from "../lib/release-notes";

const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const releaseNotesMd = readFileSync(resolve(process.cwd(), "release-notes.md"), "utf8");

describe("release notes", () => {
  it("shows notes only for a new version", () => {
    expect(shouldShowReleaseNotes(null, "1.0.3")).toBe(true);
    expect(shouldShowReleaseNotes("1.0.3", "1.0.4")).toBe(true);
    expect(shouldShowReleaseNotes("1.0.4", "1.0.4")).toBe(false);
    expect(shouldShowReleaseNotes(null)).toBe(true);
    expect(shouldShowReleaseNotes(CURRENT_RELEASE.version)).toBe(false);
  });
  it("builds the title from the running app version and describes the current delta", () => {
    expect(releaseNotesTitle("1.0.4")).toBe("Что нового в 1.0.4");
    expect(CURRENT_RELEASE.previousVersion).toBe("1.0.3");
    expect(CURRENT_RELEASE.entries.length).toBeGreaterThan(0);
    for (const entry of CURRENT_RELEASE.entries) {
      expect(entry.length).toBeGreaterThan(0);
    }
  });
  it("описывает ключевые изменения текущей сборки", () => {
    const all = CURRENT_RELEASE.entries.join(" ");
    expect(all).toContain("Dark Energy");
    expect(all).toContain("часов");
    expect(all).toContain("RuTube");
    expect(all).toContain("334");
    expect(all).toContain("виджетов");
    expect(all).toContain("предпрослуш");
    expect(all).toContain("Заставка");
  });
  it("совпадает с версией приложения в app.config.ts", () => {
    expect(appConfig).toContain(`version: "${CURRENT_RELEASE.version}"`);
    expect(appConfig).not.toContain(`version: "${CURRENT_RELEASE.previousVersion}"`);
  });
  it("release-notes.md описывает текущую сборку", () => {
    expect(releaseNotesMd).toContain(`— ${CURRENT_RELEASE.version}`);
    expect(releaseNotesMd).toContain("Dark Energy");
  });
});
