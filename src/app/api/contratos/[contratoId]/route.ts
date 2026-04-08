import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import { obterContratoPorId, salvarAnaliseRisco, atualizarStatusContrato } from "@/modules/contratos/application";
import type { StatusContrato } from "@/modules/contratos/domain/types";
import { CLAUSULAS_PADRAO } from "@/modules/contratos/infrastructure/templatesClausulas";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";
import { requireResourceScope } from "@/lib/authz";

type Params = { params: Promise<{ contratoId: string }> };

export async function GET(request: Request, { params }: Params) {
  const authResult = await requireSessionWithPermission({ modulo: "contratos", acao: "read" });
  if (authResult.response) return authResult.response;

  const { contratoId } = await params;
  const contrato = await obterContratoPorId(contratoId);
  if (!contrato) {
    return apiError("NOT_FOUND", "Contrato não encontrado.", 404);
  }
  const scopeDenied = requireResourceScope({
    session: authResult.session,
    ownerUserId: contrato.responsavelId,
  });
  if (scopeDenied) {
    return scopeDenied;
  }

  await writeAuditLog({
    request,
    session: authResult.session,
    action: "read",
    resource: "contratos",
    resourceId: contratoId,
    result: "success",
  });

  return NextResponse.json({ contrato });
}

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireSessionWithPermission({ modulo: "contratos", acao: "write" });
  if (authResult.response) return authResult.response;

  const { contratoId } = await params;
  try {
    const atual = await obterContratoPorId(contratoId);
    if (!atual) {
      return apiError("NOT_FOUND", "Contrato não encontrado.", 404);
    }
    const scopeDenied = requireResourceScope({
      session: authResult.session,
      ownerUserId: atual.responsavelId,
    });
    if (scopeDenied) {
      return scopeDenied;
    }

    const body = (await request.json()) as { status?: StatusContrato };
    if (!body.status) {
      return apiError("VALIDATION_ERROR", "Campo 'status' obrigatório.", 400);
    }

    const contrato = await atualizarStatusContrato(contratoId, body.status);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "update",
      resource: "contratos",
      resourceId: contratoId,
      result: "success",
      details: { status: body.status },
    });

    return NextResponse.json({ contrato });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao atualizar contrato.", 500);
  }
}

const AnaliseSchema = z.object({
  pontuacaoRisco: z.number().min(0).max(100),
  nivel: z.enum(["baixo", "moderado", "alto", "critico"]),
  clausulasRisco: z.array(z.object({
    clausulaId: z.string(),
    titulo: z.string(),
    descricaoRisco: z.string(),
    nivel: z.enum(["baixo", "medio", "alto"]),
  })),
  clausulasAusentes: z.array(z.string()),
  recomendacoes: z.array(z.string()),
});

export async function POST(request: Request, { params }: Params) {
  const authResult = await requireSessionWithPermission({ modulo: "contratos", acao: "execute" });
  if (authResult.response) return authResult.response;

  const { contratoId } = await params;
  const body = (await request.json()) as { acao?: string };

  if (body.acao !== "analisar-risco") {
    return apiError("VALIDATION_ERROR", "Ação desconhecida. Use { acao: 'analisar-risco' }.", 400);
  }

  const contrato = await obterContratoPorId(contratoId);
  if (!contrato) {
    return apiError("NOT_FOUND", "Contrato não encontrado.", 404);
  }
  const scopeDenied = requireResourceScope({
    session: authResult.session,
    ownerUserId: contrato.responsavelId,
  });
  if (scopeDenied) {
    return scopeDenied;
  }

  if (!isAIAvailable()) {
    const mockAnalise = {
      pontuacaoRisco: 35 as const,
      nivel: "moderado" as const,
      clausulasRisco: [
        {
          clausulaId: "cl-2",
          titulo: "Da Rescisão",
          descricaoRisco: "Ausência de prazo mínimo de notificação para rescisão contratual.",
          nivel: "medio" as const,
        },
      ],
      clausulasAusentes: ["Cláusula de força maior", "Mecanismo de resolução de disputas (mediação/arbitragem)"],
      recomendacoes: [
        "Incluir cláusula de força maior para cobertura de eventos imprevisíveis.",
        "Definir prazo mínimo para notificação de rescisão (recomendado: 30 dias).",
        "Considerar inserção de cláusula arbitral para agilidade na resolução de conflitos.",
      ],
      analisadoEm: new Date().toISOString(),
    };
    await salvarAnaliseRisco(contratoId, mockAnalise);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "execute",
      resource: "contratos.analise-risco",
      resourceId: contratoId,
      result: "success",
      details: { modo: "mock" },
    });

    return NextResponse.json({
      analise: mockAnalise,
      aviso: "Análise mock — configure OPENAI_API_KEY ou OPENROUTER_API_KEY para análise real.",
    });
  }

  const clausulasEsperadas = (CLAUSULAS_PADRAO[contrato.tipo] ?? [])
    .filter((c) => c.tipo === "essencial")
    .map((c) => c.titulo);

  const clausulasPresentes = contrato.clausulas.map((c) => `${c.numero}. ${c.titulo}: ${c.conteudo.slice(0, 200)}`).join("\n");

  const prompt = `Você é um advogado especialista em análise contratual brasileira. Retorne SEMPRE uma resposta em JSON válido conforme o schema fornecido.

CONTRATO: "${contrato.titulo}" (${contrato.tipo})
PARTES: ${contrato.partes.map((p) => `${p.papel}: ${p.nome}`).join(" | ")}
OBJETO: ${contrato.objeto}

CLÁUSULAS PRESENTES:
${clausulasPresentes}

CLÁUSULAS ESSENCIAIS ESPERADAS PARA ESTE TIPO DE CONTRATO:
${clausulasEsperadas.join(", ")}

Analise o contrato e:
1. Pontue o risco geral de 0 (baixo) a 100 (crítico)
2. Identifique cláusulas com redação problemática ou que criam risco para a parte contratante
3. Liste cláusulas essenciais que estão ausentes
4. Forneça recomendações práticas de melhoria

Foque em: cláusulas leoninas, lacunas jurídicas, ausência de garantias, ambiguidade, violações à legislação brasileira.`;

  try {
    const { object: analise } = await generateObject({
      model: getLLM(),
      schema: AnaliseSchema,
      prompt,
    });

    const analiseCompleta = { ...analise, analisadoEm: new Date().toISOString() };
    await salvarAnaliseRisco(contratoId, analiseCompleta);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "execute",
      resource: "contratos.analise-risco",
      resourceId: contratoId,
      result: "success",
      details: { modo: "ia" },
    });

    return NextResponse.json({ analise: analiseCompleta });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar IA para análise de risco.";

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "execute",
      resource: "contratos.analise-risco",
      resourceId: contratoId,
      result: "error",
      details: { error: msg },
    });

    return apiError("INTERNAL_ERROR", msg, 502);
  }
}
