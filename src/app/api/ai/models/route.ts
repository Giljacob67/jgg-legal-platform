import { NextResponse } from "next/server";
import { requireRBAC } from "@/lib/api-auth";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
  architecture?: {
    modality?: string;
  };
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

interface OpenAICompatibleModel {
  id: string;
}

interface OpenAICompatibleModelsResponse {
  data?: OpenAICompatibleModel[];
}

interface OllamaTag {
  name: string;
  details?: {
    family?: string;
    parameter_size?: string;
  };
}

interface OllamaTagsResponse {
  models?: OllamaTag[];
}

type ModeloResposta = {
  id: string;
  label: string;
  provedor: "openrouter" | "kilocode" | "ollama";
  provedorLabel: string;
  descricao: string;
  contexto: number | null;
  custo: "gratuito" | "baixo" | "medio" | "alto" | "local" | "desconhecido";
  precoPorMilhaoTokens: number | null;
  gratuito: boolean;
  suportaVisao: boolean;
};

function buildOllamaV1ModelsUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/v1")) return `${normalized}/models`;
  return `${normalized}/v1/models`;
}

function parseOpenRouterCost(precoPorMilhao: number | null): ModeloResposta["custo"] {
  if (precoPorMilhao === null) return "desconhecido";
  if (precoPorMilhao === 0) return "gratuito";
  if (precoPorMilhao < 0.5) return "baixo";
  if (precoPorMilhao < 5) return "medio";
  return "alto";
}

function sortByCostAndLabel(modelos: ModeloResposta[]) {
  const ordemCusto: Record<ModeloResposta["custo"], number> = {
    gratuito: 0,
    local: 1,
    baixo: 2,
    medio: 3,
    alto: 4,
    desconhecido: 5,
  };
  modelos.sort((a, b) => {
    const diff = ordemCusto[a.custo] - ordemCusto[b.custo];
    if (diff !== 0) return diff;
    return a.label.localeCompare(b.label);
  });
}

/**
 * GET /api/ai/models
 * Lista modelos dinamicos dos gateways configurados (OpenRouter/KiloCode)
 * e do endpoint Ollama (local ou Pro/remoto).
 */
export async function GET() {
  const forbidden = await requireRBAC("administracao", "leitura");
  if (forbidden) return forbidden;

  await syncRuntimeAIConfig();

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const kiloKey = process.env.KILO_API_KEY;
  const ollamaBaseURL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const ollamaApiKey = process.env.OLLAMA_API_KEY;
  const podeConsultarOllama = Boolean(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_KEY);

  if (!openrouterKey && !kiloKey && !podeConsultarOllama) {
    return NextResponse.json(
      {
        error: "Nenhum gateway/model provider configurado para consulta dinâmica.",
        modelos: [],
      },
      { status: 200 },
    );
  }

  try {
    const modelos: ModeloResposta[] = [];

    const fetchOpenrouter = openrouterKey
      ? fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://jgg.adv.br",
            "X-Title": "JGG Legal Platform",
          },
          next: { revalidate: 600 },
        }).catch(() => null)
      : Promise.resolve(null);

    const fetchKilo = kiloKey
      ? fetch("https://api.kilo.ai/api/gateway/models", {
          headers: {
            Authorization: `Bearer ${kiloKey}`,
            "HTTP-Referer": "https://jgg.adv.br",
            "X-Title": "JGG Legal Platform",
          },
          next: { revalidate: 600 },
        }).catch(() => null)
      : Promise.resolve(null);

    const fetchOllama = podeConsultarOllama
      ? fetch(`${ollamaBaseURL.replace(/\/$/, "")}/api/tags`, {
          headers: ollamaApiKey ? { Authorization: `Bearer ${ollamaApiKey}` } : undefined,
          next: { revalidate: 60 },
        }).catch(() => null)
      : Promise.resolve(null);

    const [respOpenrouter, respKilo, respOllama] = await Promise.all([
      fetchOpenrouter,
      fetchKilo,
      fetchOllama,
    ]);

    if (respOpenrouter?.ok) {
      const json = (await respOpenrouter.json()) as OpenRouterModelsResponse;
      for (const m of json.data ?? []) {
        const precoPorMilhao = m.pricing?.prompt ? parseFloat(m.pricing.prompt) * 1_000_000 : null;
        const custo = parseOpenRouterCost(precoPorMilhao);
        const [provedorSlug] = m.id.split("/");

        modelos.push({
          id: m.id,
          label: m.name,
          provedor: "openrouter",
          provedorLabel: provedorSlug
            ? `${provedorSlug.charAt(0).toUpperCase()}${provedorSlug.slice(1)} via OpenRouter`
            : "OpenRouter",
          descricao: m.description ?? "",
          contexto: m.context_length ?? m.top_provider?.context_length ?? null,
          custo,
          precoPorMilhaoTokens: precoPorMilhao,
          gratuito: custo === "gratuito",
          suportaVisao: m.architecture?.modality?.includes("image") ?? false,
        });
      }
    }

    if (respKilo?.ok) {
      const json = (await respKilo.json()) as OpenRouterModelsResponse;
      for (const m of json.data ?? []) {
        const precoPorMilhao = m.pricing?.prompt ? parseFloat(m.pricing.prompt) * 1_000_000 : null;
        const custo = parseOpenRouterCost(precoPorMilhao);

        modelos.push({
          id: m.id,
          label: m.name,
          provedor: "kilocode",
          provedorLabel: "KiloCode Gateway",
          descricao: m.description ?? "",
          contexto: m.context_length ?? m.top_provider?.context_length ?? null,
          custo,
          precoPorMilhaoTokens: precoPorMilhao,
          gratuito: custo === "gratuito",
          suportaVisao: m.architecture?.modality?.includes("image") ?? false,
        });
      }
    }

    if (respOllama?.ok) {
      const json = (await respOllama.json()) as OllamaTagsResponse;
      for (const tag of json.models ?? []) {
        const nome = tag.name;
        const cloud = nome.includes(":cloud");
        modelos.push({
          id: nome,
          label: nome,
          provedor: "ollama",
          provedorLabel: cloud ? "Ollama Pro" : "Ollama",
          descricao: cloud
            ? "Modelo detectado no endpoint Ollama Pro/remoto configurado."
            : "Modelo detectado no runtime Ollama local.",
          contexto: null,
          custo: cloud ? "medio" : "local",
          precoPorMilhaoTokens: null,
          gratuito: false,
          suportaVisao: false,
        });
      }
    } else if (podeConsultarOllama) {
      const respOllamaV1 = await fetch(buildOllamaV1ModelsUrl(ollamaBaseURL), {
        headers: ollamaApiKey ? { Authorization: `Bearer ${ollamaApiKey}` } : undefined,
        next: { revalidate: 60 },
      }).catch(() => null);

      if (respOllamaV1?.ok) {
        const json = (await respOllamaV1.json()) as OpenAICompatibleModelsResponse;
        for (const model of json.data ?? []) {
          const nome = model.id;
          const cloud = nome.includes(":cloud");
          modelos.push({
            id: nome,
            label: nome,
            provedor: "ollama",
            provedorLabel: "Ollama Pro",
            descricao: "Modelo detectado em endpoint Ollama OpenAI-compatible (/v1).",
            contexto: null,
            custo: cloud ? "medio" : "desconhecido",
            precoPorMilhaoTokens: null,
            gratuito: false,
            suportaVisao: false,
          });
        }
      }
    }

    const vistos = new Set<string>();
    const modelosUnicos = modelos.filter((item) => {
      const chave = `${item.provedor}:${item.id}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });

    sortByCostAndLabel(modelosUnicos);

    return NextResponse.json({
      total: modelosUnicos.length,
      gratuitos: modelosUnicos.filter((m) => m.gratuito).length,
      locais: modelosUnicos.filter((m) => m.custo === "local").length,
      modelos: modelosUnicos,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao buscar modelos dinâmicos.",
        modelos: [],
      },
      { status: 500 },
    );
  }
}
