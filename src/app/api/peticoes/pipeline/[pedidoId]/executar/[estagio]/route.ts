import "server-only";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireRBAC } from "@/lib/api-auth";
import { resolverPerfilUsuario } from "@/modules/administracao/domain/types";
import { isAIAvailable, getLLM } from "@/lib/ai/provider";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";
import { streamText } from "ai";
import { retryStreamText } from "@/lib/ai/retry";
import { verificarRateLimit } from "@/lib/rate-limit";
import { getRequestId, jsonError } from "@/lib/api-response";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { atualizarFluxoPedido } from "@/modules/peticoes/application/atualizarFluxoPedido";
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
import type { EtapaPipeline, StatusPedido } from "@/modules/peticoes/domain/types";
import { responsavelObrigatorioAtendido } from "@/modules/peticoes/application/governanca-pedido";
import { perfilTemAlcadaExecucaoEstagio } from "@/modules/peticoes/domain/aprovacao";
import {
  classificarFalhaPipeline,
  existeExecucaoEmAndamentoRecente,
} from "@/modules/peticoes/application/operacional/confiabilidade-pipeline";
import {
  criarEntradaRefAuditavel,
  registrarEventoPipeline,
  registrarFalhaPipeline,
} from "@/modules/peticoes/application/operacional/observabilidade-pipeline";

export const maxDuration = 300;

const ESTAGIOS_VALIDOS: EstagioExecutavel[] = [
  "triagem",
  "extracao-fatos",
  "analise-adversa",
  "estrategia",
  "minuta",
];

const MAPA_ESTAGIO_PIPELINE: Record<EstagioExecutavel, EtapaPipeline> = {
  triagem: "classificacao",
  "extracao-fatos": "extracao_de_fatos",
  "analise-adversa": "analise_adversa",
  estrategia: "estrategia_juridica",
  minuta: "redacao",
};

function estadoDuranteExecucao(estagio: EstagioExecutavel): { status: StatusPedido; etapaAtual: EtapaPipeline } {
  if (estagio === "triagem") {
    return { status: "em triagem", etapaAtual: "classificacao" };
  }

  return {
    status: "em produção",
    etapaAtual: MAPA_ESTAGIO_PIPELINE[estagio],
  };
}

function estadoAposConclusao(estagio: EstagioExecutavel): { status: StatusPedido; etapaAtual: EtapaPipeline } {
  switch (estagio) {
    case "triagem":
      return { status: "em produção", etapaAtual: "extracao_de_fatos" };
    case "extracao-fatos":
      return { status: "em produção", etapaAtual: "analise_adversa" };
    case "analise-adversa":
      return { status: "em produção", etapaAtual: "estrategia_juridica" };
    case "estrategia":
      return { status: "em produção", etapaAtual: "redacao" };
    case "minuta":
      return { status: "em revisão", etapaAtual: "revisao" };
  }
}

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

  const forbidden = await requireRBAC("peticoes", "leitura");
  if (forbidden) return forbidden;

  const session = await auth();
  if (!session) {
    registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_bloqueada_nao_autenticado");
    return jsonError(requestId, "Não autorizado", 401);
  }

  const perfilUsuario = resolverPerfilUsuario(session.user.role as string | undefined);
  const contextoAuditoria = {
    requestId,
    usuarioId: session.user.id,
    perfilUsuario,
  };
  const { pedidoId, estagio } = await params;

  registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_solicitada", {
    pedidoId,
    estagioSolicitado: estagio,
    ...contextoAuditoria,
  });

  if (!ESTAGIOS_VALIDOS.includes(estagio as EstagioExecutavel)) {
    registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_bloqueada_estagio_invalido", {
      pedidoId,
      estagioSolicitado: estagio,
      ...contextoAuditoria,
    });
    return jsonError(
      requestId,
      `Estágio inválido: ${estagio}. Válidos: ${ESTAGIOS_VALIDOS.join(", ")}`,
      400,
      { codigoErro: "ESTAGIO_INVALIDO", reprocessavel: false },
    );
  }

  const estagioExecutavel = estagio as EstagioExecutavel;
  const etapaPipeline = MAPA_ESTAGIO_PIPELINE[estagioExecutavel];

  if (!perfilTemAlcadaExecucaoEstagio(perfilUsuario, estagioExecutavel)) {
    registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_bloqueada_alcada", {
      pedidoId,
      estagio: estagioExecutavel,
      ...contextoAuditoria,
    });
    return jsonError(
      requestId,
      "Seu perfil não possui alçada para executar este estágio do pipeline.",
      403,
      { codigoErro: "SEM_ALCADA_EXECUCAO", reprocessavel: false },
    );
  }

  const infra = getPeticoesOperacionalInfra();
  const ultimoSnapshotDaEtapa = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
    pedidoId,
    etapaPipeline,
  );
  if (ultimoSnapshotDaEtapa && existeExecucaoEmAndamentoRecente(ultimoSnapshotDaEtapa)) {
    registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_bloqueada_andamento_recente", {
      pedidoId,
      estagio: estagioExecutavel,
      ultimaVersao: ultimoSnapshotDaEtapa?.versao,
      ultimoExecutadoEm: ultimoSnapshotDaEtapa?.executadoEm,
      ...contextoAuditoria,
    });
    return jsonError(
      requestId,
      "Já existe uma execução em andamento para esta etapa. Aguarde a conclusão antes de reprocessar.",
      409,
      {
        codigoErro: "PIPELINE_EXECUCAO_EM_ANDAMENTO",
        reprocessavel: false,
        ultimaVersao: ultimoSnapshotDaEtapa.versao,
        ultimoExecutadoEm: ultimoSnapshotDaEtapa.executadoEm,
      },
    );
  }

  const rl = verificarRateLimit(session.user.id, "pipeline-ia", 30);
  if (!rl.permitido) {
    const resetMin = Math.ceil(rl.resetEmMs / 60000);
    registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_bloqueada_rate_limit", {
      pedidoId,
      estagio: estagioExecutavel,
      retryAfterSec: Math.ceil(rl.resetEmMs / 1000),
      ...contextoAuditoria,
    });
    return jsonError(
      requestId,
      `Limite de execuções de IA atingido. Tente novamente em ${resetMin} minuto(s).`,
      429,
      {
        codigoErro: "RATE_LIMIT_PIPELINE_IA",
        retryAfterSec: Math.ceil(rl.resetEmMs / 1000),
        reprocessavel: true,
      },
    );
  }

  await syncRuntimeAIConfig();
  if (!isAIAvailable()) {
    registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_bloqueada_ia_indisponivel", {
      pedidoId,
      estagio: estagioExecutavel,
      ...contextoAuditoria,
    });
    return jsonError(requestId, "IA não configurada. Defina OPENROUTER_API_KEY.", 503, {
      codigoErro: "IA_NAO_CONFIGURADA",
      reprocessavel: false,
    });
  }

  const pedido = await obterPedidoDePeca(pedidoId);
  if (!pedido) {
    registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_bloqueada_pedido_nao_encontrado", {
      pedidoId,
      estagio: estagioExecutavel,
      ...contextoAuditoria,
    });
    return jsonError(requestId, `Pedido ${pedidoId} não encontrado.`, 404, {
      codigoErro: "PEDIDO_NAO_ENCONTRADO",
      reprocessavel: false,
    });
  }
  if (!responsavelObrigatorioAtendido(pedido.responsavel)) {
    registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_bloqueada_sem_responsavel", {
      pedidoId,
      estagio: estagioExecutavel,
      responsavel: pedido.responsavel,
      ...contextoAuditoria,
    });
    return jsonError(
      requestId,
      "Responsável obrigatório pendente. Defina o responsável do pedido antes de executar o pipeline.",
      422,
      { codigoErro: "RESPONSAVEL_OBRIGATORIO_PENDENTE", reprocessavel: false },
    );
  }

  registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_iniciada", {
    pedidoId,
    estagio: estagioExecutavel,
    responsavel: pedido.responsavel,
    ...contextoAuditoria,
  });

  let modelId = process.env.AI_MODEL ?? "anthropic/claude-sonnet-4-5";

  await atualizarFluxoPedido(pedidoId, estadoDuranteExecucao(estagioExecutavel));

  await infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId,
    etapa: etapaPipeline,
    entradaRef: criarEntradaRefAuditavel(
      { origem: "ia_streaming", estagio: estagioExecutavel, fase: "inicio" },
      contextoAuditoria,
    ),
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
        const { system, prompt } = await buildPromptParaEstagio(estagioExecutavel, pipeline);

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
          registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_retry", {
            pedidoId,
            estagio: estagioExecutavel,
            tentativa: attempt,
            delayMs,
            erroResumo: msg.slice(0, 120),
            ...contextoAuditoria,
          });
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
            entradaRef: criarEntradaRefAuditavel(
              { origem: "ia_streaming", estagio: estagioExecutavel, fase: "conclusao" },
              contextoAuditoria,
            ),
            saidaEstruturada: { textoGerado: textoCompleto, geradoPorIA: true },
            status: "concluido",
            tentativa: attempts,
          });
          await atualizarFluxoPedido(pedidoId, estadoAposConclusao(estagioExecutavel));
          registrarEventoPipeline("api/pipeline/executar", requestId, "execucao_concluida", {
            pedidoId,
            estagio: estagioExecutavel,
            tentativa: attempts,
            tamanhoTexto: textoCompleto.length,
            ...contextoAuditoria,
          });
          controller.close();
        } catch (err) {
          const falha = classificarFalhaPipeline(err);
          await infra.pipelineSnapshotRepository.salvarNovaVersao({
            pedidoId,
            etapa: etapaPipeline,
            entradaRef: criarEntradaRefAuditavel(
              { origem: "ia_streaming", estagio: estagioExecutavel, fase: "erro_stream" },
              contextoAuditoria,
            ),
            saidaEstruturada: { textoGerado: textoCompleto },
            status: "erro",
            codigoErro: falha.codigoErro,
            mensagemErro: falha.mensagemTecnica,
            tentativa: attempts,
          });
          registrarFalhaPipeline(
            "api/pipeline/executar",
            requestId,
            "execucao_falha_stream",
            err,
            {
              pedidoId,
              estagio: estagioExecutavel,
              tentativa: attempts,
              ...contextoAuditoria,
            },
          );
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
    const falha = classificarFalhaPipeline(err);
    registrarFalhaPipeline("api/pipeline/executar", requestId, "execucao_falha", err, {
      pedidoId,
      estagio: estagioExecutavel,
      codigoErro: falha.codigoErro,
      ...contextoAuditoria,
    });
    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: etapaPipeline,
      entradaRef: criarEntradaRefAuditavel(
        { origem: "ia_streaming", estagio: estagioExecutavel, fase: "erro" },
        contextoAuditoria,
      ),
      saidaEstruturada: { textoGerado: textoCompleto },
      status: "erro",
      codigoErro: falha.codigoErro,
      mensagemErro: falha.mensagemTecnica,
      tentativa: tentativaFinal,
    });
    return jsonError(requestId, falha.mensagemOperacional, falha.statusHttp, {
      codigoErro: falha.codigoErro,
      reprocessavel: falha.reprocessavel,
    });
  }
}
