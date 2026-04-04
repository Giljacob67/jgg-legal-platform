import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import { obterContratoPorId, salvarAnaliseRisco, atualizarStatusContrato } from "@/modules/contratos/application";
import type { StatusContrato } from "@/modules/contratos/domain/types";
import { CLAUSULAS_PADRAO } from "@/modules/contratos/infrastructure/templatesClausulas";
import { requireAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ contratoId: string }> };

// ─── GET: obter contrato ──────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { contratoId } = await params;
  const contrato = await obterContratoPorId(contratoId);
  if (!contrato) return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  return NextResponse.json({ contrato });
}

// ─── PATCH: atualizar status ──────────────────────────────────

export async function PATCH(request: Request, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { contratoId } = await params;
  try {
    const body = (await request.json()) as { status?: StatusContrato };
    if (!body.status) return NextResponse.json({ error: "Campo 'status' obrigatório." }, { status: 400 });
    const contrato = await atualizarStatusContrato(contratoId, body.status);
    return NextResponse.json({ contrato });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro." }, { status: 500 });
  }
}

// ─── POST /analisar-risco: agente IA ─────────────────────────

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
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { contratoId } = await params;
  const body = (await request.json()) as { acao?: string };

  if (body.acao !== "analisar-risco") {
    return NextResponse.json({ error: "Ação desconhecida. Use { acao: 'analisar-risco' }." }, { status: 400 });
  }

  const contrato = await obterContratoPorId(contratoId);
  if (!contrato) return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });

  // Mock sem IA
  if (!isAIAvailable()) {
    const mockAnalise = {
      pontuacaoRisco: 35 as const,
      nivel: "moderado" as const,
      clausulasRisco: [
        { clausulaId: "cl-2", titulo: "Da Rescisão", descricaoRisco: "Ausência de prazo mínimo de notificação para rescisão contratual.", nivel: "medio" as const },
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
    return NextResponse.json({ analise: mockAnalise, aviso: "Análise mock — configure OPENAI_API_KEY ou OPENROUTER_API_KEY para análise real." });
  }

  // Cláusulas esperadas para o tipo de contrato
  const clausulasEsperadas = (CLAUSULAS_PADRAO[contrato.tipo] ?? [])
    .filter((c) => c.tipo === "essencial")
    .map((c) => c.titulo);

  const clausulasPresentes = contrato.clausulas.map((c) => `${c.numero}. ${c.titulo}: ${c.conteudo.slice(0, 200)}`).join("\n");

  const prompt = `Você é um advogado especialista em análise contratual brasileira.

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

  const { object: analise } = await generateObject({
    model: getLLM(),
    schema: AnaliseSchema,
    prompt,
  });

  const analiseCompleta = { ...analise, analisadoEm: new Date().toISOString() };
  await salvarAnaliseRisco(contratoId, analiseCompleta);
  return NextResponse.json({ analise: analiseCompleta });
}
