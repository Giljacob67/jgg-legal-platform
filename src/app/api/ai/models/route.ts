import { NextResponse } from "next/server";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

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

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "read" });
  if (authResult.response) return authResult.response;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const kiloKey = process.env.KILO_API_KEY;

  if (!openrouterKey && !kiloKey) {
    return NextResponse.json(
      {
        total: 0,
        gratuitos: 0,
        modelos: [],
        aviso: "Nenhuma chave de gateway configurada (OPENROUTER_API_KEY ou KILO_API_KEY).",
      },
      { status: 200 },
    );
  }

  try {
    const fetches: Promise<Response>[] = [];

    if (openrouterKey) {
      fetches.push(
        fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://jgg.adv.br",
            "X-Title": "JGG Legal Platform",
          },
          next: { revalidate: 600 },
        }),
      );
    }

    if (kiloKey) {
      fetches.push(
        fetch("https://api.kilo.ai/api/gateway/models", {
          headers: {
            Authorization: `Bearer ${kiloKey}`,
            "HTTP-Referer": "https://jgg.adv.br",
            "X-Title": "JGG Legal Platform",
          },
          next: { revalidate: 600 },
        }).catch(() => new Response(JSON.stringify({ data: [] }), { status: 200 })),
      );
    }

    const respostas = await Promise.allSettled(fetches);
    const todosModelos: OpenRouterModel[] = [];

    for (const resp of respostas) {
      if (resp.status === "fulfilled" && resp.value.ok) {
        const json = (await resp.value.json()) as OpenRouterModelsResponse;
        if (Array.isArray(json.data)) {
          todosModelos.push(...json.data);
        }
      }
    }

    const vistos = new Set<string>();
    const modelosUnicos = todosModelos.filter((m) => {
      if (vistos.has(m.id)) return false;
      vistos.add(m.id);
      return true;
    });

    const modelos = modelosUnicos.map((m: OpenRouterModel) => {
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

      const suportaVisao = m.architecture?.modality?.includes("image") ?? false;

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

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "ai.models",
      result: "success",
      details: {
        total: modelos.length,
        gratuitos: modelos.filter((m) => m.gratuito).length,
      },
    });

    return NextResponse.json({
      total: modelos.length,
      gratuitos: modelos.filter((m) => m.gratuito).length,
      modelos,
    });
  } catch (error) {
    console.error("[/api/ai/models] Erro ao buscar modelos:", error);
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro desconhecido", 500);
  }
}
