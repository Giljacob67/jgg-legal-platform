import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getRequestId, jsonError } from "@/lib/api-response";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { sincronizarPipelinePedido } from "@/modules/peticoes/application/operacional/sincronizarPipelinePedido";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { isAIAvailable } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { getLLM } from "@/lib/ai/provider";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";
import { withRetry } from "@/lib/ai/retry";
import { listarDocumentos } from "@/modules/documentos/application/listarDocumentos";
import type { DocumentoListItem } from "@/modules/documentos/domain/types";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";
import {
  DiagnosticoDocumentalAssistenteSchema,
  type DiagnosticoDocumentalAssistenteOutput,
} from "@/modules/peticoes/domain/schemas-pipeline";

export const maxDuration = 120;

/** Tempo de cache do diagn\u00f3stico em ms (5 minutos) */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Fallback de modelos em ordem de prefer\u00eancia */
const FALLBACK_MODELS = [
  "anthropic/claude-sonnet-4-5",
  "gpt-4o-mini",
  "gpt-4o",
];

type DiagnosticoDocumental = DiagnosticoDocumentalAssistenteOutput;

function extrairFatosDoContexto(
  contexto: ContextoJuridicoPedido | null,
): { fatos: string[]; controvertidos: string[]; riscos: string[] } {
  const fatos = contexto?.fatosRelevantes ?? [];
  const controvertidos = contexto?.dossieJuridico?.contextoDoCaso?.pontosControvertidos ?? [];
  const riscos = contexto?.dossieJuridico?.analiseAdversa?.riscosProcessuais ?? [];
  return { fatos, controvertidos, riscos };
}

function construirPromptAnaliseDocumental(params: {
  pedido: { tipoPeca: string; casoId: string; intencaoProcessual?: string };
  documentos: DocumentoListItem[];
  contexto: ContextoJuridicoPedido | null;
}): { system: string; prompt: string } {
  const { pedido, documentos, contexto } = params;

  const docsTexto = documentos
    .map(
      (d, i) =>
        `${i + 1}. ${d.titulo} (${d.tipo}) \u2014 status: ${d.status}${d.resumo ? `\n   Resumo: ${d.resumo}` : ""}`,
    )
    .join("\n");

  const fatos = contexto?.fatosRelevantes?.join("\n- ") ?? "Nenhum fato extra\u00eddo ainda.";

  const system = `Voc\u00ea \u00e9 um assistente jur\u00eddico s\u00eanior de an\u00e1lise documental. Analise os documentos do caso e produza um diagn\u00f3stico estruturado em portugu\u00eas-BR. Seja preciso, t\u00e9cnico e pr\u00e1tico.`;

  const prompt = `CASO: ${pedido.casoId}
TIPO DE PE\u00c7A PREVISTO: ${pedido.tipoPeca}
INTEN\u00c7\u00c3O PROCESSUAL: ${pedido.intencaoProcessual ?? "N\u00e3o informada"}

DOCUMENTOS VINCULADOS:
${docsTexto}

FATOS RELEVANTES J\u00c1 IDENTIFICADOS:
- ${fatos}

Tarefa: produza um diagn\u00f3stico documental completo estruturado conforme o schema solicitado. Seja rigoroso: preencha todos os campos, use arrays vazios quando n\u00e3o houver dados, e indique "n\u00e3o identificado" apenas quando realmente n\u00e3o houver informa\u00e7\u00e3o.`;

  return { system, prompt };
}

function montarFallbackParcial(params: {
  pedido: NonNullable<Awaited<ReturnType<typeof obterPedidoDePeca>>>;
  documentos: DocumentoListItem[];
  contexto: ContextoJuridicoPedido | null;
  observacao: string;
}): DiagnosticoDocumental {
  const { pedido, documentos, contexto, observacao } = params;
  const { fatos, controvertidos, riscos } = extrairFatosDoContexto(contexto);

  const tipoPecaDesc = pedido.tipoPeca.replace(/_/g, " ").toUpperCase();

  return {
    fonte: "parcial",
    observacoes: observacao,
    documentosAnalisados: documentos.map((d) => ({
      id: d.id,
      titulo: d.titulo,
      tipo: d.tipo,
      status: d.status,
      fatosExtraidos: d.resumo ? [d.resumo] : undefined,
    })),
    tipoAcaoProvavel: `A\u00e7\u00e3o relacionada a ${tipoPecaDesc}`,
    parteProvavelmenteRepresentada: "Indefinido \u2014 requer an\u00e1lise do contrato e do polo processual.",
    pecaCabivelSugerida: tipoPecaDesc,
    fatosRelevantes: fatos.length > 0 ? fatos : ["Nenhum fato estruturado dispon\u00edvel. Execute o pipeline de extra\u00e7\u00e3o de fatos."],
    pontosControvertidos: controvertidos.length > 0
      ? controvertidos
      : ["Nenhum ponto controvertido identificado pelo pipeline at\u00e9 o momento."],
    riscosFragilidades: riscos.length > 0
      ? riscos
      : ["Riscos n\u00e3o avaliados. Execute o est\u00e1gio de an\u00e1lise adversa no pipeline."],
    documentosFatosFaltantes: ["Comprova\u00e7\u00e3o de v\u00ednculo", "Documento de identidade da parte contr\u00e1ria", "Laudo t\u00e9cnico se aplic\u00e1vel"],
    perguntasMinimas: [
      "Qual o objetivo processual exato do cliente?",
      "Existe documenta\u00e7\u00e3o adicional n\u00e3o anexada?",
      "H\u00e1 prazo prescricional ou decadencial em risco?",
    ],
    proximaAcaoRecomendada: "Executar o pipeline de extra\u00e7\u00e3o de fatos ou aguardar processamento documental.",
    nivelConfianca: "baixa",
  };
}

async function gerarDiagnosticoComIA(params: {
  pedidoId: string;
  pedido: NonNullable<Awaited<ReturnType<typeof obterPedidoDePeca>>>;
  documentos: DocumentoListItem[];
  contexto: ContextoJuridicoPedido | null;
}): Promise<DiagnosticoDocumental> {
  const { pedido, documentos, contexto } = params;

  if (!isAIAvailable()) {
    return montarFallbackParcial({
      pedido,
      documentos,
      contexto,
      observacao: "IA n\u00e3o dispon\u00edvel. Diagn\u00f3stico derivado exclusivamente de dados existentes do pipeline.",
    });
  }

  await syncRuntimeAIConfig();
  const { system, prompt } = construirPromptAnaliseDocumental({ pedido, documentos, contexto });

  const result = await withRetry(
    async () => {
      const model = getLLM();
      const { object } = await generateObject({
        model,
        system,
        prompt,
        schema: DiagnosticoDocumentalAssistenteSchema,
        temperature: 0.2,
        maxOutputTokens: 4000,
      });
      return object;
    },
    {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      fallbackModels: FALLBACK_MODELS,
      onRetry: (attempt, err, delayMs) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[analisar-documentos] tentativa ${attempt} falhou para ${params.pedidoId} \u2014 retry em ${delayMs}ms: ${msg.slice(0, 120)}`,
        );
      },
    },
  );

  if (result.ok) {
    const validated = DiagnosticoDocumentalAssistenteSchema.safeParse(result.data);
    if (validated.success) {
      return {
        ...validated.data,
        fonte: validated.data.fonte === "real" ? "real" : validated.data.fonte,
        observacoes: validated.data.observacoes ?? "Diagn\u00f3stico enriquecido por IA com valida\u00e7\u00e3o Zod.",
      };
    }

    console.warn(`[analisar-documentos] IA retornou objeto inv\u00e1lido para ${params.pedidoId}:`, validated.error?.issues);
    return montarFallbackParcial({
      pedido,
      documentos,
      contexto,
      observacao: "IA retornou estrutura inv\u00e1lida. Diagn\u00f3stico parcial derivado de dados existentes do pipeline.",
    });
  }

  const erro = result.lastError instanceof Error ? result.lastError.message : "Erro desconhecido";
  console.error(
    `[analisar-documentos] falhou definitivamente (${result.attempts} tentativas) para ${params.pedidoId}:\n`,
    result.lastError,
  );

  return montarFallbackParcial({
    pedido,
    documentos,
    contexto,
    observacao: `Erro ao chamar IA: ${erro}. Diagn\u00f3stico parcial derivado de dados existentes do pipeline.`,
  });
}

/** Gera uma assinatura simples dos documentos para invalida\u00e7\u00e3o de cache */
function assinaturaDocumentos(documentos: DocumentoListItem[]): string {
  return documentos
    .map((d) => `${d.id}:${d.status}`)
    .sort()
    .join("|");
}

/** Tenta recuperar diagn\u00f3stico v\u00e1lido do cache/snapshot */
async function tentarRecuperarDiagnosticoCache(params: {
  pedidoId: string;
  documentos: DocumentoListItem[];
}): Promise<
  | {
      diagnostico: DiagnosticoDocumental;
      fonteCache: "snapshot" | "reutilizado";
      criadoEm: string;
    }
  | undefined
> {
  try {
    const infra = getPeticoesOperacionalInfra();
    const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
      params.pedidoId,
      "analise_documental_do_cliente",
    );

    if (!ultimo) return undefined;

    // Verifica se o cache ainda \u00e9 recente (5 minutos)
    const executadoEm = new Date(ultimo.executadoEm).getTime();
    const agora = Date.now();
    if (agora - executadoEm > CACHE_TTL_MS) {
      console.log(`[analisar-documentos] cache expirado para ${params.pedidoId}`);
      return undefined;
    }

    // Verifica se os documentos mudaram desde o \u00faltimo snapshot
    const entradaAnterior = (ultimo.entradaRef?.documentosAssinatura as string) ?? "";
    const assinaturaAtual = assinaturaDocumentos(params.documentos);
    if (entradaAnterior !== assinaturaAtual) {
      console.log(
        `[analisar-documentos] documentos mudaram para ${params.pedidoId}: reprocessando`,
      );
      return undefined;
    }

    // Recupera o diagn\u00f3stico do snapshot
    const saida = ultimo.saidaEstruturada as Partial<DiagnosticoDocumental>;
    const diagnostico = DiagnosticoDocumentalAssistenteSchema.safeParse(saida);

    if (!diagnostico.success) {
      console.warn(`[analisar-documentos] snapshot inv\u00e1lido para ${params.pedidoId}`);
      return undefined;
    }

    return {
      diagnostico: {
        ...diagnostico.data,
        fonte: diagnostico.data.fonte === "real" ? "real" : "parcial",
        observacoes:
          diagnostico.data.observacoes ?? "Diagn\u00f3stico reutilizado do cache/snapshot.",
      },
      fonteCache: "snapshot",
      criadoEm: ultimo.executadoEm,
    };
  } catch (err) {
    console.warn(`[analisar-documentos] falha ao recuperar cache para ${params.pedidoId}:`, err);
    return undefined;
  }
}

/** Persiste o diagn\u00f3stico como snapshot do pipeline */
async function persistirDiagnosticoSnapshot(params: {
  pedidoId: string;
  documentos: DocumentoListItem[];
  diagnostico: DiagnosticoDocumental;
  modeloUsado?: string;
}): Promise<void> {
  try {
    const infra = getPeticoesOperacionalInfra();
    const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
      params.pedidoId,
      "analise_documental_do_cliente",
    );

    const entradaRef = {
      documentosAssinatura: assinaturaDocumentos(params.documentos),
      totalDocumentos: params.documentos.length,
      modeloUsado: params.modeloUsado ?? "n\u00e3o informado",
    };

    const saidaEstruturada = { ...params.diagnostico } as Record<string, unknown>;

    // Verifica se mudou desde o \u00faltimo snapshot
    const serializar = (v: unknown): string => JSON.stringify(v, Object.keys(v as object).sort());
    const mudou =
      !ultimo ||
      serializar(ultimo.entradaRef) !== serializar(entradaRef) ||
      serializar(ultimo.saidaEstruturada) !== serializar(saidaEstruturada) ||
      ultimo.status !== "concluido";

    if (!mudou) {
      console.log(`[analisar-documentos] snapshot n\u00e3o mudou para ${params.pedidoId}, pulando persist\u00eancia`);
      return;
    }

    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId: params.pedidoId,
      etapa: "analise_documental_do_cliente",
      entradaRef,
      saidaEstruturada,
      status: "concluido",
      tentativa: (ultimo?.tentativa ?? 0) + 1,
    });

    console.log(`[analisar-documentos] snapshot persistido para ${params.pedidoId}`);
  } catch (err) {
    console.warn(`[analisar-documentos] falha ao persistir snapshot para ${params.pedidoId}:`, err);
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const requestId = getRequestId(_req);
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { pedidoId } = await params;

  try {
    const pedido = await obterPedidoDePeca(pedidoId);
    if (!pedido) {
      return jsonError(requestId, "Pedido n\u00e3o encontrado.", 404);
    }

    let contexto: ContextoJuridicoPedido | null = null;
    let documentos: DocumentoListItem[] = [];

    try {
      const pipelineSync = await sincronizarPipelinePedido(pedidoId);
      contexto = pipelineSync.contextoAtual;
    } catch (syncError) {
      console.warn(`[analisar-documentos] sincroniza\u00e7\u00e3o do pipeline falhou para ${pedidoId}:`, syncError);
    }

    try {
      documentos = await listarDocumentos({ pedidoId: pedido.id });
      if (documentos.length === 0) {
        documentos = await listarDocumentos({ casoId: pedido.casoId });
      }
    } catch (docError) {
      console.warn(`[analisar-documentos] falha ao listar documentos para ${pedidoId}:`, docError);
    }

    if (!contexto) {
      try {
        const pipeline = await obterPipelineDoPedido(pedidoId);
        contexto = pipeline.contextoAtual ?? null;
      } catch {
        // Ignora
      }
    }

    // Tenta recuperar do cache primeiro
    const cache = await tentarRecuperarDiagnosticoCache({ pedidoId, documentos });

    let diagnostico: DiagnosticoDocumental;
    let reutilizado = false;
    let criadoEm = new Date().toISOString();

    if (cache) {
      diagnostico = cache.diagnostico;
      reutilizado = true;
      criadoEm = cache.criadoEm;
    } else {
      diagnostico = await gerarDiagnosticoComIA({ pedidoId, pedido, documentos, contexto });
      await persistirDiagnosticoSnapshot({ pedidoId, documentos, diagnostico });
    }

    return NextResponse.json({
      requestId,
      pedidoId,
      diagnostico,
      totalDocumentos: documentos.length,
      reutilizado,
      criadoEm,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno na an\u00e1lise documental.";
    console.error(`[analisar-documentos] erro fatal para ${pedidoId}:`, error);
    return jsonError(requestId, msg, 500);
  }
}
