import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAIAvailable } from "@/lib/ai/client";
import {
  executarEstagioComIA,
  type EstagioExecutavel,
} from "@/modules/peticoes/application/operacional/executarEstagioComIA";
import {
  buildTriagemPrompt,
  buildExtracaoFatosPrompt,
  buildAnaliseAdversaPrompt,
  buildEstrategiaPrompt,
  buildMinutaPrompt,
} from "@/lib/ai/prompts";
import {
  normalizarMateriaCanonica,
  normalizarTipoPecaCanonica,
} from "@/modules/peticoes/domain/geracao-minuta";
import type { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";

export const maxDuration = 300; // Vercel Pro: até 300s para streaming

const ESTAGIOS_VALIDOS: EstagioExecutavel[] = [
  "triagem",
  "extracao-fatos",
  "analise-adversa",
  "estrategia",
  "minuta",
];

type Pipeline = Awaited<ReturnType<typeof obterPipelineDoPedido>>;

function buildPromptParaEstagio(
  estagio: EstagioExecutavel,
  pipeline: Pipeline,
): { system: string; prompt: string } {
  const triagem = (pipeline.snapshots.find((s) => s.etapa === "classificacao")?.saidaEstruturada ?? {}) as Record<string, unknown>;
  const extracaoFatos = pipeline.snapshots.find((s) => s.etapa === "extracao_de_fatos")?.saidaEstruturada ?? {};
  const analiseAdversa = pipeline.snapshots.find((s) => s.etapa === "analise_adversa")?.saidaEstruturada ?? {};
  const estrategia = pipeline.snapshots.find((s) => s.etapa === "estrategia_juridica")?.saidaEstruturada ?? {};

  const tipoPecaRaw = (triagem.tipo_peca as string | undefined) ?? "peticao_inicial";
  const materiaRaw = (triagem.materia as string | undefined) ?? "civel";
  const tipoPeca = normalizarTipoPecaCanonica(tipoPecaRaw);
  const materia = normalizarMateriaCanonica(materiaRaw);

  switch (estagio) {
    case "triagem":
      return buildTriagemPrompt(pipeline.snapshots);
    case "extracao-fatos":
      return buildExtracaoFatosPrompt(pipeline.contextoAtual, tipoPeca);
    case "analise-adversa":
      return buildAnaliseAdversaPrompt(pipeline.contextoAtual, extracaoFatos);
    case "estrategia":
      return buildEstrategiaPrompt(extracaoFatos, analiseAdversa, materia, tipoPeca);
    case "minuta": {
      if (!pipeline.contextoAtual) {
        throw new Error("Contexto jurídico não disponível para gerar minuta. Execute os estágios anteriores primeiro.");
      }
      return buildMinutaPrompt(pipeline.contextoAtual, estrategia, materia, tipoPeca);
    }
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ pedidoId: string; estagio: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isAIAvailable()) {
    return NextResponse.json(
      { error: "IA não configurada. Defina OPENROUTER_API_KEY." },
      { status: 503 },
    );
  }

  const { pedidoId, estagio } = await params;

  if (!ESTAGIOS_VALIDOS.includes(estagio as EstagioExecutavel)) {
    return NextResponse.json(
      {
        error: `Estágio inválido: ${estagio}. Válidos: ${ESTAGIOS_VALIDOS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    const stream = await executarEstagioComIA(
      pedidoId,
      estagio as EstagioExecutavel,
      (pipeline) => buildPromptParaEstagio(estagio as EstagioExecutavel, pipeline),
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
