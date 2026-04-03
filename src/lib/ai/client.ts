import { createOpenAI } from "@ai-sdk/openai";

// Modelo padrão quando não configurado no banco
const DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL ?? "anthropic/claude-sonnet-4-6";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface AIConfig {
  model: string;
  provider: "openrouter";
}

/**
 * Retorna provider configurado via OpenRouter.
 * Lê OPENROUTER_API_KEY do ambiente.
 */
export function getAIProvider(config?: AIConfig) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-or-...")) {
    return null;
  }

  return createOpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    headers: {
      "HTTP-Referer": "https://jgg-legal-platform.vercel.app",
      "X-Title": "JGG Legal Platform",
    },
  });
}

/**
 * Retorna o model ID a usar.
 * Em produção, buscar do banco via getAIConfigFromDB().
 * Aqui retorna o padrão de ambiente para uso direto.
 */
export function getDefaultModelId(): string {
  return DEFAULT_MODEL;
}

export function isAIAvailable(): boolean {
  const apiKey = process.env.OPENROUTER_API_KEY;
  return Boolean(apiKey && !apiKey.startsWith("sk-or-...") && apiKey.length > 10);
}
