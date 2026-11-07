import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");

const FG = "assets/images/android-icon-foreground.png";
const MONO = "assets/images/android-icon-monochrome.png";
const NOTIF = "assets/images/notification-small-icon.png";

const readPngHeader = (path: string) => {
  const buf = readFileSync(resolve(process.cwd(), path));
  // PNG-подпись + IHDR: ширина, высота и цветовой тип без внешних зависимостей.
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    colorType: buf[25],
  };
};

describe("app icon configuration", () => {
  it("подключает адаптивную иконку с тёмным фоном и монохромным слоем", () => {
    expect(appConfig).toMatch(/adaptiveIcon:\s*{/);
    expect(appConfig).toMatch(/foregroundImage:\s*"\.\/assets\/images\/android-icon-foreground\.png"/);
    expect(appConfig).toMatch(/monochromeImage:\s*"\.\/assets\/images\/android-icon-monochrome\.png"/);
    expect(appConfig).toMatch(/backgroundColor:\s*"#0D0F14"/);
  });

  it("подключает small notification icon к expo-notifications", () => {
    expect(appConfig).toMatch(/icon:\s*"\.\/assets\/images\/notification-small-icon\.png"/);
  });

  it("не затрагивает секцию splash в конфиге", () => {
    // Полноэкранная заставка остаётся без изменений: contain + квадратная
    // иконка Android 12+ (правки параллельной задачи по splash).
    expect(appConfig).toMatch(/resizeMode:\s*"contain"/);
    expect(appConfig).toMatch(/android12:\s*{[\s\S]*?icon:\s*"\.\/assets\/images\/splash-icon-android12\.png"/);
  });

  it("файлы иконок существуют на диске", () => {
    for (const path of [FG, MONO, NOTIF]) {
      expect(existsSync(resolve(process.cwd(), path)), path).toBe(true);
    }
  });

  it("слои иконок квадратные, RGBA и валидные PNG", () => {
    for (const path of [FG, MONO, NOTIF]) {
      const png = readPngHeader(path);
      expect(png.width).toBe(png.height);
      // colorType 6 = RGBA: слои прозрачные, без фонового квадрата
      expect(png.colorType, path).toBe(6);
    }
    // small notification icon — 96x96, стандарт expo-notifications
    expect(readPngHeader(NOTIF).width).toBe(96);
  });
});
