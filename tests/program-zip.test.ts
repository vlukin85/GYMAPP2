import { describe, expect, it } from "vitest";
import { buildProgramZip, unpackProgramZip } from "../lib/program-zip";

const program = { id: "zip-full-body", name: "ZIP Full body", description: "Программа с обложкой", coverImage: "gym-media://program-zip-full-body-cover", createdAt: "2026-08-17T12:00:00.000Z", exercises: [{ exerciseId: "bench-press", sets: 3, reps: 8, weight: 50, rest: 90 }] };

describe("program ZIP export", () => {
  it("packs media separately from JSON manifest and restores portable payload", () => {
    const zip = buildProgramZip([program], { "program-zip-full-body-cover": { mimeType: "image/jpeg", base64: "dGVzdC1pbWFnZQ==" } });
    const payload = JSON.parse(unpackProgramZip(zip));
    expect(payload.programs[0].coverImage).toBe("gym-media://program-zip-full-body-cover");
    expect(payload.media["program-zip-full-body-cover"].base64).toBe("dGVzdC1pbWFnZQ==");
  });
});
