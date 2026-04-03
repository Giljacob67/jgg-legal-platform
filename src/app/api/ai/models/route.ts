import { NextResponse } from "next/server";

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
    tokenizer?: string;
    instruct_type?: string;
  };
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * GET /api/ai/models
 * Busca todos os modelos disponíveis no OpenRouter, incluindo os gratuitos.
 * Filtra, ordena e anota cada modelo com metadados úteis.
 */
export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY não configurada.", modelos: [] },
      { status: 200 } // retorna 200 com lista vazia para UI não quebrar
    );
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://jgg.adv.br",
        "X-Title": "JGG Legal Platform",
      },
      // Cache por 10 minutos no servidor — modelos não mudam com frequência
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      throw new Error(`OpenRouter respondeu com status ${res.status}`);
    }

    const json = (await res.json()) as OpenRouterModelsResponse;

    const modelos = json.data.map((m) => {
      // Preço por 1M tokens em prompt (string "0.0000001" → número)
      const precoPorMilhao = m.pricing?.prompt
        ? parseFloat(m.pricing.prompt) * 1_000_000
        : null;

      const gratuito = precoPorMilhao !== null && precoPorMilhao === 0;
      const custoBaixo = precoPorMilhao !== null && precoPorMilhao < 0.5;
      const custoMedio = precoPorMilhao !== null && precoPorMilhao >= 0.5 && precoPorMilhao < 5;

      const custo: "gratuito" | "baixo" | "medio" | "alto" | "desconhecido" = gratuito
        ? "gratuito"
        : custoBaixo
        ? "baixo"
        : custoMedio
        ? "medio"
        : precoPorMilhao !== null
        ? "alto"
        : "desconhecido";

      // Detectar se suporta visão (multimodal)
      const suportaVisao = m.architecture?.modality?.includes("image") ?? false;

      // Extrair provider do ID (ex: "anthropic/claude-3.5-sonnet" → "Anthropic")
      const [provedorSlug] = m.id.split("/");
      const provedorLabel = provedorSlug
        ? provedorSlug.charAt(0).toUpperCase() + provedorSlug.slice(1)
        : "Desconhecido";

      return {
        id: m.id,
        label: m.name,
        provedorLabel,
        descricao: m.description ?? "",
        contexto: m.context_length ?? m.top_provider?.context_length ?? null,
        custo,
        precoPorMilhaoTokens: precoPorMilhao,
        gratuito,
        suportaVisao,
      };
    });

    // Ordenação: gratuitos primeiro, depois por custo crescente, depois alfabético
    modelos.sort((a, b) => {
      const ordemCusto: Record<string, number> = {
        gratuito: 0,
        baixo: 1,
        medio: 2,
        alto: 3,
        desconhecido: 4,
      };
      const diffCusto = (ordemCusto[a.custo] ?? 4) - (ordemCusto[b.custo] ?? 4);
      if (diffCusto !== 0) return diffCusto;
      return a.label.localeCompare(b.label);
    });

    return NextResponse.json({
      total: modelos.length,
      gratuitos: modelos.filter((m) => m.gratuito).length,
      modelos,
    });
  } catch (error) {
    console.error("[/api/ai/models] Erro ao buscar modelos do OpenRouter:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        modelos: [],
      },
      { status: 500 }
    );
  }
}
