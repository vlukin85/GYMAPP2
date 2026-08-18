import { buildAiProgramPrompt, normalizeAiProgram } from "./ai-program";
import type { AiProgramParameters } from "./ai-program";
import { isValidGroqApiKey } from "./groq-utils";
import type { Exercise, WorkoutProgram } from "./workout-data";

export const GROQ_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_PROGRAM_MODEL = "openai/gpt-oss-20b";

type GroqFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type UnknownObject = Record<string, unknown>;

function asObject(value: unknown): UnknownObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as UnknownObject : null;
}

function responseContent(payload: unknown) {
  const source = asObject(payload);
  const choices = source?.choices;
  if (!Array.isArray(choices)) return "";
  const first = asObject(choices[0]);
  const message = asObject(first?.message);
  return typeof message?.content === "string" ? message.content : "";
}

export function extractGroqJson(content: string) {
  const unfenced = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Groq вернул ответ без JSON-программы. Попробуй ещё раз.");
  return unfenced.slice(start, end + 1);
}

export function groqErrorMessage(status: number) {
  if (status === 401 || status === 403) return "Groq не принял ключ. Проверь ключ в настройках генератора.";
  if (status === 429) return "Groq временно ограничил запросы. Подожди немного и попробуй снова.";
  if (status >= 500) return "Сервис Groq временно недоступен. Локальный конструктор всё ещё можно использовать без интернета.";
  return "Не удалось получить программу от Groq. Проверь интернет-соединение и попробуй снова.";
}

export async function generateGroqProgram(
  input: AiProgramParameters,
  catalog: Exercise[],
  apiKey: string,
  fetcher: GroqFetch = fetch,
): Promise<Omit<WorkoutProgram, "id">> {
  if (!isValidGroqApiKey(apiKey)) throw new Error("Добавь корректный личный ключ Groq, чтобы использовать ИИ-режим.");

  const response = await fetcher(GROQ_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: GROQ_PROGRAM_MODEL,
      temperature: 0.2,
      max_completion_tokens: 1400,
      messages: [
        {
          role: "system",
          content: "Ты создаёшь безопасные редактируемые программы тренировок. Следуй формату из сообщения пользователя и возвращай только валидный JSON без пояснений.",
        },
        { role: "user", content: buildAiProgramPrompt(input, catalog) },
      ],
    }),
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(groqErrorMessage(response.status));

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("Groq вернул нечитаемый ответ. Попробуй сформировать программу ещё раз.");
  }

  const content = responseContent(payload);
  if (!content) throw new Error("Groq не вернул текст программы. Попробуй ещё раз.");

  try {
    return normalizeAiProgram(JSON.parse(extractGroqJson(content)), catalog);
  } catch (error) {
    throw error instanceof Error ? error : new Error("Не удалось проверить программу, сформированную Groq.");
  }
}
