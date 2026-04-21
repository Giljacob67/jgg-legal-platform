import "server-only";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireRBAC } from "@/lib/api-auth";
import { isAIAvailable, getLLM } from "@/lib/ai/provider";
import { streamText } from "ai";
import { retryStreamText } from "@/lib/ai/retry";
import { verificarRateLimit } from "@/lib/rate-limit";
import { getRequestId, jsonError, logApiError, logApiInfo } from "@/lib/api-response";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
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
import { buscarChunksRelevantes } from "@/modules/biblioteca-juridica/infrastructure/vectorStore";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import type { EstagioExecutavel } from "@/modules/peticoes/application/operacional/executarEstagioComIA";
import type { EtapaPipeline } from "@/modules/peticoes/domain/types";
import { responsavelObrigatorioAtendido } from "@/modules/peticoes/application/governanca-pedido";

export const maxDuration = 300;

const ESTAGIOS_VALIDOS: EstagioExecutavel[] = [
  "triagem",
  "extracao-fatos",
  "analise-adversa",
  "estrategia",
  "minuta",
];

type Pipeline = Awaited<ReturnType<typeof obterPipelineDoPedido>>;

async function buildPromptParaEstagio(
  estagio: EstagioExecutavel,
  pipeline: Pipeline,
): Promise<{ system: string; prompt: string }> {
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
      return buildExtracaoFatosPrompt(pipeline.contextoAtual, tipoPeca, materia);
    case "analise-adversa":
      return buildAnaliseAdversaPrompt(pipeline.contextoAtual, extracaoFatos, materia);
    case "estrategia": {
      const polo = (triagem.polo_representado as "ativo" | "passivo" | "indefinido" | undefined) ?? "indefinido";
      const queryEstrategia = `${materia} ${tipoPeca} ${JSON.stringify(extracaoFatos).slice(0, 200)}`;
      const chunks = await buscarChunksRelevantes(queryEstrategia, 5).catch(() => []);
      return buildEstrategiaPrompt(extracaoFatos, analiseAdversa, materia, tipoPeca, chunks, polo);
    }
    case "minuta": {
      if (!pipeline.contextoAtual) {
        throw new Error("Contexto jurídico não disponível para gerar minuta. Execute os estágios anteriores primeiro.");
      }
      const queryMinuta = `${materia} ${tipoPeca} ${pipeline.contextoAtual.fatosRelevantes.slice(0, 3).join(" ")}`;
      const chunks = await buscarChunksRelevantes(queryMinuta, 5).catch(() => []);
      return buildMinutaPrompt(pipeline.contextoAtual, estrategia, materia, tipoPeca, chunks);
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pedidoId: string; estagio: string }> },
) {
  const requestId = getRequestId(req);

  const forbidden = await requireRBAC("peticoes", "edicao");
  if (forbidden) return forbidden;

  const session = await auth();
  if (!session) {
    return jsonError(requestId, "Não autorizado", 401);
  }

  const rl = verificarRateLimit(session.user.id, "pipeline-ia", 30);
  if (!rl.permitido) {
    const resetMin = Math.ceil(rl.resetEmMs / 60000);
    return jsonError(
      requestId,
      `Limite de execuções de IA atingido. Tente novamente em ${resetMin} minuto(s).`,
      429,
      { retryAfterSec: Math.ceil(rl.resetEmMs / 1000) },
    );
  }

  if (!isAIAvailable()) {
    return jsonError(requestId, "IA não configurada. Defina OPENROUTER_API_KEY.", 503);
  }

  const { pedidoId, estagio } = await params;

  if (!ESTAGIOS_VALIDOS.includes(estagio as EstagioExecutavel)) {
    return jsonError(
      requestId,
      `Estágio inválido: ${estagio}. Válidos: ${ESTAGIOS_VALIDOS.join(", ")}`,
      400,
    );
  }

  const pedido = await obterPedidoDePeca(pedidoId);
  if (!pedido) {
    return jsonError(requestId, `Pedido ${pedidoId} não encontrado.`, 404);
  }
  if (!responsavelObrigatorioAtendido(pedido.responsavel)) {
    return jsonError(
      requestId,
      "Responsável obrigatório pendente. Defina o responsável do pedido antes de executar o pipeline.",
      422,
    );
  }

  logApiInfo("api/pipeline/executar", requestId, "execucao iniciada", {
    pedidoId,
    estagio,
    usuarioId: session.user.id,
    responsavel: pedido.responsavel,
  });

  const infra = getPeticoesOperacionalInfra();
  let modelId = process.env.AI_MODEL ?? "anthropic/claude-sonnet-4-5";

  // ── Marcar início do estágio ──────────────────────────────────
  const MAPA_ESTAGIO: Record<EstagioExecutavel, EtapaPipeline> = {
    triagem: "classificacao",
    "extracao-fatos": "extracao_de_fatos",
    "analise-adversa": "analise_adversa",
    estrategia: "estrategia_juridica",
    minuta: "redacao",
  };

  const etapaPipeline = MAPA_ESTAGIO[estagio as EstagioExecutavel];

  await infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId,
    etapa: etapaPipeline,
    entradaRef: { origem: "ia_streaming", estagio },
    saidaEstruturada: {},
    status: "em_andamento",
    tentativa: 1,
  });

  // ── Retry loop para streamText ──────────────────────────────
  let textoCompleto = "";
  let tentativaFinal = 1;

  try {
    const { textStream, textPromise, attempts } = await retryStreamText(
      async () => {
        const model = getLLM(modelId);
        const pipeline = await obterPipelineDoPedido(pedidoId);
        const { system, prompt } = await buildPromptParaEstagio(estagio as EstagioExecutavel, pipeline);

        const result = streamText({ model, system, prompt, temperature: 0.3, maxOutputTokens: 4000 });
        // Wrap AI SDK v6 StreamTextResult to match the { textStream, text } shape expected by retryStreamText
        return { textStream: result.textStream, text: result.text };
      },
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        onRetry: (attempt, err, delayMs) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(
            `[pipeline:${estagio}] tentativa ${attempt} falhou — retry em ${delayMs}ms: ${msg.slice(0, 100)}`,
          );
          // Tentar próximo modelo fallback
          const fallbackModels = ["anthropic/claude-sonnet-4-5", "gpt-4o-mini", "gpt-4o"];
          const idx = attempt - 1;
          if (idx < fallbackModels.length) {
            modelId = fallbackModels[idx];
          }
        },
      },
    );

    tentativaFinal = attempts;

    // Pipe stream → client
    const stream = new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            controller.enqueue(chunk);
          }
          textoCompleto = await textPromise;
          await infra.pipelineSnapshotRepository.salvarNovaVersao({
            pedidoId,
            etapa: etapaPipeline,
            entradaRef: { origem: "ia_streaming", estagio },
            saidaEstruturada: { textoGerado: textoCompleto, geradoPorIA: true },
            status: "concluido",
            tentativa: attempts,
          });
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro no stream";
          await infra.pipelineSnapshotRepository.salvarNovaVersao({
            pedidoId,
            etapa: etapaPipeline,
            entradaRef: { origem: "ia_streaming", estagio },
            saidaEstruturada: { textoGerado: textoCompleto },
            status: "erro",
            mensagemErro: msg,
            tentativa: attempts,
          });
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
        "X-Request-Id": requestId,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    logApiError("api/pipeline/executar", requestId, err, { pedidoId, estagio });
    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: etapaPipeline,
      entradaRef: { origem: "ia_streaming", estagio },
      saidaEstruturada: { textoGerado: textoCompleto },
      status: "erro",
      mensagemErro: msg,
      tentativa: tentativaFinal,
    });
    return jsonError(requestId, msg, 500);
  }
}
