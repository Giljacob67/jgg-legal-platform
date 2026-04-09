import { NextResponse } from "next/server";
import {
  MODELOS_CATALOGADOS,
  getConfigAtual,
  isAIAvailable,
} from "@/lib/ai/provider";
import { requireAuth } from "@/lib/api-auth";

/**
 * GET /api/ai/config
 * Retorna configuração atual do provedor IA e catálogo de modelos disponíveis.
 */
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const configAtual = getConfigAtual();

  return NextResponse.json({
    disponivel: isAIAvailable(),
    configuracao: {
      provedor: configAtual.provedor,
      modeloId: configAtual.modeloId,
      modeloLabel: configAtual.modeloInfo?.label ?? configAtual.modeloId,
      provedorLabel: configAtual.modeloInfo?.provedorLabel ?? configAtual.provedor,
    },
    modelos: MODELOS_CATALOGADOS.map((m) => ({
      id: m.id,
      label: m.label,
      provedor: m.provedor,
      provedorLabel: m.provedorLabel,
      descricao: m.descricao,
      custo: m.custo,
      recomendado: m.recomendado,
      suportaVisao: m.suportaVisao,
      suportaStructuredOutput: m.suportaStructuredOutput,
      /** Se tem a chave necessária para usar este modelo */
      disponivel:
        m.provedor === "openai"
          ? Boolean(process.env.OPENAI_API_KEY)
          : m.provedor === "openrouter"
            ? Boolean(process.env.OPENROUTER_API_KEY)
            : m.provedor === "kilocode"
              ? Boolean(process.env.KILO_API_KEY)
              : m.provedor === "anthropic"
                ? Boolean(process.env.ANTHROPIC_API_KEY)
                : m.provedor === "google"
                  ? Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
                  : false,
    })),
    instrucoes: {
      openai: "Configure OPENAI_API_KEY no .env.local",
      openrouter: "Configure OPENROUTER_API_KEY no .env.local e AI_PROVIDER=openrouter",
      modelo: "Configure AI_MODEL=<id-do-modelo> para escolher o modelo padrão",
    },
  });
}
