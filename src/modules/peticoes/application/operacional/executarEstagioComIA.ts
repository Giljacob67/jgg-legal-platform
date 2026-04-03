import "server-only";
import { streamText } from "ai";
import { getAIProvider, getDefaultModelId } from "@/lib/ai/client";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import type { EtapaPipeline } from "@/modules/peticoes/domain/types";

export type EstagioExecutavel =
  | "triagem"
  | "extracao-fatos"
  | "analise-adversa"
  | "estrategia"
  | "minuta";

const MAPA_ESTAGIO_PIPELINE: Record<EstagioExecutavel, EtapaPipeline> = {
  triagem: "classificacao",
  "extracao-fatos": "extracao_de_fatos",
  "analise-adversa": "analise_adversa",
  estrategia: "estrategia_juridica",
  minuta: "redacao",
};

export interface ResultadoEstagioIA {
  stream: ReadableStream<string>;
  onComplete: (texto: string) => Promise<void>;
}

export async function executarEstagioComIA(
  pedidoId: string,
  estagio: EstagioExecutavel,
  buildPromptFn: (pipeline: Awaited<ReturnType<typeof obterPipelineDoPedido>>) => {
    system: string;
    prompt: string;
  },
): Promise<ResultadoEstagioIA> {
  const provider = getAIProvider();
  if (!provider) {
    throw new Error("AI não configurada. Defina OPENROUTER_API_KEY no ambiente.");
  }

  const pipeline = await obterPipelineDoPedido(pedidoId);
  const { system, prompt } = buildPromptFn(pipeline);
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
    model: provider(getDefaultModelId()),
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
        await infra.pipelineSnapshotRepository.salvarNovaVersao({
          pedidoId,
          etapa: etapaPipeline,
          entradaRef: { origem: "ia_streaming", estagio },
          saidaEstruturada: {},
          status: "erro",
          mensagemErro: err instanceof Error ? err.message : "Erro desconhecido",
          tentativa: 1,
        });
        controller.error(err);
      }
    },
  });

  return { stream, onComplete };
}
