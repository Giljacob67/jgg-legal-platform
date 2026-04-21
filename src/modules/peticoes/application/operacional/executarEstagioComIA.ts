import "server-only";
import { streamText } from "ai";
import { getLLM } from "@/lib/ai/provider";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import {
  type EstagioExecutavel,
  MAPA_ESTAGIO_PIPELINE,
} from "@/modules/peticoes/domain/types";
import { SCHEMAS_POR_ESTAGIO } from "@/modules/peticoes/domain/schemas-pipeline";

/**
 * Tenta extrair e parsear JSON do texto produzido pela IA.
 * Remove blocos markdown (```json ... ```) antes de parsear.
 * Retorna null se o texto não for JSON válido.
 */
function parseJsonFromText(text: string): Record<string, unknown> | null {
  try {
    // Remove fences markdown ```json ... ``` ou ``` ... ```
    const stripped = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
    const parsed = JSON.parse(stripped);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parseia e valida o output da IA para o estágio usando o schema Zod correspondente.
 * Retorna o objeto validado, ou null se o texto não for JSON válido ou não passar no schema.
 */
function parseAIOutput(estagio: EstagioExecutavel, text: string): Record<string, unknown> | null {
  if (estagio === "minuta") return null; // prose text, sem schema estruturado

  const schema = SCHEMAS_POR_ESTAGIO[estagio as keyof typeof SCHEMAS_POR_ESTAGIO];
  if (!schema) return null;

  const parsed = parseJsonFromText(text);
  if (!parsed) return null;

  const result = schema.safeParse(parsed);
  if (result.success) return result.data as Record<string, unknown>;

  // Fallback: retornar o JSON bruto mesmo sem validação completa
  return parsed;
}

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
  await syncRuntimeAIConfig();
  try {
    model = getLLM();
  } catch {
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
    const dadosEstruturados = parseAIOutput(estagio, textoCompleto);
    const saidaEstruturada: Record<string, unknown> = dadosEstruturados
      ? { ...dadosEstruturados, textoGerado: textoCompleto, geradoPorIA: true }
      : { textoGerado: textoCompleto, geradoPorIA: true };

    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: etapaPipeline,
      entradaRef: { origem: "ia_streaming", estagio },
      saidaEstruturada,
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
