import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createXai } from "@ai-sdk/xai";
import { createMistral } from "@ai-sdk/mistral";
import { createOllama } from "ollama-ai-provider";
import type { LanguageModel } from "ai";

/**
 * Catálogo de modelos suportados na plataforma JGG.
 */
export interface ModeloCatalogo {
  id: string;
  label: string;
  provedor: ProvedorIA;
  provedorLabel: string;
  descricao: string;
  suportaVisao: boolean;
  suportaStructuredOutput: boolean;
  custo: "gratuito" | "baixo" | "medio" | "alto" | "local" | "desconhecido";
  recomendado: boolean;
}

export type ProvedorIA =
  | "openai"
  | "openrouter"
  | "kilocode"
  | "anthropic"
  | "google"
  | "groq"
  | "xai"
  | "mistral"
  | "ollama"
  | "custom";

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
    label: "GPT-4o Mini ⭐",
    provedor: "openai",
    provedorLabel: "OpenAI",
    descricao: "Versão rápida e econômica. Ideal para triagem, sugestões e extração de fatos.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: true,
  },
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    provedor: "openai",
    provedorLabel: "OpenAI",
    descricao: "Versão mais recente da OpenAI. Alta capacidade de raciocínio e seguimento de instruções.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: true,
  },
  {
    id: "gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    provedor: "openai",
    provedorLabel: "OpenAI",
    descricao: "Versão econômica do GPT-4.1. Ótimo custo-benefício para tarefas do dia a dia.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: true,
  },
  {
    id: "o4-mini",
    label: "o4-mini",
    provedor: "openai",
    provedorLabel: "OpenAI",
    descricao: "Modelo de raciocínio econômico da OpenAI. Ótimo para análise jurídica estruturada.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: false,
  },
  // ── Anthropic Direto ─────────────────────────────────────────────────
  {
    id: "claude-opus-4-5",
    label: "Claude Opus 4.5",
    provedor: "anthropic",
    provedorLabel: "Anthropic",
    descricao: "Modelo mais poderoso da Anthropic via API direta. Máxima qualidade para petições complexas.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: true,
  },
  {
    id: "claude-sonnet-4-5",
    label: "Claude Sonnet 4.5 ⭐",
    provedor: "anthropic",
    provedorLabel: "Anthropic",
    descricao: "Melhor equilíbrio qualidade/custo via API direta Anthropic.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: true,
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provedor: "anthropic",
    provedorLabel: "Anthropic",
    descricao: "Rápido e econômico. Ideal para triagem, sugestões e extração de fatos.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  // ── Google Direto ─────────────────────────────────────────────────────
  {
    id: "gemini-2.5-pro-preview-05-06",
    label: "Gemini 2.5 Pro",
    provedor: "google",
    provedorLabel: "Google AI",
    descricao: "Modelo mais avançado do Google. Raciocínio de alta qualidade e contexto longo.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: true,
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash ⭐",
    provedor: "google",
    provedorLabel: "Google AI",
    descricao: "Muito rápido e econômico. Ideal para processar grandes volumes de documentos.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: true,
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash Lite",
    provedor: "google",
    provedorLabel: "Google AI",
    descricao: "Versão mais leve do Flash. Excelente custo-benefício para tarefas simples.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  {
    id: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    provedor: "google",
    provedorLabel: "Google AI",
    descricao: "Geração anterior do Flash. Contexto longo e econômico.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  // ── Groq ─────────────────────────────────────────────────────────────
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B ⭐",
    provedor: "groq",
    provedorLabel: "Groq",
    descricao: "Llama 3.3 rodando na infraestrutura ultra-rápida do Groq. Ótimo custo-benefício.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: true,
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    provedor: "groq",
    provedorLabel: "Groq",
    descricao: "Modelo pequeno e extremamente rápido. Para triagem e respostas instantâneas.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  {
    id: "mixtral-8x7b-32768",
    label: "Mixtral 8x7B",
    provedor: "groq",
    provedorLabel: "Groq",
    descricao: "Modelo MoE da Mistral via Groq. Bom desempenho com contexto longo (32k).",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  {
    id: "gemma2-9b-it",
    label: "Gemma 2 9B",
    provedor: "groq",
    provedorLabel: "Groq",
    descricao: "Modelo Google Gemma 2 via Groq. Rápido e eficiente para análises simples.",
    suportaVisao: false,
    suportaStructuredOutput: false,
    custo: "baixo",
    recomendado: false,
  },
  // ── xAI / Grok ───────────────────────────────────────────────────────
  {
    id: "grok-3",
    label: "Grok 3 ⭐",
    provedor: "xai",
    provedorLabel: "xAI",
    descricao: "Modelo mais capaz da xAI. Raciocínio avançado com acesso a dados em tempo real.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: true,
  },
  {
    id: "grok-3-mini",
    label: "Grok 3 Mini",
    provedor: "xai",
    provedorLabel: "xAI",
    descricao: "Versão econômica do Grok 3. Boa relação custo-benefício para tarefas do dia a dia.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: false,
  },
  {
    id: "grok-2",
    label: "Grok 2",
    provedor: "xai",
    provedorLabel: "xAI",
    descricao: "Geração anterior. Ainda capaz e mais econômico que o Grok 3.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: false,
  },
  // ── Mistral Direto ───────────────────────────────────────────────────
  {
    id: "mistral-large-latest",
    label: "Mistral Large ⭐",
    provedor: "mistral",
    provedorLabel: "Mistral AI",
    descricao: "Modelo mais capaz da Mistral. Excelente em português e análise jurídica estruturada.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: true,
  },
  {
    id: "mistral-small-latest",
    label: "Mistral Small",
    provedor: "mistral",
    provedorLabel: "Mistral AI",
    descricao: "Versão econômica do Mistral. Boa para triagem e extração de fatos.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  {
    id: "codestral-latest",
    label: "Codestral",
    provedor: "mistral",
    provedorLabel: "Mistral AI",
    descricao: "Especializado em código. Útil para automações e scripts jurídicos.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  // ── Ollama (local) ───────────────────────────────────────────────────
  {
    id: "llama3.3",
    label: "Llama 3.3 (local)",
    provedor: "ollama",
    provedorLabel: "Ollama",
    descricao: "Llama 3.3 rodando localmente via Ollama. Sem custo, sem envio de dados.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "local",
    recomendado: true,
  },
  {
    id: "llama3.2",
    label: "Llama 3.2 (local)",
    provedor: "ollama",
    provedorLabel: "Ollama",
    descricao: "Modelo leve e rápido para rodar localmente. Ideal para desenvolvimento.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "local",
    recomendado: false,
  },
  {
    id: "qwen2.5:14b",
    label: "Qwen 2.5 14B (local)",
    provedor: "ollama",
    provedorLabel: "Ollama",
    descricao: "Qwen 2.5 14B rodando localmente. Excelente em tarefas de análise de texto em português.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "local",
    recomendado: true,
  },
  {
    id: "deepseek-r1:8b",
    label: "DeepSeek R1 8B (local)",
    provedor: "ollama",
    provedorLabel: "Ollama",
    descricao: "Modelo de raciocínio local. Bom para análises lógicas sem custo de API.",
    suportaVisao: false,
    suportaStructuredOutput: false,
    custo: "local",
    recomendado: false,
  },
  {
    id: "mistral",
    label: "Mistral 7B (local)",
    provedor: "ollama",
    provedorLabel: "Ollama",
    descricao: "Mistral 7B rodando localmente. Rápido e eficiente para a maioria das tarefas.",
    suportaVisao: false,
    suportaStructuredOutput: false,
    custo: "local",
    recomendado: false,
  },
  {
    id: "phi4",
    label: "Phi-4 (local)",
    provedor: "ollama",
    provedorLabel: "Ollama",
    descricao: "Modelo compacto da Microsoft. Surpreendente para seu tamanho, roda em hardware modesto.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "local",
    recomendado: false,
  },
  {
    id: "kimi-k2.6:cloud",
    label: "Kimi K2.6 Cloud (Ollama Pro)",
    provedor: "ollama",
    provedorLabel: "Ollama Pro",
    descricao: "Modelo cloud via Ollama Pro para alta qualidade sem depender de GPU local.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: true,
  },
  // ── OpenRouter → Anthropic ───────────────────────────────────────────
  {
    id: "anthropic/claude-opus-4-5",
    label: "Claude Opus 4.5",
    provedor: "openrouter",
    provedorLabel: "Anthropic via OpenRouter",
    descricao: "Modelo mais poderoso do Claude via OpenRouter.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: true,
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5 ⭐",
    provedor: "openrouter",
    provedorLabel: "Anthropic via OpenRouter",
    descricao: "Melhor equilíbrio qualidade/custo via OpenRouter.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: true,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    provedor: "openrouter",
    provedorLabel: "Anthropic via OpenRouter",
    descricao: "Geração anterior do Sonnet. Excelente para documentos longos.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: false,
  },
  {
    id: "anthropic/claude-3-5-haiku",
    label: "Claude 3.5 Haiku",
    provedor: "openrouter",
    provedorLabel: "Anthropic via OpenRouter",
    descricao: "Rápido e econômico para triagem e sugestões.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  // ── OpenRouter → Google ──────────────────────────────────────────────
  {
    id: "google/gemini-2.5-pro-preview",
    label: "Gemini 2.5 Pro",
    provedor: "openrouter",
    provedorLabel: "Google via OpenRouter",
    descricao: "Modelo mais avançado do Google via OpenRouter.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "alto",
    recomendado: false,
  },
  {
    id: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
    provedor: "openrouter",
    provedorLabel: "Google via OpenRouter",
    descricao: "Muito rápido, contexto longo, via OpenRouter.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  {
    id: "google/gemini-2.0-flash-lite:free",
    label: "Gemini 2.0 Flash Lite (Gratuito)",
    provedor: "openrouter",
    provedorLabel: "Google via OpenRouter",
    descricao: "Versão gratuita e leve do Gemini via OpenRouter.",
    suportaVisao: true,
    suportaStructuredOutput: false,
    custo: "gratuito",
    recomendado: false,
  },
  // ── OpenRouter → Meta / Llama ────────────────────────────────────────
  {
    id: "meta-llama/llama-4-maverick",
    label: "Llama 4 Maverick",
    provedor: "openrouter",
    provedorLabel: "Meta via OpenRouter",
    descricao: "Modelo mais avançado da Meta via OpenRouter.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: false,
  },
  {
    id: "meta-llama/llama-4-scout:free",
    label: "Llama 4 Scout (Gratuito)",
    provedor: "openrouter",
    provedorLabel: "Meta via OpenRouter",
    descricao: "Modelo gratuito e capaz da Meta via OpenRouter.",
    suportaVisao: true,
    suportaStructuredOutput: false,
    custo: "gratuito",
    recomendado: false,
  },
  // ── OpenRouter → Mistral ─────────────────────────────────────────────
  {
    id: "mistralai/mistral-small-3.2",
    label: "Mistral Small 3.2",
    provedor: "openrouter",
    provedorLabel: "Mistral via OpenRouter",
    descricao: "Excelente em português. Bom custo-benefício via OpenRouter.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  // ── OpenRouter → DeepSeek ────────────────────────────────────────────
  {
    id: "deepseek/deepseek-chat-v3-0324",
    label: "DeepSeek V3 (Mar/2025)",
    provedor: "openrouter",
    provedorLabel: "DeepSeek via OpenRouter",
    descricao: "Versão mais recente do DeepSeek via OpenRouter.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  {
    id: "deepseek/deepseek-r1:free",
    label: "DeepSeek R1 (Gratuito)",
    provedor: "openrouter",
    provedorLabel: "DeepSeek via OpenRouter",
    descricao: "Modelo de raciocínio gratuito via OpenRouter.",
    suportaVisao: false,
    suportaStructuredOutput: false,
    custo: "gratuito",
    recomendado: false,
  },
  // ── OpenRouter → Qwen ────────────────────────────────────────────────
  {
    id: "qwen/qwen3.6-plus:free",
    label: "Qwen 3.6 Plus (Gratuito)",
    provedor: "openrouter",
    provedorLabel: "Alibaba via OpenRouter",
    descricao: "Modelo gratuito da Alibaba via OpenRouter.",
    suportaVisao: false,
    suportaStructuredOutput: false,
    custo: "gratuito",
    recomendado: false,
  },
  {
    id: "qwen/qwen-2.5-72b-instruct",
    label: "Qwen 2.5 72B",
    provedor: "openrouter",
    provedorLabel: "Alibaba via OpenRouter",
    descricao: "Modelo robusto da Alibaba via OpenRouter.",
    suportaVisao: false,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
  // ── KiloCode ─────────────────────────────────────────────────────────
  {
    id: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5 (KiloCode)",
    provedor: "kilocode",
    provedorLabel: "KiloCode AI Gateway",
    descricao: "Claude Sonnet via gateway KiloCode com billing unificado.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "medio",
    recomendado: true,
  },
  {
    id: "anthropic/claude-3-5-haiku",
    label: "Claude 3.5 Haiku (KiloCode)",
    provedor: "kilocode",
    provedorLabel: "KiloCode AI Gateway",
    descricao: "Claude Haiku via gateway KiloCode. Rápido e econômico.",
    suportaVisao: true,
    suportaStructuredOutput: true,
    custo: "baixo",
    recomendado: false,
  },
];

// ── Modelos padrão por provedor ───────────────────────────────────────────────

const MODELO_PADRAO: Record<ProvedorIA, string> = {
  openai: "gpt-4o-mini",
  openrouter: "anthropic/claude-sonnet-4-5",
  kilocode: "anthropic/claude-sonnet-4-5",
  anthropic: "claude-sonnet-4-5",
  google: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
  xai: "grok-3-mini",
  mistral: "mistral-large-latest",
  ollama: "llama3.3",
  custom: "",
};

// ── Tipos e funções públicas ──────────────────────────────────────────────────

/**
 * Retorna o provedor configurado.
 * Prioridade: AI_PROVIDER env > detecção automática por chaves disponíveis.
 */
export function getProvedor(): ProvedorIA {
  const env = process.env.AI_PROVIDER as ProvedorIA | undefined;
  const provedores: ProvedorIA[] = ["openai", "openrouter", "kilocode", "anthropic", "google", "groq", "xai", "mistral", "ollama", "custom"];
  if (env && provedores.includes(env)) return env;

  // Auto-detecção pela chave disponível
  if (process.env.CUSTOM_BASE_URL) return "custom";
  if (process.env.KILO_API_KEY) return "kilocode";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.XAI_API_KEY) return "xai";
  if (process.env.MISTRAL_API_KEY) return "mistral";
  if (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_KEY) return "ollama";
  return "openai";
}

/**
 * Retorna o ID do modelo a ser usado.
 * Prioridade: AI_MODEL env > padrão do provedor.
 */
export function getModeloId(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  return MODELO_PADRAO[getProvedor()];
}

/**
 * Cria e retorna a instância do LLM configurado, pronto para uso nos agentes.
 *
 * @param modeloOverride - ID explícito do modelo. Se não fornecido, usa AI_MODEL env ou padrão.
 */
export function getLLM(modeloOverride?: string): LanguageModel {
  const provedor = getProvedor();
  const modeloId = modeloOverride ?? getModeloId();

  switch (provedor) {
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY não configurada.");
      return createOpenAI({ apiKey })(modeloId) as LanguageModel;
    }

    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");
      return createAnthropic({ apiKey })(modeloId) as LanguageModel;
    }

    case "google": {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada.");
      return createGoogleGenerativeAI({ apiKey })(modeloId) as LanguageModel;
    }

    case "groq": {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("GROQ_API_KEY não configurada.");
      return createGroq({ apiKey })(modeloId) as LanguageModel;
    }

    case "xai": {
      const apiKey = process.env.XAI_API_KEY;
      if (!apiKey) throw new Error("XAI_API_KEY não configurada.");
      return createXai({ apiKey })(modeloId) as LanguageModel;
    }

    case "mistral": {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) throw new Error("MISTRAL_API_KEY não configurada.");
      return createMistral({ apiKey })(modeloId) as LanguageModel;
    }

    case "ollama": {
      const baseURLConfigurada = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/+$/, "");
      const apiKey = process.env.OLLAMA_API_KEY;

      // Alguns endpoints remotos de Ollama Pro expõem API OpenAI-compatible em /v1.
      // Quando detectado, usamos o provider OpenAI com baseURL customizado.
      if (baseURLConfigurada.endsWith("/v1")) {
        return createOpenAI({
          baseURL: baseURLConfigurada,
          apiKey: apiKey ?? "ollama",
        })(modeloId) as LanguageModel;
      }

      // ollama-ai-provider espera baseURL terminando em /api (ex.: http://localhost:11434/api).
      const baseURL = baseURLConfigurada.endsWith("/api")
        ? baseURLConfigurada
        : `${baseURLConfigurada}/api`;

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      // ollama-ai-provider retorna LanguageModelV1 — cast via unknown para compatibilidade
      return createOllama({ baseURL, headers })(modeloId) as unknown as LanguageModel;
    }

    case "openrouter": {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("OPENROUTER_API_KEY não configurada.");
      return createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        headers: {
          "HTTP-Referer": "https://jgg.adv.br",
          "X-Title": "JGG Legal Platform",
        },
      })(modeloId) as LanguageModel;
    }

    case "kilocode": {
      const apiKey = process.env.KILO_API_KEY;
      if (!apiKey) throw new Error("KILO_API_KEY não configurada.");
      return createOpenAI({
        baseURL: "https://api.kilo.ai/api/gateway",
        apiKey,
        headers: {
          "HTTP-Referer": "https://jgg.adv.br",
          "X-Title": "JGG Legal Platform",
        },
      })(modeloId) as LanguageModel;
    }

    case "custom": {
      const baseURL = process.env.CUSTOM_BASE_URL;
      if (!baseURL) throw new Error("CUSTOM_BASE_URL não configurada.");
      if (!modeloId) throw new Error("AI_MODEL não configurado para provedor custom.");
      const apiKey = process.env.CUSTOM_API_KEY ?? "no-key";
      return createOpenAI({ baseURL, apiKey })(modeloId) as LanguageModel;
    }
  }
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
 * Verifica se alguma chave de IA está configurada.
 */
export function isAIAvailable(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.KILO_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.MISTRAL_API_KEY ||
    process.env.OLLAMA_BASE_URL ||
    process.env.OLLAMA_API_KEY ||
    process.env.CUSTOM_BASE_URL
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
  const LABEL_PROVEDOR: Record<ProvedorIA, string> = {
    openai: "OpenAI",
    openrouter: "OpenRouter",
    kilocode: "KiloCode AI Gateway",
    anthropic: "Anthropic",
    google: "Google AI",
    groq: "Groq",
    xai: "xAI",
    mistral: "Mistral AI",
    ollama: "Ollama (local)",
    custom: "Custom (OpenAI-compatible)",
  };
  return {
    provedor,
    modeloId,
    modeloInfo: MODELOS_CATALOGADOS.find((m) => m.id === modeloId && m.provedor === provedor) ??
      MODELOS_CATALOGADOS.find((m) => m.id === modeloId) ?? {
        id: modeloId,
        label: modeloId,
        provedor,
        provedorLabel: LABEL_PROVEDOR[provedor],
        descricao: "Modelo personalizado configurado via env AI_MODEL.",
        suportaVisao: false,
        suportaStructuredOutput: true,
        custo: "desconhecido",
        recomendado: false,
      },
    disponivel: isAIAvailable(),
  };
}
