import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getLLM, isAIAvailable } from "@/lib/ai/provider";
import {
  obterContratoPorId,
  salvarAnaliseRisco,
  atualizarStatusContrato,
  atualizarConteudoEClausulas,
} from "@/modules/contratos/application";
import type { StatusContrato, Clausula } from "@/modules/contratos/domain/types";
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

// ─── PATCH: atualizar status ou cláusulas ────────────────────

export async function PATCH(request: Request, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { contratoId } = await params;
  try {
    const body = (await request.json()) as {
      status?: StatusContrato;
      clausulas?: Clausula[];
      conteudoAtual?: string;
    };

    if (body.status) {
      const contrato = await atualizarStatusContrato(contratoId, body.status);
      return NextResponse.json({ contrato });
    }

    if (body.clausulas !== undefined || body.conteudoAtual !== undefined) {
      const current = await obterContratoPorId(contratoId);
      if (!current) return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
      const contrato = await atualizarConteudoEClausulas(
        contratoId,
        body.clausulas ?? current.clausulas,
        body.conteudoAtual ?? current.conteudoAtual,
      );
      return NextResponse.json({ contrato });
    }

    return NextResponse.json({ error: "Nenhum campo editável fornecido." }, { status: 400 });
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

  if (body.acao !== "analisar-risco" && body.acao !== "gerar-minuta") {
    return NextResponse.json({ error: "Ação desconhecida. Use { acao: 'analisar-risco' } ou { acao: 'gerar-minuta' }." }, { status: 400 });
  }

  // ── Gerar minuta com IA ─────────────────────────────────────
  if (body.acao === "gerar-minuta") {
    const contrato = await obterContratoPorId(contratoId);
    if (!contrato) return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });

    if (!isAIAvailable()) {
      const templateClausulas = (CLAUSULAS_PADRAO[contrato.tipo] ?? CLAUSULAS_PADRAO["outro"]).map((c, i) => ({
        id: `cl-gen-${i + 1}`,
        numero: i + 1,
        titulo: c.titulo,
        conteudo: c.conteudo,
        tipo: c.tipo,
      }));
      const conteudoMock = `${contrato.titulo.toUpperCase()}\n\n${templateClausulas.map((c) => `${c.numero}. ${c.titulo.toUpperCase()}\n\n${c.conteudo}`).join("\n\n")}`;
      const updated = await atualizarConteudoEClausulas(contratoId, templateClausulas, conteudoMock);
      return NextResponse.json({ contrato: updated, aviso: "Minuta mock — configure chave de IA para geração real." });
    }

    const MinutaSchema = z.object({
      clausulas: z.array(z.object({
        id: z.string(),
        numero: z.number(),
        titulo: z.string(),
        conteudo: z.string(),
        tipo: z.enum(["essencial", "negociavel", "opcional", "proibida"]),
      })),
      conteudoAtual: z.string(),
    });

    const partesStr = contrato.partes.map((p) => `${p.papel}: ${p.nome}${p.cpfCnpj ? ` (${p.cpfCnpj})` : ""}${p.qualificacao ? `, ${p.qualificacao}` : ""}`).join("; ");

    const prompt = `Você é um advogado especialista em direito contratual brasileiro. Redija uma minuta completa de ${contrato.titulo}.

TIPO: ${contrato.tipo}
OBJETO: ${contrato.objeto}
PARTES: ${partesStr}
${contrato.valorReais ? `VALOR: R$ ${(contrato.valorReais / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
${contrato.vigenciaInicio ? `VIGÊNCIA: ${contrato.vigenciaInicio}${contrato.vigenciaFim ? ` a ${contrato.vigenciaFim}` : ""}` : ""}

Gere:
1. Um array de cláusulas estruturadas (id único, numero sequencial, titulo, conteudo completo em português jurídico, tipo entre essencial/negociavel/opcional/proibida)
2. O conteudoAtual com todo o texto corrido do contrato em formato formal brasileiro

Use linguagem jurídica formal. Inclua todas as cláusulas essenciais para o tipo de contrato. O conteudo de cada cláusula deve ter no mínimo 2 parágrafos completos.`;

    try {
      const { object } = await generateObject({ model: getLLM(), schema: MinutaSchema, prompt });
      const updated = await atualizarConteudoEClausulas(contratoId, object.clausulas, object.conteudoAtual);
      return NextResponse.json({ contrato: updated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar minuta com IA.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
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
    return NextResponse.json({ analise: analiseCompleta });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar IA para análise de risco.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
