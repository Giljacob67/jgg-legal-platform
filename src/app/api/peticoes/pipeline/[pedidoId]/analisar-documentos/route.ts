import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getRequestId, jsonError } from "@/lib/api-response";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { sincronizarPipelinePedido } from "@/modules/peticoes/application/operacional/sincronizarPipelinePedido";
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

/** Fallback de modelos em ordem de preferência */
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
    parteProvavelmenteRepresentada: "Indefinido — requer análise do contrato e do polo processual.",
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

    const diagnostico = await gerarDiagnosticoComIA({ pedidoId, pedido, documentos, contexto });

    // Persist\u00eancia como snapshot do pipeline (preparada, pode ser ativada quando seguro)
    // try {
    //   const infra = await import("@/modules/peticoes/application/operacional/sincronizarPipelinePedido");
    //   // TODO: usar pipelineSnapshotRepository.salvarNovaVersao com etapa "analise_documental_assistente"
    // } catch {
    //   // Ignora falha de persist\u00eancia
    // }

    return NextResponse.json({
      requestId,
      pedidoId,
      diagnostico,
      totalDocumentos: documentos.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno na an\u00e1lise documental.";
    console.error(`[analisar-documentos] erro fatal para ${pedidoId}:`, error);
    return jsonError(requestId, msg, 500);
  }
}
