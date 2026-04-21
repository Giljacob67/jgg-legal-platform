import { NextResponse } from "next/server";
import {
  MODELOS_CATALOGADOS,
  getConfigAtual,
  isAIAvailable,
} from "@/lib/ai/provider";
import { requireRBAC } from "@/lib/api-auth";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";

/**
 * GET /api/ai/config
 * Retorna configuração atual do provedor IA e catálogo de modelos disponíveis.
 */
export async function GET() {
  const forbidden = await requireRBAC("administracao", "leitura");
  if (forbidden) return forbidden;

  await syncRuntimeAIConfig();
  const configAtual = getConfigAtual();

  const disponibilidadePorProvedor = {
    openai: Boolean(process.env.OPENAI_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    kilocode: Boolean(process.env.KILO_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    google: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    xai: Boolean(process.env.XAI_API_KEY),
    mistral: Boolean(process.env.MISTRAL_API_KEY),
    ollama: Boolean(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_KEY),
    custom: Boolean(process.env.CUSTOM_BASE_URL),
  } as const;

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
      disponivel: disponibilidadePorProvedor[m.provedor] ?? false,
    })),
    instrucoes: {
      openai: "Configure OPENAI_API_KEY no .env.local",
      openrouter: "Configure OPENROUTER_API_KEY no .env.local e AI_PROVIDER=openrouter",
      ollama: "Configure OLLAMA_BASE_URL e opcionalmente OLLAMA_API_KEY (Ollama Pro/instancia remota).",
      custom: "Configure CUSTOM_BASE_URL e opcionalmente CUSTOM_API_KEY.",
      modelo: "Configure AI_MODEL=<id-do-modelo> para escolher o modelo padrão",
    },
  });
}
