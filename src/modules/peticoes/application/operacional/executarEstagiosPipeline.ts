import "server-only";

import { generateObject } from "ai";
import { z } from "zod";
import { getLLM } from "@/lib/ai/provider";
import { withRetry } from "@/lib/ai/retry";
import { buildAnaliseAdversaPrompt } from "@/lib/ai/prompts/analise-adversa";
import { buildPesquisaApoioPrompt } from "@/lib/ai/prompts/pesquisa-de-apoio";
import { buildAnaliseDocumentalClientePrompt } from "@/lib/ai/prompts/analise-documental-cliente";
import { buscarChunksRelevantes } from "@/modules/biblioteca-juridica/infrastructure/vectorStore";
import { normalizarMateriaCanonica, normalizarTipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import type { ContextoJuridicoPedido, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";
import {
  AnaliseAdversaSchema,
  PesquisaApoioSchema,
  AnaliseDocumentalClienteSchema,
  type AnaliseAdversaOutput,
  type PesquisaApoioOutput,
  type AnaliseDocumentalClienteOutput,
} from "@/modules/peticoes/domain/schemas-pipeline";
import type { DocumentoComArquivoEVinculos } from "@/modules/documentos/domain/types";

/** Resultado de um estágio executado pela IA com schema Zod */
interface ResultadoEstagio<T> {
  saida: T;
  status: "concluido" | "erro";
  erro?: string;
  tentativas?: number;
}

/** Extrai matéria, tipo de peça e fatos dos snapshots existentes do pipeline */
function extrairDadosPipeline(
  snapshots: SnapshotPipelineEtapa[],
): {
  materia: string;
  tipoPeca: string;
  extracaoFatos: Record<string, unknown>;
} {
  const triagem = snapshots.find((s) => s.etapa === "classificacao")?.saidaEstruturada ?? {};
  const materiaRaw = (triagem.materia as string | undefined) ?? "civel";
  const tipoPecaRaw = (triagem.tipo_peca as string | undefined) ?? "peticao_inicial";
  const extracaoFatos =
    snapshots.find((s) => s.etapa === "extracao_de_fatos")?.saidaEstruturada ?? {};

  return {
    materia: normalizarMateriaCanonica(materiaRaw),
    tipoPeca: normalizarTipoPecaCanonica(tipoPecaRaw),
    extracaoFatos,
  };
}

/** Modelos fallback em caso de erro — na ordem de tentativa */
const FALLBACK_MODELS = [
  "anthropic/claude-sonnet-4-5",
  "gpt-4o-mini",
  "gpt-4o",
];

/**
 * Executa um estágio de IA usando generateObject (AI SDK v6) com validação Zod.
 * Inclui retry com backoff exponencial e fallback automático entre modelos.
 */
async function executarEstagioComIA<T>(params: {
  modelId: string;
  system: string;
  prompt: string;
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>;
  estagio: string;
  pedidoId: string;
  entradaRef: Record<string, unknown>;
}): Promise<ResultadoEstagio<T>> {
  const result = await withRetry(
    async () => {
      const model = getLLM(params.modelId);
      const { object } = await generateObject({
        model,
        system: params.system,
        prompt: params.prompt,
        schema: params.schema,
        temperature: 0.3,
        maxOutputTokens: 4000,
      });
      return object as T;
    },
    {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      fallbackModels: FALLBACK_MODELS,
      onRetry: (attempt, err, delayMs) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[${params.estagio}] tentativa ${attempt} falhou para ${params.pedidoId} — retry em ${delayMs}ms: ${msg.slice(0, 120)}`,
        );
      },
    },
  );

  if (result.ok) {
    return { saida: result.data, status: "concluido", tentativas: result.attempts };
  }

  const erro = result.lastError instanceof Error
    ? result.lastError.message
    : "Erro desconhecido";
  console.error(
    `[${params.estagio}] falhou definitivamente (${result.attempts} tentativas) para ${params.pedidoId}:`,
    result.lastError,
  );
  return { saida: {} as T, status: "erro", erro, tentativas: result.attempts };
}

// ─── Estágios do Pipeline ─────────────────────────────────────────────────────

/**
 * Executa o estágio de Análise Adversarial via IA com validação Zod.
 * Anticipa os principais argumentos da parte contrária e avalia riscos processuais.
 */
export async function executarEstagioAnaliseAdversa(
  snapshots: SnapshotPipelineEtapa[],
  contexto: ContextoJuridicoPedido | null,
  pedidoId: string,
): Promise<ResultadoEstagio<AnaliseAdversaOutput>> {
  const { materia, extracaoFatos } = extrairDadosPipeline(snapshots);

  const { system, prompt } = buildAnaliseAdversaPrompt(
    contexto,
    extracaoFatos,
    materia as Parameters<typeof buildAnaliseAdversaPrompt>[2],
  );

  const modelId = process.env.AI_MODEL ?? "anthropic/claude-sonnet-4-5";

  return executarEstagioComIA<AnaliseAdversaOutput>({
    modelId,
    system,
    prompt,
    schema: AnaliseAdversaSchema,
    estagio: "analise_adversa",
    pedidoId,
    entradaRef: { materia },
  });
}

/**
 * Executa o estágio de Pesquisa de Apoio via busca vetorial na biblioteca + IA.
 * Utiliza os fatos extraídos para consultar chunks relevantes e fundamentar a petição.
 */
export async function executarEstagioPesquisaApoio(
  snapshots: SnapshotPipelineEtapa[],
  contexto: ContextoJuridicoPedido | null,
  pedidoId: string,
): Promise<ResultadoEstagio<PesquisaApoioOutput>> {
  const { materia, tipoPeca, extracaoFatos } = extrairDadosPipeline(snapshots);

  const fatosTexto = Array.isArray(extracaoFatos.fatosRelevantes)
    ? (extracaoFatos.fatosRelevantes as string[]).slice(0, 5).join(" ")
    : JSON.stringify(extracaoFatos).slice(0, 500);

  const query = `${materia} ${tipoPeca} ${fatosTexto}`;
  const chunks = await buscarChunksRelevantes(query, 8).catch(() => []);

  if (chunks.length === 0) {
    console.warn("[PesquisaApoio] Vector store não retornou chunks — continuando sem apoio.");
  }

  const { system, prompt } = buildPesquisaApoioPrompt(
    contexto,
    materia as Parameters<typeof buildPesquisaApoioPrompt>[1],
    chunks.map((c) => c.conteudo),
  );

  const modelId = process.env.AI_MODEL ?? "anthropic/claude-sonnet-4-5";

  return executarEstagioComIA<PesquisaApoioOutput>({
    modelId,
    system,
    prompt,
    schema: PesquisaApoioSchema,
    estagio: "pesquisa_de_apoio",
    pedidoId,
    entradaRef: { query, chunksEncontrados: chunks.length },
  });
}

/**
 * Executa o estágio de Análise Documental do Cliente via IA com validação Zod.
 * Avalia os documentos uploadados pelo cliente e cruza com os fatos do caso.
 */
export async function executarEstagioAnaliseDocumentalCliente(
  snapshots: SnapshotPipelineEtapa[],
  contexto: ContextoJuridicoPedido | null,
  documentos: DocumentoComArquivoEVinculos[],
  pedidoId: string,
): Promise<ResultadoEstagio<AnaliseDocumentalClienteOutput>> {
  const { materia, extracaoFatos } = extrairDadosPipeline(snapshots);

  const { system, prompt } = buildAnaliseDocumentalClientePrompt(
    contexto,
    extracaoFatos,
    documentos.map((d) => ({
      titulo: d.documento.titulo,
      tipo: d.documento.tipoDocumento,
      resumo: d.documento.resumoJuridico ?? "",
    })),
    materia as Parameters<typeof buildAnaliseDocumentalClientePrompt>[3],
  );

  const modelId = process.env.AI_MODEL ?? "anthropic/claude-sonnet-4-5";

  return executarEstagioComIA<AnaliseDocumentalClienteOutput>({
    modelId,
    system,
    prompt,
    schema: AnaliseDocumentalClienteSchema,
    estagio: "analise_documental_do_cliente",
    pedidoId,
    entradaRef: { documentosProcessados: documentos.length },
  });
}
