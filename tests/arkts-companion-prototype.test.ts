import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "harmonyos-watch-companion");
const page = readFileSync(
  resolve(root, "entry/src/main/ets/pages/Index.ets"),
  "utf8",
);
const moduleConfig = readFileSync(
  resolve(root, "entry/src/main/module.json5"),
  "utf8",
);

describe("ArkTS watch companion scaffold", () => {
  it("contains the wearable entry module and main page", () => {
    expect(existsSync(resolve(root, "AppScope/app.json5"))).toBe(true);
    expect(existsSync(resolve(root, "entry/src/main/ets/entryability/EntryAbility.ets"))).toBe(true);
    expect(moduleConfig).toContain('"deviceTypes": [\n      "wearable"');
    expect(moduleConfig).toContain('"mainElement": "EntryAbility"');
  });

  it("keeps the approved companion interaction states", () => {
    expect(page).toContain("CompanionMode.IDLE");
    expect(page).toContain("CompanionMode.SET");
    expect(page).toContain("CompanionMode.REST");
    expect(page).toContain("CompanionMode.SYNC");
    expect(page).toContain("СТАРТ");
    expect(page).toContain("ЗАВЕРШИТЬ");
    expect(page).toContain("ПРОПУСТИТЬ");
  });
});
