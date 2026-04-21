import "server-only";

import { obterConfiguracoes } from "@/modules/administracao/application";
import type { ProvedorIA } from "@/lib/ai/provider";

const PROVEDORES_VALIDOS: ProvedorIA[] = [
  "openai",
  "openrouter",
  "kilocode",
  "anthropic",
  "google",
  "groq",
  "xai",
  "mistral",
  "ollama",
  "custom",
];

const CACHE_MS = 10_000;
let ultimaSyncMs = 0;
let ultimoSnapshot:
  | {
      provedor?: ProvedorIA;
      modelo?: string;
      envVars: Record<string, string | undefined>;
    }
  | null = null;

const MAPA_CONFIG_ENV: Array<{ chave: string; env: string }> = [
  { chave: "ai_openai_api_key", env: "OPENAI_API_KEY" },
  { chave: "ai_openrouter_api_key", env: "OPENROUTER_API_KEY" },
  { chave: "ai_kilocode_api_key", env: "KILO_API_KEY" },
  { chave: "ai_anthropic_api_key", env: "ANTHROPIC_API_KEY" },
  { chave: "ai_google_api_key", env: "GOOGLE_GENERATIVE_AI_API_KEY" },
  { chave: "ai_groq_api_key", env: "GROQ_API_KEY" },
  { chave: "ai_xai_api_key", env: "XAI_API_KEY" },
  { chave: "ai_mistral_api_key", env: "MISTRAL_API_KEY" },
  { chave: "ai_ollama_base_url", env: "OLLAMA_BASE_URL" },
  { chave: "ai_ollama_api_key", env: "OLLAMA_API_KEY" },
  { chave: "ai_custom_base_url", env: "CUSTOM_BASE_URL" },
  { chave: "ai_custom_api_key", env: "CUSTOM_API_KEY" },
];

function normalizarProvedor(valor: string | undefined): ProvedorIA | undefined {
  if (!valor) return undefined;
  const normalizado = valor.trim().toLowerCase() as ProvedorIA;
  return PROVEDORES_VALIDOS.includes(normalizado) ? normalizado : undefined;
}

function setEnv(nome: string, valor: string | undefined) {
  if (valor && valor.length > 0) {
    process.env[nome] = valor;
    return;
  }
  delete process.env[nome];
}

function applyRuntimeConfig(
  provedor: ProvedorIA | undefined,
  modelo: string | undefined,
  envVars: Record<string, string | undefined>,
) {
  setEnv("AI_PROVIDER", provedor);
  setEnv("AI_MODEL", modelo);
  for (const [env, valor] of Object.entries(envVars)) {
    setEnv(env, valor);
  }
}

/**
 * Sincroniza AI_PROVIDER/AI_MODEL do banco para o runtime, com cache curto.
 * Mantem fallback em variaveis de ambiente quando o banco estiver indisponivel.
 */
export async function syncRuntimeAIConfig(options?: { force?: boolean }) {
  const now = Date.now();
  if (!options?.force && ultimoSnapshot && now - ultimaSyncMs < CACHE_MS) {
    applyRuntimeConfig(ultimoSnapshot.provedor, ultimoSnapshot.modelo, ultimoSnapshot.envVars);
    return ultimoSnapshot;
  }

  try {
    const configuracoes = await obterConfiguracoes();
    const map = new Map(configuracoes.map((item) => [item.chave, item.valor]));

    const provedor = map.has("ai_provider")
      ? normalizarProvedor(map.get("ai_provider")) ?? normalizarProvedor(process.env.AI_PROVIDER)
      : normalizarProvedor(process.env.AI_PROVIDER);
    const modelo = map.has("ai_model")
      ? (map.get("ai_model")?.trim() || undefined)
      : process.env.AI_MODEL;

    const envVars: Record<string, string | undefined> = {};
    for (const item of MAPA_CONFIG_ENV) {
      if (!map.has(item.chave)) continue;
      const valor = map.get(item.chave)?.trim() || undefined;
      envVars[item.env] = valor;
    }

    ultimoSnapshot = { provedor, modelo, envVars };
    ultimaSyncMs = now;
    applyRuntimeConfig(provedor, modelo, envVars);
    return ultimoSnapshot;
  } catch {
    const provedor = normalizarProvedor(process.env.AI_PROVIDER);
    const modelo = process.env.AI_MODEL;
    ultimoSnapshot = { provedor, modelo, envVars: {} };
    ultimaSyncMs = now;
    return ultimoSnapshot;
  }
}
