import { describe, expect, it } from "vitest";
import { buildProgramExchange, parseProgramExchange } from "../lib/program-exchange";

const program = { id: "shared-full-body", name: "Мой Full body", description: "Базовая программа", coverImage: "gym-media://program-cover", createdAt: "2026-08-14T12:00:00.000Z", exercises: [{ exerciseId: "bench-press", sets: 3, reps: 8, weight: 50, rest: 90 }] };

describe("program exchange", () => {
  it("exports a portable program file and imports a compatible program", () => {
    const content = buildProgramExchange([program], { "program-cover": { mimeType: "image/jpeg", base64: "dGVzdA==" } });
    const result = parseProgramExchange(content, []);
    expect(result.error).toBeUndefined();
    expect(result.programs).toHaveLength(1);
    expect(result.programs[0].name).toBe("Мой Full body");
    expect(result.programs[0].coverImage).toBe("gym-media://program-cover");
    expect(result.media?.["program-cover"].base64).toBe("dGVzdA==");
  });

  it("rejects malformed files and excludes duplicate program ids", () => {
    expect(parseProgramExchange("not json", []).error).toContain("JSON");
    const result = parseProgramExchange(buildProgramExchange([program]), [program]);
    expect(result.programs).toHaveLength(0);
    expect(result.duplicateIds).toEqual(["shared-full-body"]);
  });
});
