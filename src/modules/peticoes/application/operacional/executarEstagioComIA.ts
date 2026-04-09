import "server-only";
import { streamText } from "ai";
import { getLLM } from "@/lib/ai/provider";
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
): Promise<ReadableStream<string>> {
  let model;
  try {
    model = getLLM();
  } catch (err) {
    throw new Error(
      `AI não configurada. Verifique OPENAI_API_KEY, OPENROUTER_API_KEY ou ANTHROPIC_API_KEY.`,
    );
  }

  const pipeline = await obterPipelineDoPedido(pedidoId);
  const { system, prompt } = await buildPromptFn(pipeline);
  const etapaPipeline = MAPA_ESTAGIO_PIPELINE[estagio];
  const infra = getPeticoesOperacionalInfra();

  // Marcar estágio como em andamento
  await infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId,
    etapa: etapaPipeline,
    entradaRef: { origem: "ia_streaming", estagio },
    saidaEstruturada: {},
    status: "em_andamento",
    tentativa: 1,
  });

  const { textStream, text: textPromise } = await streamText({
    model,
    system,
    prompt,
    temperature: 0.3,
    maxOutputTokens: 4000,
  });

  const onComplete = async (textoCompleto: string) => {
    // NOTE: Using salvarNovaVersao directly (not sincronizarPipelinePedido)
    // because sincronizarPipelinePedido is a full orchestrator that reprocesses
    // ALL documents — not appropriate for persisting a single AI stage output.
    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: etapaPipeline,
      entradaRef: { origem: "ia_streaming", estagio },
      saidaEstruturada: { textoGerado: textoCompleto, geradoPorIA: true },
      status: "concluido",
      tentativa: 1,
    });
  };

  // Converter AsyncIterable para ReadableStream
  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          controller.enqueue(chunk);
        }
        const textoCompleto = await textPromise;
        await onComplete(textoCompleto);
        controller.close();
      } catch (err) {
        try {
          await infra.pipelineSnapshotRepository.salvarNovaVersao({
            pedidoId,
            etapa: etapaPipeline,
            entradaRef: { origem: "ia_streaming", estagio },
            saidaEstruturada: {},
            status: "erro",
            mensagemErro: err instanceof Error ? err.message : "Erro desconhecido",
            tentativa: 1,
          });
        } finally {
          controller.error(err);
        }
      }
    },
  });

  return stream;
}
