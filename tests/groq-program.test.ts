import { describe, expect, it } from "vitest";
import { exercises } from "../lib/workout-data";
import { extractGroqJson, generateGroqProgram, groqErrorMessage } from "../lib/groq-program";
import { isValidGroqApiKey } from "../lib/groq-utils";

const apiKey = "gsk_local_test_key_12345678901234567890";
const input = {
  prompt: "Три полноценных тренировки в неделю для силы и общей физической подготовки.",
  daysPerWeek: 3,
  experience: "beginner" as const,
  equipment: "full-gym" as const,
  sessionMinutes: 60,
};

describe("Groq program integration", () => {
  it("recognises Groq personal keys without accepting unrelated text", () => {
    expect(isValidGroqApiKey(apiKey)).toBe(true);
    expect(isValidGroqApiKey("not-a-groq-key")).toBe(false);
  });

  it("extracts JSON even when a model wraps it in a code fence", () => {
    expect(extractGroqJson("```json\n{\"name\":\"Сила\"}\n``` ")).toBe('{"name":"Сила"}');
  });

  it("normalizes a valid Groq response against the local exercise catalog", async () => {
    const answer = {
      name: "Силовой старт",
      description: "Редактируемая программа для всего тела.",
      exercises: [
        { exerciseId: exercises[0].id, sets: 3, reps: 8, weight: 0, rest: 90, setType: "working" },
        { exerciseId: exercises[1].id, sets: 3, reps: 10, weight: 0, rest: 90, setType: "working" },
      ],
    };
    const fetcher = async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${apiKey}`);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }), { status: 200 });
    };

    const result = await generateGroqProgram(input, exercises, apiKey, fetcher);
    expect(result.name).toBe("Силовой старт");
    expect(result.exercises).toHaveLength(2);
  });

  it("returns user-facing errors without provider details", () => {
    expect(groqErrorMessage(401)).toContain("ключ");
    expect(groqErrorMessage(429)).toContain("ограничил");
  });
});
