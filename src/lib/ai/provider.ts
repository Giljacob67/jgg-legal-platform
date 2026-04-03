import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Catálogo de modelos suportados na plataforma JGG.
 * Cada modelo tem um ID, label de exibição, provedor e características.
 */
export interface ModeloCatalogo {
  id: string;
  label: string;
  provedor: "openai" | "openrouter";
  /** Slug para exibição amigável do provedor */
  provedorLabel: string;
  descricao: string;
  /** Capacidades: suporta visão? suporta structured output? */
  suportaVisao: boolean;
  suportaStructuredOutput: boolean;
  /** Tier de custo relativo */
  custo: "baixo" | "medio" | "alto";
  /** Adequado para tarefas jurídicas complexas */
  recomendado: boolean;
}

export const MODELOS_CATALOGADOS: ModeloCatalogo[] = [
  // ── OpenAI ──────────────────────────────────────────────────────────
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provedor: "openai",
    provedorLabel: "OpenAI",
    descricao: "Modelo mais capaz da OpenAI. Excelente para análise jurídica complexa e redação estruturada.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: true,
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provedor: "openai",
    provedorLabel: "OpenAI",
    descricao: "Versão rápida e econômica. Ideal para triagem, sugestões e extração de fatos.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: true,
  },
  // ── OpenRouter → Anthropic ───────────────────────────────────────────
  {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    provedor: "openrouter",
    provedorLabel: "Anthropic via OpenRouter",
    descricao: "Melhor modelo do mercado para redação jurídica e análise de documentos longos.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: true,
  },
  {
    id: "anthropic/claude-3-haiku",
    label: "Claude 3 Haiku",
    provedor: "openrouter",
    provedorLabel: "Anthropic via OpenRouter",
    descricao: "Rápido e econômico. Ótimo para correções e sugestões inline no editor.",
    suportaVisao: false,
    suportaStructuredOutput: false,
    custo: "baixo",
    recomendado: false,
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provedor: "openrouter",
    provedorLabel: "Anthropic via OpenRouter",
    descricao: "Versão mais recente do Claude. Excepcional para raciocínio jurídico complexo.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: true,
  },
  // ── OpenRouter → Google ──────────────────────────────────────────────
  {
    id: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
    provedor: "openrouter",
    provedorLabel: "Google via OpenRouter",
    descricao: "Muito rápido, contexto longo. Ideal para processar grandes volumes de documentos.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  {
    id: "google/gemini-pro-1.5",
    label: "Gemini Pro 1.5",
    provedor: "openrouter",
    provedorLabel: "Google via OpenRouter",
    descricao: "Contexto de até 1M tokens. Excelente para análise de processos completos.",
    suportaVisao: true,
    suportaStructuredOutput: false,
    custo: "medio",
    recomendado: false,
  },
  // ── OpenRouter → Meta ────────────────────────────────────────────────
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    label: "Llama 3.1 70B",
    provedor: "openrouter",
    provedorLabel: "Meta via OpenRouter",
    descricao: "Open source poderoso. Boa opção para quem prefere não usar modelos proprietários.",
    suportaVisao: false,
    suportaStructuredOutput: false,
    custo: "baixo",
    recomendado: false,
  },
  // ── OpenRouter → Mistral ─────────────────────────────────────────────
  {
    id: "mistralai/mistral-large",
    label: "Mistral Large",
    provedor: "openrouter",
    provedorLabel: "Mistral via OpenRouter",
    descricao: "Excelente em português. Bom custo-benefício para tarefas jurídicas de médio porte.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: false,
  },
  // ── OpenRouter → DeepSeek ────────────────────────────────────────────
  {
    id: "deepseek/deepseek-chat",
    label: "DeepSeek V3",
    provedor: "openrouter",
    provedorLabel: "DeepSeek via OpenRouter",
    descricao: "Custo extremamente baixo com alta capacidade de raciocínio. Ótimo para triagem.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
];

/** Modelo padrão quando nenhum está configurado */
const MODELO_PADRAO_OPENAI = "gpt-4o-mini";
const MODELO_PADRAO_OPENROUTER = "anthropic/claude-3.5-sonnet";
const MODELO_PADRAO_KILOCODE = "anthropic/claude-3.5-sonnet"; // KiloCode suporta os mesmos modelos

export type ProvedorIA = "openai" | "openrouter" | "kilocode";

/**
 * Retorna o provedor configurado baseado nas variáveis de ambiente.
 * Prioridade: AI_PROVIDER env > detecção automática por chaves disponíveis
 * Ordem de auto-detecção: kilocode > openrouter > openai
 */
export function getProvedor(): ProvedorIA {
  const envProvedor = process.env.AI_PROVIDER as ProvedorIA | undefined;
  if (envProvedor === "openrouter") return "openrouter";
  if (envProvedor === "kilocode") return "kilocode";
  if (envProvedor === "openai") return "openai";

  // Auto-detectar pela chave disponível
  if (process.env.KILO_API_KEY) return "kilocode";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return "openai";
}

/**
 * Retorna o ID do modelo a ser usado.
 * Prioridade: AI_MODEL env > padrão do provedor
 */
export function getModeloId(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  const provedor = getProvedor();
  if (provedor === "openrouter") return MODELO_PADRAO_OPENROUTER;
  if (provedor === "kilocode") return MODELO_PADRAO_KILOCODE;
  return MODELO_PADRAO_OPENAI;
}

/**
 * Cria e retorna a instância do cliente AI com o provedor configurado.
 * Suporta OpenAI direto, OpenRouter e KiloCode AI Gateway.
 */
function criarClienteIA() {
  const provedor = getProvedor();

  if (provedor === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY não configurada.");
    return createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      headers: {
        "HTTP-Referer": "https://jgg.adv.br",
        "X-Title": "JGG Legal Platform",
      },
    });
  }

  if (provedor === "kilocode") {
    const apiKey = process.env.KILO_API_KEY;
    if (!apiKey) throw new Error("KILO_API_KEY não configurada.");
    return createOpenAI({
      // Gateway OpenAI-compatível do KiloCode
      // Docs: https://kilo.ai/docs/api-gateway
      baseURL: "https://api.kilo.ai/api/gateway",
      apiKey,
      headers: {
        "HTTP-Referer": "https://jgg.adv.br",
        "X-Title": "JGG Legal Platform",
      },
    });
  }

  // Default: OpenAI direto
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada.");
  return createOpenAI({ apiKey });
}

/**
 * Retorna o modelo de linguagem (LLM) configurado, pronto para uso nos agentes.
 * Aceita QUALQUER ID de modelo válido — OpenAI ou qualquer modelo do OpenRouter
 * (incluindo os gratuitos como meta-llama/llama-3.1-8b-instruct:free).
 *
 * @param modeloOverride - ID explícito do modelo. Se não fornecido, usa AI_MODEL env ou padrão.
 * @example
 * getLLM()                                         // usa env AI_MODEL
 * getLLM("anthropic/claude-3.5-sonnet")             // Claude via OpenRouter
 * getLLM("meta-llama/llama-3.1-8b-instruct:free")  // Llama GRATUITO via OpenRouter
 * getLLM("google/gemini-2.0-flash-lite:free")      // Gemini Flash GRATUITO
 */
export function getLLM(modeloOverride?: string): LanguageModel {
  const cliente = criarClienteIA();
  const modeloId = modeloOverride ?? getModeloId();
  return cliente(modeloId) as LanguageModel;
}

/**
 * Retorna um modelo de embedding.
 * Embeddings são sempre OpenAI (pgvector usa dimensão 1536 do text-embedding-3-small).
 */
export function getEmbeddingModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY necessária para embeddings.");
  const openai = createOpenAI({ apiKey });
  return openai.embedding("text-embedding-3-small");
}

/**
 * Verifica se IA está disponível (alguma chave configurada)
 */
export function isAIAvailable(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.KILO_API_KEY
  );
}

/**
 * Retorna informações sobre a configuração atual do provedor IA.
 */
export function getConfigAtual(): {
  provedor: ProvedorIA;
  modeloId: string;
  modeloInfo: ModeloCatalogo | undefined;
  disponivel: boolean;
} {
  const provedor = getProvedor();
  const modeloId = getModeloId();
  const provedorLabel: Record<ProvedorIA, string> = {
    openai: "OpenAI",
    openrouter: "OpenRouter",
    kilocode: "KiloCode AI Gateway",
  };
  return {
    provedor,
    modeloId,
    modeloInfo: MODELOS_CATALOGADOS.find((m) => m.id === modeloId) ?? {
      id: modeloId,
      label: modeloId,
      provedor: provedor === "openai" ? "openai" : "openrouter",
      provedorLabel: provedorLabel[provedor],
      descricao: "Modelo personalizado configurado via env AI_MODEL.",
      suportaVisao: false,
      suportaStructuredOutput: true,
      custo: "desconhecido" as never,
      recomendado: false,
    },
    disponivel: isAIAvailable(),
  };
}
