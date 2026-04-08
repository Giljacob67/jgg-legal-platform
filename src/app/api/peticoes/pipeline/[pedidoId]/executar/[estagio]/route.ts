import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { isAIAvailable } from "@/lib/ai/client";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
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
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { buscarChunksRelevantes } from "@/modules/biblioteca-conhecimento/infrastructure/vectorStore";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  acquireExecutionControl,
  finalizeExecutionControl,
  hashEntrada,
} from "@/lib/security/execution-control";
import { writeAuditLog } from "@/lib/security/audit-log";
import { requireResourceScope } from "@/lib/authz";
import { services } from "@/services/container";

export const maxDuration = 300; // Vercel Pro: até 300s para streaming

const ESTAGIOS_VALIDOS: EstagioExecutavel[] = [
  "triagem",
  "extracao-fatos",
  "analise-adversa",
  "estrategia",
  "minuta",
];

type Pipeline = Awaited<ReturnType<typeof obterPipelineDoPedido>>;

async function buscarChunksComDegradacao(query: string, limit: number): Promise<{
  chunks: Awaited<ReturnType<typeof buscarChunksRelevantes>>;
  ragDegraded: boolean;
}> {
  try {
    const chunks = await buscarChunksRelevantes(query, limit);
    return { chunks, ragDegraded: false };
  } catch {
    return { chunks: [], ragDegraded: true };
  }
}

async function buildPromptParaEstagio(
  estagio: EstagioExecutavel,
  pipeline: Pipeline,
): Promise<{ system: string; prompt: string; ragDegraded: boolean }> {
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
      return { ...buildTriagemPrompt(pipeline.snapshots), ragDegraded: false };
    case "extracao-fatos":
      return { ...buildExtracaoFatosPrompt(pipeline.contextoAtual, tipoPeca, materia), ragDegraded: false };
    case "analise-adversa":
      return { ...buildAnaliseAdversaPrompt(pipeline.contextoAtual, extracaoFatos, materia), ragDegraded: false };
    case "estrategia": {
      const polo = (triagem.polo_representado as "ativo" | "passivo" | "indefinido" | undefined) ?? "indefinido";
      const queryEstrategia = `${materia} ${tipoPeca} ${JSON.stringify(extracaoFatos).slice(0, 200)}`;
      const { chunks, ragDegraded } = await buscarChunksComDegradacao(queryEstrategia, 5);
      return {
        ...buildEstrategiaPrompt(extracaoFatos, analiseAdversa, materia, tipoPeca, chunks, polo),
        ragDegraded,
      };
    }
    case "minuta": {
      if (!pipeline.contextoAtual) {
        throw new Error("Contexto jurídico não disponível para gerar minuta. Execute os estágios anteriores primeiro.");
      }
      const queryMinuta = `${materia} ${tipoPeca} ${pipeline.contextoAtual.fatosRelevantes.slice(0, 3).join(" ")}`;
      const { chunks, ragDegraded } = await buscarChunksComDegradacao(queryMinuta, 5);
      return {
        ...buildMinutaPrompt(pipeline.contextoAtual, estrategia, materia, tipoPeca, chunks),
        ragDegraded,
      };
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pedidoId: string; estagio: string }> },
) {
  const authResult = await requireSessionWithPermission({ modulo: "peticoes", acao: "execute" });
  if (authResult.response) return authResult.response;
  const { session } = authResult;

  const rate = await checkRateLimit({
    key: `peticoes:executar:${session.user.id}`,
    limit: Number(process.env.AI_STAGE_RATE_LIMIT_PER_MINUTE ?? 8),
    windowSeconds: 60,
  });
  if (!rate.allowed) {
    const response = apiError("RATE_LIMITED", "Limite de execuções por minuto excedido.", 429, {
      limit: rate.limit,
      current: rate.count,
    });
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  if (!isAIAvailable()) {
    return apiError("INTERNAL_ERROR", "IA não configurada. Defina OPENROUTER_API_KEY.", 503);
  }

  const { pedidoId, estagio } = await params;

  if (!ESTAGIOS_VALIDOS.includes(estagio as EstagioExecutavel)) {
    return apiError(
      "VALIDATION_ERROR",
      `Estágio inválido: ${estagio}. Válidos: ${ESTAGIOS_VALIDOS.join(", ")}`,
      400,
    );
  }

  let controlId: string | null = null;

  try {
    const pedido = await services.peticoesRepository.obterPedidoPorId(pedidoId);
    if (!pedido) {
      return apiError("NOT_FOUND", `Pedido ${pedidoId} não encontrado.`, 404);
    }

    const scopeDenied = requireResourceScope({
      session,
      ownerName: pedido.responsavel ?? null,
    });
    if (scopeDenied) {
      await writeAuditLog({
        request: req,
        session,
        action: "execute",
        resource: "peticoes.pipeline.estagio",
        resourceId: `${pedidoId}:${estagio}`,
        result: "denied",
      });
      return scopeDenied;
    }

    const pipeline = await obterPipelineDoPedido(pedidoId);
    const preparedPrompt = await buildPromptParaEstagio(estagio as EstagioExecutavel, pipeline);
    const entradaHash = hashEntrada({
      pedidoId,
      estagio,
      snapshotRefs: pipeline.snapshots.map((snapshot) => `${snapshot.etapa}:${snapshot.versao}`),
      system: preparedPrompt.system,
      prompt: preparedPrompt.prompt,
    });

    const control = await acquireExecutionControl({
      pedidoId,
      estagio,
      userId: session.user.id,
      inputHash: entradaHash,
    });
    if (!control.ok) {
      return apiError("CONFLICT", control.message, 409, { reason: control.reason });
    }
    controlId = control.controlId;

    Sentry.setUser({ id: session.user.id, email: session.user.email ?? undefined });
    Sentry.setContext("pipeline_execution", {
      pedidoId,
      estagio,
      ragDegraded: preparedPrompt.ragDegraded,
    });

    await writeAuditLog({
      request: req,
      session,
      action: "execute",
      resource: "peticoes.pipeline.estagio",
      resourceId: `${pedidoId}:${estagio}`,
      result: "success",
      details: { started: true, ragDegraded: preparedPrompt.ragDegraded },
    });

    const stream = await executarEstagioComIA(
      pedidoId,
      estagio as EstagioExecutavel,
      async () => ({ system: preparedPrompt.system, prompt: preparedPrompt.prompt }),
      {
        ragDegraded: preparedPrompt.ragDegraded,
        onFinalized: async (result) => {
          if (controlId) {
            await finalizeExecutionControl({
              controlId,
              pedidoId,
              estagio,
              inputHash: entradaHash,
              status: result.status,
              schemaValid: result.schemaValid,
              ragDegraded: result.ragDegraded,
              errorMessage: result.errorMessage,
            });
          }

          await writeAuditLog({
            request: req,
            session,
            action: "execute",
            resource: "peticoes.pipeline.estagio",
            resourceId: `${pedidoId}:${estagio}`,
            result: result.status === "completed" ? "success" : "error",
            details: {
              schemaValid: result.schemaValid,
              ragDegraded: result.ragDegraded,
              errorMessage: result.errorMessage,
            },
          });
        },
      },
    );

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
        "X-Rag-Degraded": preparedPrompt.ragDegraded ? "1" : "0",
        "X-Schema-Validation": "deferred",
      },
    });
    return response;
  } catch (err) {
    if (controlId) {
      await finalizeExecutionControl({
        controlId,
        pedidoId,
        estagio,
        inputHash: "",
        status: "failed",
        schemaValid: false,
        errorMessage: err instanceof Error ? err.message : "Erro interno",
      });
    }
    await writeAuditLog({
      request: req,
      session,
      action: "execute",
      resource: "peticoes.pipeline.estagio",
      resourceId: `${pedidoId}:${estagio}`,
      result: "error",
      details: { error: err instanceof Error ? err.message : "Erro interno" },
    });
    Sentry.captureException(err, {
      tags: { route: "peticoes.pipeline.executar", estagio },
      extra: { pedidoId },
    });
    const message = err instanceof Error ? err.message : "Erro interno";
    return apiError("INTERNAL_ERROR", message, 500);
  }
}
