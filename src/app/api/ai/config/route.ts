import { NextResponse } from "next/server";
import {
  MODELOS_CATALOGADOS,
  getConfigAtual,
  isAIAvailable,
} from "@/lib/ai/provider";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const configAtual = getConfigAtual();

    const payload = {
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
        disponivel:
          m.provedor === "openai"
            ? Boolean(process.env.OPENAI_API_KEY)
            : Boolean(process.env.OPENROUTER_API_KEY),
      })),
      instrucoes: {
        openai: "Configure OPENAI_API_KEY no .env.local",
        openrouter: "Configure OPENROUTER_API_KEY no .env.local e AI_PROVIDER=openrouter",
        modelo: "Configure AI_MODEL=<id-do-modelo> para escolher o modelo padrão",
      },
    };

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "ai.config",
      result: "success",
      details: {
        provider: payload.configuracao.provedor,
        model: payload.configuracao.modeloId,
      },
    });

    return NextResponse.json(payload);
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao obter configuração de IA.", 500);
  }
}
