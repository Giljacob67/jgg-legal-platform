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
let ultimoSnapshot: { provedor?: ProvedorIA; modelo?: string } | null = null;

function normalizarProvedor(valor: string | undefined): ProvedorIA | undefined {
  if (!valor) return undefined;
  const normalizado = valor.trim().toLowerCase() as ProvedorIA;
  return PROVEDORES_VALIDOS.includes(normalizado) ? normalizado : undefined;
}

function applyRuntimeConfig(provedor?: ProvedorIA, modelo?: string) {
  if (provedor) process.env.AI_PROVIDER = provedor;
  if (modelo) process.env.AI_MODEL = modelo;
}

/**
 * Sincroniza AI_PROVIDER/AI_MODEL do banco para o runtime, com cache curto.
 * Mantem fallback em variaveis de ambiente quando o banco estiver indisponivel.
 */
export async function syncRuntimeAIConfig(options?: { force?: boolean }) {
  const now = Date.now();
  if (!options?.force && ultimoSnapshot && now - ultimaSyncMs < CACHE_MS) {
    applyRuntimeConfig(ultimoSnapshot.provedor, ultimoSnapshot.modelo);
    return ultimoSnapshot;
  }

  try {
    const configuracoes = await obterConfiguracoes();
    const map = new Map(configuracoes.map((item) => [item.chave, item.valor]));

    const provedor = normalizarProvedor(map.get("ai_provider")) ?? normalizarProvedor(process.env.AI_PROVIDER);
    const modelo = map.get("ai_model")?.trim() || process.env.AI_MODEL;

    ultimoSnapshot = { provedor, modelo };
    ultimaSyncMs = now;
    applyRuntimeConfig(provedor, modelo);
    return ultimoSnapshot;
  } catch {
    const provedor = normalizarProvedor(process.env.AI_PROVIDER);
    const modelo = process.env.AI_MODEL;
    ultimoSnapshot = { provedor, modelo };
    ultimaSyncMs = now;
    return ultimoSnapshot;
  }
}
