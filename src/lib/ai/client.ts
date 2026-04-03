import { createOpenAI } from "@ai-sdk/openai";

/**
 * Creates a configured OpenAI provider instance for the Vercel AI SDK.
 * Falls back gracefully when OPENAI_API_KEY is not set.
 */
export function getAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "sk-...") {
    return null;
  }

  return createOpenAI({
    apiKey,
  });
}

/**
 * Check if AI capabilities are available (API key configured).
 */
export function isAIAvailable(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return Boolean(apiKey && apiKey !== "sk-...");
}
