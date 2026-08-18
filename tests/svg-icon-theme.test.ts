import { describe, expect, it } from "vitest";
import { DEFAULT_SVG_ICON_THEME_ID, getSvgIconTheme, normalizeSvgIconTheme } from "../lib/svg-icon-theme";

describe("темы SVG-иконок", () => {
  it("принимает сохранённую известную тему", () => {
    expect(normalizeSvgIconTheme("ocean")).toBe("ocean");
    expect(getSvgIconTheme("rose").color).toBe("#E11D72");
  });

  it("безопасно возвращает фирменную тему для неизвестного значения", () => {
    expect(normalizeSvgIconTheme("unknown-theme")).toBe(DEFAULT_SVG_ICON_THEME_ID);
  });
});
