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
  EstrategiaAssistenteSchema,
  type EstrategiaAssistenteOutput,
} from "@/modules/peticoes/domain/schemas-pipeline";

export const maxDuration = 120;

const CACHE_TTL_MS = 5 * 60 * 1000;

const FALLBACK_MODELS = [
  "anthropic/claude-sonnet-4-5",
  "gpt-4o-mini",
  "gpt-4o",
];

type Estrategia = EstrategiaAssistenteOutput;

function assinaturaEntrada(documentos: DocumentoListItem[], identificacao?: Record<string, unknown> | null): string {
  const docs = documentos
    .map((d) => `${d.id}:${d.status}`)
    .sort()
    .join("|");
  const ident = identificacao
    ? `${identificacao.pecaCabivel ?? ""}:${identificacao.poloProvavel ?? ""}`
    : "nenhum";
  return `${docs}::${ident}`;
}

async function tentarRecuperarEstrategiaCache(params: {
  pedidoId: string;
  documentos: DocumentoListItem[];
  identificacao?: Record<string, unknown> | null;
}): Promise<
  | {
      estrategia: Estrategia;
      fonteCache: "snapshot" | "reutilizado";
      criadoEm: string;
    }
  | undefined
> {
  try {
    const infra = getPeticoesOperacionalInfra();
    const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
      params.pedidoId,
      "assistente_estrategia",
    );

    if (!ultimo) return undefined;

    const executadoEm = new Date(ultimo.executadoEm).getTime();
    const agora = Date.now();
    if (agora - executadoEm > CACHE_TTL_MS) {
      console.log(`[sugerir-estrategia] cache expirado para ${params.pedidoId}`);
      return undefined;
    }

    const entradaAnterior = (ultimo.entradaRef?.assinaturaEntrada as string) ?? "";
    const assinaturaAtual = assinaturaEntrada(params.documentos, params.identificacao);
    if (entradaAnterior !== assinaturaAtual) {
      console.log(`[sugerir-estrategia] entrada mudou para ${params.pedidoId}: reprocessando`);
      return undefined;
    }

    const saida = ultimo.saidaEstruturada as Partial<Estrategia>;
    const estrategia = EstrategiaAssistenteSchema.safeParse(saida);

    if (!estrategia.success) {
      console.warn(`[sugerir-estrategia] snapshot inv\u00e1lido para ${params.pedidoId}`);
      return undefined;
    }

    return {
      estrategia: {
        ...estrategia.data,
        fonte: estrategia.data.fonte === "real" ? "real" : "parcial",
        observacoes: estrategia.data.observacoes ?? "Estrat\u00e9gia reutilizada do cache/snapshot.",
      },
      fonteCache: "snapshot",
      criadoEm: ultimo.executadoEm,
    };
  } catch (err) {
    console.warn(`[sugerir-estrategia] falha ao recuperar cache para ${params.pedidoId}:`, err);
    return undefined;
  }
}

async function persistirEstrategiaSnapshot(params: {
  pedidoId: string;
  documentos: DocumentoListItem[];
  identificacao?: Record<string, unknown> | null;
  estrategia: Estrategia;
  modeloUsado?: string;
}): Promise<void> {
  try {
    const infra = getPeticoesOperacionalInfra();
    const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
      params.pedidoId,
      "assistente_estrategia",
    );

    const entradaRef = {
      assinaturaEntrada: assinaturaEntrada(params.documentos, params.identificacao),
      totalDocumentos: params.documentos.length,
      modeloUsado: params.modeloUsado ?? "n\u00e3o informado",
    };

    const saidaEstruturada = { ...params.estrategia } as Record<string, unknown>;

    const serializar = (v: unknown): string => JSON.stringify(v, Object.keys(v as object).sort());
    const mudou =
      !ultimo ||
      serializar(ultimo.entradaRef) !== serializar(entradaRef) ||
      serializar(ultimo.saidaEstruturada) !== serializar(saidaEstruturada) ||
      ultimo.status !== "concluido";

    if (!mudou) {
      console.log(`[sugerir-estrategia] snapshot n\u00e3o mudou para ${params.pedidoId}`);
      return;
    }

    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId: params.pedidoId,
      etapa: "assistente_estrategia",
      entradaRef,
      saidaEstruturada,
      status: "concluido",
      tentativa: (ultimo?.tentativa ?? 0) + 1,
    });

    console.log(`[sugerir-estrategia] snapshot persistido para ${params.pedidoId}`);
  } catch (err) {
    console.warn(`[sugerir-estrategia] falha ao persistir snapshot para ${params.pedidoId}:`, err);
  }
}

async function recuperarSnapshotAssistente(
  pedidoId: string,
  etapa: "assistente_analise_documental" | "assistente_identificacao_peca",
): Promise<Record<string, unknown> | null> {
  try {
    const infra = getPeticoesOperacionalInfra();
    let ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(pedidoId, etapa);

    if (!ultimo && etapa === "assistente_analise_documental") {
      ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
        pedidoId,
        "analise_documental_do_cliente",
      );
    }

    if (!ultimo && etapa === "assistente_identificacao_peca") {
      ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
        pedidoId,
        "classificacao",
      );
    }

    return ultimo?.saidaEstruturada ?? null;
  } catch (err) {
    console.warn(`[sugerir-estrategia] falha ao recuperar ${etapa} para ${pedidoId}:`, err);
    return null;
  }
}

function construirPromptEstrategia(params: {
  pedido: { tipoPeca: string; casoId: string; intencaoProcessual?: string };
  documentos: DocumentoListItem[];
  diagnostico: Record<string, unknown> | null;
  identificacao: Record<string, unknown> | null;
}): { system: string; prompt: string } {
  const { pedido, documentos, diagnostico, identificacao } = params;

  const docsTexto = documentos
    .map((d, i) => `${i + 1}. ${d.titulo} (${d.tipo}) \u2014 status: ${d.status}`)
    .join("\n");

  const diagTexto = diagnostico
    ? `DIAGN\u00d3STICO DOCUMENTAL:\n- Tipo de a\u00e7\u00e3o: ${diagnostico.tipoAcaoProvavel ?? "n\u00e3o identificado"}\n- Parte: ${diagnostico.parteProvavelmenteRepresentada ?? "n\u00e3o identificada"}\n- Pe\u00e7a sugerida: ${diagnostico.pecaCabivelSugerida ?? "n\u00e3o identificada"}\n- Fatos: ${(diagnostico.fatosRelevantes as string[] ?? []).join("; ")}\n- Riscos: ${(diagnostico.riscosFragilidades as string[] ?? []).join("; ")}\n- Pontos controvertidos: ${(diagnostico.pontosControvertidos as string[] ?? []).join("; ")}`
    : "Nenhum diagn\u00f3stico documental dispon\u00edvel.";

  const identTexto = identificacao
    ? `IDENTIFICA\u00c7\u00c3O DE PE\u00c7A:\n- Pe\u00e7a cab\u00edvel: ${identificacao.pecaCabivel ?? "n\u00e3o identificada"}\n- Fase processual: ${identificacao.faseProcessualProvavel ?? "n\u00e3o identificada"}\n- Polo: ${identificacao.poloProvavel ?? "indefinido"}\n- Confian\u00e7a: ${identificacao.grauConfianca ?? "baixa"}\n- Incertezas: ${(identificacao.pontosDeIncerteza as string[] ?? []).join("; ")}`
    : "Nenhuma identifica\u00e7\u00e3o de pe\u00e7a dispon\u00edvel.";

  const system = `Voc\u00ea \u00e9 um assistente jur\u00eddico s\u00eanior especializado em estrat\u00e9gia processual. Com base no diagn\u00f3stico documental e na identifica\u00e7\u00e3o de pe\u00e7a j\u00e1 realizados, sugira uma estrat\u00e9gia jur\u00eddica inicial. Seja conservador: n\u00e3o sugira teses arriscadas sem base documental, indique incertezas e n\u00e3o autorize avan\u00e7o para minuta sem confirma\u00e7\u00e3o humana quando houver fragilidades.`;

  const prompt = `CASO: ${pedido.casoId}
TIPO DE PE\u00c7A PREVISTO: ${pedido.tipoPeca}
INTEN\u00c7\u00c3O PROCESSUAL: ${pedido.intencaoProcessual ?? "N\u00e3o informada"}

DOCUMENTOS VINCULADOS:
${docsTexto}

${diagTexto}

${identTexto}

Tarefa: produza uma estrat\u00e9gia jur\u00eddica estruturada conforme o schema solicitado. Seja rigoroso: preencha todos os campos, use arrays vazios quando n\u00e3o houver dados, e indique incerteza claramente.`;

  return { system, prompt };
}

function montarFallbackParcial(params: {
  pedido: NonNullable<Awaited<ReturnType<typeof obterPedidoDePeca>>>;
  documentos: DocumentoListItem[];
  diagnostico: Record<string, unknown> | null;
  identificacao: Record<string, unknown> | null;
  observacao: string;
}): Estrategia {
  const { pedido, documentos, diagnostico: _diagnostico, identificacao, observacao } = params; // eslint-disable-line @typescript-eslint/no-unused-vars

  const peca = (identificacao?.pecaCabivel as string) ?? pedido.tipoPeca ?? "Peti\u00e7\u00e3o inicial";
  const polo = (identificacao?.poloProvavel as string) ?? "indefinido";

  return {
    fonte: "parcial",
    observacoes: observacao,
    estrategiaRecomendada: `Estrat\u00e9gia baseada na pe\u00e7a ${peca} com polo ${polo}.`,
    objetivoProcessual: pedido.intencaoProcessual ?? "N\u00e3o informado",
    linhaArgumentativaPrincipal: "Requer an\u00e1lise documental completa para definir linha argumentativa.",
    tesesPrincipais: [
      {
        titulo: "Tese principal n\u00e3o definida",
        fundamentoLegal: "Requer fundamenta\u00e7\u00e3o jur\u00eddica espec\u00edfica.",
        prioridade: "principal",
      },
    ],
    tesesSubsidiarias: [],
    pedidosRecomendados: ["Requer an\u00e1lise mais detalhada para definir pedidos."],
    pedidosArriscados: [],
    riscosEFragilidades: [
      "Estrat\u00e9gia sem base documental s\u00f3lida",
      "Diagn\u00f3stico documental pode estar incompleto",
    ],
    pontosAEvitar: ["N\u00e3o avan\u00e7ar para minuta sem confirma\u00e7\u00e3o humana"],
    provasEDocumentosDeApoio: documentos.map((d) => d.titulo),
    perguntasPendentes: [
      "Qual o objetivo processual exato?",
      "H\u00e1 documenta\u00e7\u00e3o adicional n\u00e3o analisada?",
    ],
    nivelConfianca: "baixa",
    podeAvancarParaMinuta: false,
    proximaAcaoRecomendada: "Executar an\u00e1lise documental completa e identificar pe\u00e7a cab\u00edvel antes de estrat\u00e9gia.",
  };
}

async function gerarEstrategiaComIA(params: {
  pedidoId: string;
  pedido: NonNullable<Awaited<ReturnType<typeof obterPedidoDePeca>>>;
  documentos: DocumentoListItem[];
  diagnostico: Record<string, unknown> | null;
  identificacao: Record<string, unknown> | null;
}): Promise<Estrategia> {
  const { pedido, documentos, diagnostico, identificacao } = params;

  if (!isAIAvailable()) {
    return montarFallbackParcial({
      pedido,
      documentos,
      diagnostico,
      identificacao,
      observacao: "IA n\u00e3o dispon\u00edvel. Estrat\u00e9gia derivada exclusivamente de dados existentes do pipeline.",
    });
  }

  await syncRuntimeAIConfig();
  const { system, prompt } = construirPromptEstrategia({ pedido, documentos, diagnostico, identificacao });

  const result = await withRetry(
    async () => {
      const model = getLLM();
      const { object } = await generateObject({
        model,
        system,
        prompt,
        schema: EstrategiaAssistenteSchema,
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
          `[sugerir-estrategia] tentativa ${attempt} falhou para ${params.pedidoId} \u2014 retry em ${delayMs}ms: ${msg.slice(0, 120)}`,
        );
      },
    },
  );

  if (result.ok) {
    const validated = EstrategiaAssistenteSchema.safeParse(result.data);
    if (validated.success) {
      return {
        ...validated.data,
        fonte: validated.data.fonte === "real" ? "real" : validated.data.fonte,
        observacoes: validated.data.observacoes ?? "Estrat\u00e9gia enriquecida por IA com valida\u00e7\u00e3o Zod.",
      };
    }

    console.warn(`[sugerir-estrategia] IA retornou objeto inv\u00e1lido para ${params.pedidoId}:`, validated.error?.issues);
    return montarFallbackParcial({
      pedido,
      documentos,
      diagnostico,
      identificacao,
      observacao: "IA retornou estrutura inv\u00e1lida. Estrat\u00e9gia parcial derivada de dados existentes do pipeline.",
    });
  }

  const erro = result.lastError instanceof Error ? result.lastError.message : "Erro desconhecido";
  console.error(
    `[sugerir-estrategia] falhou definitivamente (${result.attempts} tentativas) para ${params.pedidoId}:\n`,
    result.lastError,
  );

  return montarFallbackParcial({
    pedido,
    documentos,
    diagnostico,
    identificacao,
    observacao: `Erro ao chamar IA: ${erro}. Estrat\u00e9gia parcial derivada de dados existentes do pipeline.`,
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
      console.warn(`[sugerir-estrategia] sincroniza\u00e7\u00e3o do pipeline falhou para ${pedidoId}:`, syncError);
    }

    try {
      documentos = await listarDocumentos({ pedidoId: pedido.id });
      if (documentos.length === 0) {
        documentos = await listarDocumentos({ casoId: pedido.casoId });
      }
    } catch (docError) {
      console.warn(`[sugerir-estrategia] falha ao listar documentos para ${pedidoId}:`, docError);
    }

    if (!contexto) {
      try {
        const pipeline = await obterPipelineDoPedido(pedidoId);
        contexto = pipeline.contextoAtual ?? null;
      } catch {
        // Ignora
      }
    }

    // Recupera depend\u00eancias (snapshots anteriores do Assistente)
    const diagnostico = await recuperarSnapshotAssistente(pedidoId, "assistente_analise_documental");
    const identificacao = await recuperarSnapshotAssistente(pedidoId, "assistente_identificacao_peca");

    // Valida depend\u00eancias m\u00ednimas
    if (!diagnostico) {
      return NextResponse.json({
        requestId,
        pedidoId,
        estrategia: null,
        totalDocumentos: documentos.length,
        reutilizado: false,
        dependenciasFaltantes: ["analisar-documentos"],
        mensagem: "\u00c9 necess\u00e1rio executar \"Analisar documentos\" antes de sugerir estrat\u00e9gia.",
        timestamp: new Date().toISOString(),
      });
    }

    if (!identificacao) {
      return NextResponse.json({
        requestId,
        pedidoId,
        estrategia: null,
        totalDocumentos: documentos.length,
        reutilizado: false,
        dependenciasFaltantes: ["identificar-peca"],
        mensagem: "\u00c9 necess\u00e1rio executar \"Identificar pe\u00e7a cab\u00edvel\" antes de sugerir estrat\u00e9gia.",
        timestamp: new Date().toISOString(),
      });
    }

    // Tenta recuperar do cache primeiro
    const cache = await tentarRecuperarEstrategiaCache({ pedidoId, documentos, identificacao });

    let estrategia: Estrategia;
    let reutilizado = false;
    let criadoEm = new Date().toISOString();

    if (cache) {
      estrategia = cache.estrategia;
      reutilizado = true;
      criadoEm = cache.criadoEm;
    } else {
      estrategia = await gerarEstrategiaComIA({ pedidoId, pedido, documentos, diagnostico, identificacao });
      await persistirEstrategiaSnapshot({ pedidoId, documentos, identificacao, estrategia });
    }

    return NextResponse.json({
      requestId,
      pedidoId,
      estrategia,
      totalDocumentos: documentos.length,
      reutilizado,
      criadoEm,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno na sugest\u00e3o de estrat\u00e9gia.";
    console.error(`[sugerir-estrategia] erro fatal para ${pedidoId}:`, error);
    return jsonError(requestId, msg, 500);
  }
}
