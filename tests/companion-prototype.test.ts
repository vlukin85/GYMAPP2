import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const screen = readFileSync(
  resolve(process.cwd(), "app/dev/companion.tsx"),
  "utf8",
);

describe("watch companion prototype", () => {
  it("defines the core workout states", () => {
    expect(screen).toContain('type CompanionMode = "idle" | "set" | "rest" | "sync";');
    expect(screen).toContain("ОЖИДАНИЕ");
    expect(screen).toContain("ПОДХОД");
    expect(screen).toContain("ОТДЫХ");
    expect(screen).toContain("СИНХРОНИЗАЦИЯ");
  });

  it("keeps the primary watch action stateful", () => {
    expect(screen).toContain("if (mode === \"idle\")");
    expect(screen).toContain("setMode(\"rest\")");
    expect(screen).toContain("setMode(\"set\")");
    expect(screen).toContain("Отключить часы");
  });

  it("documents the phone-watch data contract", () => {
    expect(screen).toContain("Телефон хранит программу и историю");
    expect(screen).toContain("старт / завершить / пропустить отдых");
  });
});
