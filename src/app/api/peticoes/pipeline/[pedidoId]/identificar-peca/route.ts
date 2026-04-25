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
  IdentificacaoPecaAssistenteSchema,
  type IdentificacaoPecaAssistenteOutput,
} from "@/modules/peticoes/domain/schemas-pipeline";

export const maxDuration = 120;

const CACHE_TTL_MS = 5 * 60 * 1000;

const FALLBACK_MODELS = [
  "anthropic/claude-sonnet-4-5",
  "gpt-4o-mini",
  "gpt-4o",
];

type IdentificacaoPeca = IdentificacaoPecaAssistenteOutput;

function assinaturaDocumentos(documentos: DocumentoListItem[]): string {
  return documentos
    .map((d) => `${d.id}:${d.status}`)
    .sort()
    .join("|");
}

async function tentarRecuperarIdentificacaoCache(params: {
  pedidoId: string;
  documentos: DocumentoListItem[];
}): Promise<
  | {
      identificacao: IdentificacaoPeca;
      fonteCache: "snapshot" | "reutilizado";
      criadoEm: string;
    }
  | undefined
> {
  try {
    const infra = getPeticoesOperacionalInfra();
    let ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
      params.pedidoId,
      "assistente_identificacao_peca",
    );

    // Fallback: tenta etapa antiga para compatibilidade com snapshots legados
    if (!ultimo) {
      ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
        params.pedidoId,
        "classificacao",
      );
    }

    if (!ultimo) return undefined;

    const executadoEm = new Date(ultimo.executadoEm).getTime();
    const agora = Date.now();
    if (agora - executadoEm > CACHE_TTL_MS) {
      console.log(`[identificar-peca] cache expirado para ${params.pedidoId}`);
      return undefined;
    }

    const entradaAnterior = (ultimo.entradaRef?.documentosAssinatura as string) ?? "";
    const assinaturaAtual = assinaturaDocumentos(params.documentos);
    if (entradaAnterior !== assinaturaAtual) {
      console.log(`[identificar-peca] documentos mudaram para ${params.pedidoId}: reprocessando`);
      return undefined;
    }

    const saida = ultimo.saidaEstruturada as Partial<IdentificacaoPeca>;
    const identificacao = IdentificacaoPecaAssistenteSchema.safeParse(saida);

    if (!identificacao.success) {
      console.warn(`[identificar-peca] snapshot inv\u00e1lido para ${params.pedidoId}`);
      return undefined;
    }

    return {
      identificacao: {
        ...identificacao.data,
        fonte: identificacao.data.fonte === "real" ? "real" : "parcial",
        observacoes: identificacao.data.observacoes ?? "Identifica\u00e7\u00e3o reutilizada do cache/snapshot.",
      },
      fonteCache: "snapshot",
      criadoEm: ultimo.executadoEm,
    };
  } catch (err) {
    console.warn(`[identificar-peca] falha ao recuperar cache para ${params.pedidoId}:`, err);
    return undefined;
  }
}

async function persistirIdentificacaoSnapshot(params: {
  pedidoId: string;
  documentos: DocumentoListItem[];
  identificacao: IdentificacaoPeca;
  modeloUsado?: string;
}): Promise<void> {
  try {
    const infra = getPeticoesOperacionalInfra();
    const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
      params.pedidoId,
      "assistente_identificacao_peca",
    );

    const entradaRef = {
      documentosAssinatura: assinaturaDocumentos(params.documentos),
      totalDocumentos: params.documentos.length,
      modeloUsado: params.modeloUsado ?? "n\u00e3o informado",
    };

    const saidaEstruturada = { ...params.identificacao } as Record<string, unknown>;

    const serializar = (v: unknown): string => JSON.stringify(v, Object.keys(v as object).sort());
    const mudou =
      !ultimo ||
      serializar(ultimo.entradaRef) !== serializar(entradaRef) ||
      serializar(ultimo.saidaEstruturada) !== serializar(saidaEstruturada) ||
      ultimo.status !== "concluido";

    if (!mudou) {
      console.log(`[identificar-peca] snapshot n\u00e3o mudou para ${params.pedidoId}`);
      return;
    }

    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId: params.pedidoId,
      etapa: "assistente_identificacao_peca",
      entradaRef,
      saidaEstruturada,
      status: "concluido",
      tentativa: (ultimo?.tentativa ?? 0) + 1,
    });

    console.log(`[identificar-peca] snapshot persistido para ${params.pedidoId}`);
  } catch (err) {
    console.warn(`[identificar-peca] falha ao persistir snapshot para ${params.pedidoId}:`, err);
  }
}

async function recuperarDiagnosticoDocumental(pedidoId: string): Promise<{
  diagnostico: Record<string, unknown> | null;
  fonte: string;
}> {
  try {
    const infra = getPeticoesOperacionalInfra();
    let ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
      pedidoId,
      "assistente_analise_documental",
    );

    // Fallback: tenta etapa antiga para compatibilidade com snapshots legados
    if (!ultimo) {
      ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
        pedidoId,
        "analise_documental_do_cliente",
      );
    }

    if (!ultimo) return { diagnostico: null, fonte: "nenhum" };

    return {
      diagnostico: ultimo.saidaEstruturada,
      fonte: "snapshot",
    };
  } catch (err) {
    console.warn(`[identificar-peca] falha ao recuperar diagn\u00f3stico para ${pedidoId}:`, err);
    return { diagnostico: null, fonte: "nenhum" };
  }
}

function construirPromptIdentificacaoPeca(params: {
  pedido: { tipoPeca: string; casoId: string; intencaoProcessual?: string };
  documentos: DocumentoListItem[];
  contexto: ContextoJuridicoPedido | null;
  diagnostico: Record<string, unknown> | null;
}): { system: string; prompt: string } {
  const { pedido, documentos, contexto: _contexto, diagnostico } = params; // eslint-disable-line @typescript-eslint/no-unused-vars

  const docsTexto = documentos
    .map((d, i) => `${i + 1}. ${d.titulo} (${d.tipo}) \u2014 status: ${d.status}`)
    .join("\n");

  const diagTexto = diagnostico
    ? `DIAGN\u00d3STICO DOCUMENTAL J\u00c1 REALIZADO:\n- Tipo de ação provável: ${diagnostico.tipoAcaoProvavel ?? "n\u00e3o identificado"}\n- Parte representada: ${diagnostico.parteProvavelmenteRepresentada ?? "n\u00e3o identificada"}\n- Peça sugerida: ${diagnostico.pecaCabivelSugerida ?? "n\u00e3o identificada"}\n- Fatos relevantes: ${(diagnostico.fatosRelevantes as string[] ?? []).join("; ")}\n- Riscos: ${(diagnostico.riscosFragilidades as string[] ?? []).join("; ")}\n- Pontos controvertidos: ${(diagnostico.pontosControvertidos as string[] ?? []).join("; ")}`
    : "Nenhum diagn\u00f3stico documental dispon\u00edvel.";

  const system = `Voc\u00ea \u00e9 um assistente jur\u00eddico s\u00eanior especializado em identifica\u00e7\u00e3o de pe\u00e7as processuais. Com base no diagn\u00f3stico documental j\u00e1 realizado e nos dados do pedido, infira a pe\u00e7a cab\u00edvel, a fase processual, o polo e as confirma\u00e7\u00f5es necess\u00e1rias. Seja conservador: indique incertezas e n\u00e3o avance para estrat\u00e9gia sem confirma\u00e7\u00e3o do advogado quando houver d\u00favidas materiais.`;

  const prompt = `CASO: ${pedido.casoId}
TIPO DE PE\u00c7A PREVISTO: ${pedido.tipoPeca}
INTEN\u00c7\u00c3O PROCESSUAL: ${pedido.intencaoProcessual ?? "N\u00e3o informada"}

DOCUMENTOS VINCULADOS:
${docsTexto}

${diagTexto}

Tarefa: produza uma identifica\u00e7\u00e3o estruturada da pe\u00e7a cab\u00edvel conforme o schema solicitado. Seja rigoroso: preencha todos os campos, use arrays vazios quando n\u00e3o houver dados, e indique incerteza claramente.`;

  return { system, prompt };
}

function montarFallbackParcial(params: {
  pedido: NonNullable<Awaited<ReturnType<typeof obterPedidoDePeca>>>;
  documentos: DocumentoListItem[];
  contexto: ContextoJuridicoPedido | null;
  diagnostico: Record<string, unknown> | null;
  observacao: string;
}): IdentificacaoPeca {
  const { pedido, documentos, contexto, diagnostico, observacao } = params;

  const _ = contexto; // eslint-disable-line @typescript-eslint/no-unused-vars

  const pecaSugerida = (diagnostico?.pecaCabivelSugerida as string) ?? pedido.tipoPeca ?? "Petição inicial";
  const tipoAcao = (diagnostico?.tipoAcaoProvavel as string) ?? "N\u00e3o identificado";
  const parte = (diagnostico?.parteProvavelmenteRepresentada as string) ?? "Indefinido";
  const polo = parte.toLowerCase().includes("ativo")
    ? "ativo"
    : parte.toLowerCase().includes("passivo")
      ? "passivo"
      : "indefinido";

  return {
    fonte: "parcial",
    observacoes: observacao,
    pecaCabivel: pecaSugerida,
    tipoAcaoProvavel: tipoAcao,
    faseProcessualProvavel: "N\u00e3o identificada \u2014 requer an\u00e1lise do contexto processual.",
    parteProvavelmenteRepresentada: parte,
    poloProvavel: polo as "ativo" | "passivo" | "indefinido",
    grauConfianca: "baixa",
    fundamentosDaInferencia: [
      "Baseado no diagn\u00f3stico documental existente",
      `Pe\u00e7a prevista no pedido: ${pedido.tipoPeca}`,
    ],
    documentosConsiderados: documentos.map((d) => d.titulo),
    pontosDeIncerteza: ["Fase processual n\u00e3o confirmada", "Polo sem comprova\u00e7\u00e3o documental"],
    perguntasDeConfirmacao: [
      "Qual a fase processual atual do caso?",
      "O cliente j\u00e1 foi citado ou ainda \u00e9 autor?",
      "H\u00e1 contesta\u00e7\u00e3o da parte contr\u00e1ria?",
    ],
    proximaAcaoRecomendada: "Confirmar fase processual e polo antes de avan\u00e7ar para estrat\u00e9gia.",
    podeAvancarParaEstrategia: false,
  };
}

async function gerarIdentificacaoComIA(params: {
  pedidoId: string;
  pedido: NonNullable<Awaited<ReturnType<typeof obterPedidoDePeca>>>;
  documentos: DocumentoListItem[];
  contexto: ContextoJuridicoPedido | null;
  diagnostico: Record<string, unknown> | null;
}): Promise<IdentificacaoPeca> {
  const { pedido, documentos, contexto, diagnostico } = params;

  if (!isAIAvailable()) {
    return montarFallbackParcial({
      pedido,
      documentos,
      contexto,
      diagnostico,
      observacao: "IA n\u00e3o dispon\u00edvel. Identifica\u00e7\u00e3o derivada exclusivamente de dados existentes do pipeline.",
    });
  }

  await syncRuntimeAIConfig();
  const { system, prompt } = construirPromptIdentificacaoPeca({ pedido, documentos, contexto, diagnostico });

  const result = await withRetry(
    async () => {
      const model = getLLM();
      const { object } = await generateObject({
        model,
        system,
        prompt,
        schema: IdentificacaoPecaAssistenteSchema,
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
          `[identificar-peca] tentativa ${attempt} falhou para ${params.pedidoId} \u2014 retry em ${delayMs}ms: ${msg.slice(0, 120)}`,
        );
      },
    },
  );

  if (result.ok) {
    const validated = IdentificacaoPecaAssistenteSchema.safeParse(result.data);
    if (validated.success) {
      return {
        ...validated.data,
        fonte: validated.data.fonte === "real" ? "real" : validated.data.fonte,
        observacoes: validated.data.observacoes ?? "Identifica\u00e7\u00e3o enriquecida por IA com valida\u00e7\u00e3o Zod.",
      };
    }

    console.warn(`[identificar-peca] IA retornou objeto inv\u00e1lido para ${params.pedidoId}:`, validated.error?.issues);
    return montarFallbackParcial({
      pedido,
      documentos,
      contexto,
      diagnostico,
      observacao: "IA retornou estrutura inv\u00e1lida. Identifica\u00e7\u00e3o parcial derivada de dados existentes do pipeline.",
    });
  }

  const erro = result.lastError instanceof Error ? result.lastError.message : "Erro desconhecido";
  console.error(
    `[identificar-peca] falhou definitivamente (${result.attempts} tentativas) para ${params.pedidoId}:\n`,
    result.lastError,
  );

  return montarFallbackParcial({
    pedido,
    documentos,
    contexto,
    diagnostico,
    observacao: `Erro ao chamar IA: ${erro}. Identifica\u00e7\u00e3o parcial derivada de dados existentes do pipeline.`,
  });
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
      console.warn(`[identificar-peca] sincroniza\u00e7\u00e3o do pipeline falhou para ${pedidoId}:`, syncError);
    }

    try {
      documentos = await listarDocumentos({ pedidoId: pedido.id });
      if (documentos.length === 0) {
        documentos = await listarDocumentos({ casoId: pedido.casoId });
      }
    } catch (docError) {
      console.warn(`[identificar-peca] falha ao listar documentos para ${pedidoId}:`, docError);
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
    const cache = await tentarRecuperarIdentificacaoCache({ pedidoId, documentos });

    let identificacao: IdentificacaoPeca;
    let reutilizado = false;
    let criadoEm = new Date().toISOString();

    if (cache) {
      identificacao = cache.identificacao;
      reutilizado = true;
      criadoEm = cache.criadoEm;
    } else {
      // Recupera diagn\u00f3stico documental persistido para reutilizar
      const { diagnostico } = await recuperarDiagnosticoDocumental(pedidoId);

      if (!diagnostico) {
        console.log(`[identificar-peca] nenhum diagn\u00f3stico documental para ${pedidoId}: executando an\u00e1lise documental primeiro`);
        // Opcional: poderia chamar a an\u00e1lise documental aqui, mas por seguran\u00e7a orientamos o usu\u00e1rio
      }

      identificacao = await gerarIdentificacaoComIA({ pedidoId, pedido, documentos, contexto, diagnostico });
      await persistirIdentificacaoSnapshot({ pedidoId, documentos, identificacao });
    }

    return NextResponse.json({
      requestId,
      pedidoId,
      identificacao,
      totalDocumentos: documentos.length,
      reutilizado,
      criadoEm,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno na identifica\u00e7\u00e3o de pe\u00e7a.";
    console.error(`[identificar-peca] erro fatal para ${pedidoId}:`, error);
    return jsonError(requestId, msg, 500);
  }
}
