import "server-only";

import { generateObject } from "ai";
import { z } from "zod";
import { getLLM } from "@/lib/ai/provider";
import { buildAnaliseAdversaPrompt } from "@/lib/ai/prompts/analise-adversa";
import { buildPesquisaApoioPrompt } from "@/lib/ai/prompts/pesquisa-de-apoio";
import { buildAnaliseDocumentalClientePrompt } from "@/lib/ai/prompts/analise-documental-cliente";
import { buscarChunksRelevantes } from "@/modules/biblioteca-conhecimento/infrastructure/vectorStore";
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
}

/** Extrai matéria, tipo de peça e fatos dos snapshots existentes do pipeline */
function extrairDadosPipeline(
  snapshots: SnapshotPipelineEtapa[],
  contexto: ContextoJuridicoPedido | null,
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

/**
 * Executa um estágio de IA usando generateObject (AI SDK v6) com validação Zod.
 */
async function executarEstagioComIA<T>(params: {
  model: Parameters<typeof generateObject>[0]["model"];
  system: string;
  prompt: string;
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>;
  estagio: string;
  pedidoId: string;
  entradaRef: Record<string, unknown>;
}): Promise<ResultadoEstagio<T>> {
  try {
    const { object } = await generateObject({
      model: params.model,
      system: params.system,
      prompt: params.prompt,
      schema: params.schema,
      temperature: 0.3,
      maxOutputTokens: 4000,
    });

    return { saida: object as T, status: "concluido" };
  } catch (err) {
    const erro = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`[${params.estagio}] falhou para ${params.pedidoId}:`, err);
    return { saida: {} as T, status: "erro", erro };
  }
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
  const { materia, extracaoFatos } = extrairDadosPipeline(snapshots, contexto);

  const { system, prompt } = buildAnaliseAdversaPrompt(
    contexto,
    extracaoFatos,
    materia as Parameters<typeof buildAnaliseAdversaPrompt>[2],
  );

  let model: Parameters<typeof generateObject>[0]["model"];
  try {
    model = getLLM();
  } catch {
    return {
      saida: {} as AnaliseAdversaOutput,
      status: "erro",
      erro: "AI não configurada — verifique OPENROUTER_API_KEY ou ANTHROPIC_API_KEY.",
    };
  }

  return executarEstagioComIA<AnaliseAdversaOutput>({
    model,
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
  const { materia, tipoPeca, extracaoFatos } = extrairDadosPipeline(snapshots, contexto);

  const fatosTexto = Array.isArray(extracaoFatos.fatosRelevantes)
    ? (extracaoFatos.fatosRelevantes as string[]).slice(0, 5).join(" ")
    : JSON.stringify(extracaoFatos).slice(0, 500);

  const query = `${materia} ${tipoPeca} ${fatosTexto}`;
  let chunks = await buscarChunksRelevantes(query, 8).catch(() => []);

  if (chunks.length === 0) {
    console.warn("[PesquisaApoio] Vector store não retornou chunks — continuando sem apoio.");
  }

  const { system, prompt } = buildPesquisaApoioPrompt(
    contexto,
    materia as Parameters<typeof buildPesquisaApoioPrompt>[1],
    chunks.map((c) => c.conteudo),
  );

  let model: Parameters<typeof generateObject>[0]["model"];
  try {
    model = getLLM();
  } catch {
    return {
      saida: {} as PesquisaApoioOutput,
      status: "erro",
      erro: "AI não configurada.",
    };
  }

  return executarEstagioComIA<PesquisaApoioOutput>({
    model,
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
  const { materia, extracaoFatos } = extrairDadosPipeline(snapshots, contexto);

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

  let model: Parameters<typeof generateObject>[0]["model"];
  try {
    model = getLLM();
  } catch {
    return {
      saida: {} as AnaliseDocumentalClienteOutput,
      status: "erro",
      erro: "AI não configurada.",
    };
  }

  return executarEstagioComIA<AnaliseDocumentalClienteOutput>({
    model,
    system,
    prompt,
    schema: AnaliseDocumentalClienteSchema,
    estagio: "analise_documental_do_cliente",
    pedidoId,
    entradaRef: { documentosProcessados: documentos.length },
  });
}
