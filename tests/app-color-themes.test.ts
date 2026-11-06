import { describe, expect, it } from "vitest";
import { APP_COLOR_THEMES, DEFAULT_APP_THEME_ID, getAppTheme, isAppThemeId } from "../lib/app-color-themes";

describe("app color themes", () => {
  it("provides at least five complete selectable application palettes", () => {
    expect(APP_COLOR_THEMES.length).toBeGreaterThanOrEqual(5);
    expect(new Set(APP_COLOR_THEMES.map((theme) => theme.swatch)).size).toBeGreaterThanOrEqual(5);
    APP_COLOR_THEMES.forEach((theme) => expect(theme.palette.primary).toBe(theme.swatch));
  });

  it("recognizes persisted ids and falls back to a valid palette", () => {
    expect(isAppThemeId("ocean")).toBe(true);
    expect(isAppThemeId("not-a-theme")).toBe(false);
    expect(getAppTheme("midnight").dark).toBe(true);
  });

  it("starts with the approved Dark Energy palette from the redesigned reference", () => {
    const theme = getAppTheme(DEFAULT_APP_THEME_ID);
    expect(theme.id).toBe("dark-energy");
    expect(theme.palette.background).toBe("#0B0F0D");
    expect(theme.palette.primary).toBe("#C8F169");
  });
});
