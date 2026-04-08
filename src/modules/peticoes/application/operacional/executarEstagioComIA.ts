import "server-only";
import { streamText } from "ai";
import { getAIProvider, getDefaultModelId } from "@/lib/ai/client";
import { validateStageOutput } from "@/lib/ai/stage-output-validation";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import {
  type EstagioExecutavel,
  MAPA_ESTAGIO_PIPELINE,
} from "@/modules/peticoes/domain/types";

export type { EstagioExecutavel };
export { MAPA_ESTAGIO_PIPELINE };

export async function executarEstagioComIA(
  pedidoId: string,
  estagio: EstagioExecutavel,
  buildPromptFn: (pipeline: Awaited<ReturnType<typeof obterPipelineDoPedido>>) =>
    | { system: string; prompt: string }
    | Promise<{ system: string; prompt: string }>,
  options?: {
    ragDegraded?: boolean;
    onFinalized?: (result: {
      status: "completed" | "failed";
      schemaValid: boolean;
      ragDegraded: boolean;
      errorMessage?: string;
    }) => Promise<void> | void;
  },
): Promise<ReadableStream<string>> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error("AI não configurada. Defina OPENROUTER_API_KEY no ambiente.");
  }

  const pipeline = await obterPipelineDoPedido(pedidoId);
  const { system, prompt } = await buildPromptFn(pipeline);
  const etapaPipeline = MAPA_ESTAGIO_PIPELINE[estagio];
  const infra = getPeticoesOperacionalInfra();

  // Marcar estágio como em andamento
  await infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId,
    etapa: etapaPipeline,
    entradaRef: { origem: "ia_streaming", estagio, ragDegraded: options?.ragDegraded ?? false },
    saidaEstruturada: {},
    status: "em_andamento",
    tentativa: 1,
  });

  const { textStream, text: textPromise } = await streamText({
    model: provider(getDefaultModelId()),
    system,
    prompt,
    temperature: 0.3,
    maxOutputTokens: 4000,
  });

  const onComplete = async (textoCompleto: string) => {
    const validation = validateStageOutput(estagio, textoCompleto);
    const status = validation.schemaValid ? "concluido" : "erro";

    // NOTE: Using salvarNovaVersao directly (not sincronizarPipelinePedido)
    // because sincronizarPipelinePedido is a full orchestrator that reprocesses
    // ALL documents — not appropriate for persisting a single AI stage output.
    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: etapaPipeline,
      entradaRef: { origem: "ia_streaming", estagio, ragDegraded: options?.ragDegraded ?? false },
      saidaEstruturada: {
        textoGerado: textoCompleto,
        geradoPorIA: true,
        schemaValid: validation.schemaValid,
        ragDegraded: options?.ragDegraded ?? false,
        output: validation.structured,
        validationError: validation.validationError,
      },
      status,
      codigoErro: validation.schemaValid ? undefined : "SCHEMA_VALIDATION_FAILED",
      mensagemErro: validation.validationError,
      tentativa: 1,
    });

    await options?.onFinalized?.({
      status: validation.schemaValid ? "completed" : "failed",
      schemaValid: validation.schemaValid,
      ragDegraded: options?.ragDegraded ?? false,
      errorMessage: validation.validationError,
    });

    return validation;
  };

  // Converter AsyncIterable para ReadableStream
  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          controller.enqueue(chunk);
        }
        const textoCompleto = await textPromise;
        const validation = await onComplete(textoCompleto);
        if (!validation.schemaValid) {
          controller.enqueue(
            `\n\n[VALIDACAO_DE_SCHEMA_FALHOU] ${validation.validationError ?? "Saída não aderente ao contrato esperado."}`,
          );
        }
        controller.close();
      } catch (err) {
        try {
          await infra.pipelineSnapshotRepository.salvarNovaVersao({
            pedidoId,
            etapa: etapaPipeline,
            entradaRef: { origem: "ia_streaming", estagio, ragDegraded: options?.ragDegraded ?? false },
            saidaEstruturada: {},
            status: "erro",
            mensagemErro: err instanceof Error ? err.message : "Erro desconhecido",
            tentativa: 1,
          });
          await options?.onFinalized?.({
            status: "failed",
            schemaValid: false,
            ragDegraded: options?.ragDegraded ?? false,
            errorMessage: err instanceof Error ? err.message : "Erro desconhecido",
          });
        } finally {
          controller.enqueue(
            `\n\n[ERRO_DE_EXECUCAO] ${err instanceof Error ? err.message : "Erro desconhecido durante streaming."}`,
          );
          controller.close();
        }
      }
    },
  });

  return stream;
}
