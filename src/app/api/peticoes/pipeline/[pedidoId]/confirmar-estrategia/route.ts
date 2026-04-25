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
  ConfirmacaoEstrategiaAssistenteSchema,
  type ConfirmacaoEstrategiaAssistenteOutput,
} from "@/modules/peticoes/domain/schemas-pipeline";

export const maxDuration = 120;

const FALLBACK_MODELS = [
  "anthropic/claude-sonnet-4-5",
  "gpt-4o-mini",
  "gpt-4o",
];

type ConfirmacaoEstrategia = ConfirmacaoEstrategiaAssistenteOutput;

function assinaturaEntrada(documentos: DocumentoListItem[], estrategia?: Record<string, unknown> | null): string {
  const docs = documentos
    .map((d) => `${d.id}:${d.status}`)
    .sort()
    .join("|");
  const est = estrategia
    ? `${estrategia.pecaCabivel ?? ""}:${estrategia.poloProvavel ?? ""}:${(estrategia.tesesPrincipais as Array<{ titulo: string }> ?? []).map((t) => t.titulo).join(",")}`
    : "nenhum";
  return `${docs}::${est}`;
}

async function recuperarSnapshotAssistente(
  pedidoId: string,
  etapa: "assistente_estrategia",
): Promise<Record<string, unknown> | null> {
  try {
    const infra = getPeticoesOperacionalInfra();
    const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(pedidoId, etapa);
    return ultimo?.saidaEstruturada ?? null;
  } catch (err) {
    console.warn(`[confirmar-estrategia] falha ao recuperar ${etapa} para ${pedidoId}:`, err);
    return null;
  }
}

async function persistirConfirmacaoSnapshot(params: {
  pedidoId: string;
  documentos: DocumentoListItem[];
  estrategia: Record<string, unknown> | null;
  confirmacao: ConfirmacaoEstrategia;
  modeloUsado?: string;
}): Promise<void> {
  try {
    const infra = getPeticoesOperacionalInfra();
    const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(
      params.pedidoId,
      "assistente_confirmacao_estrategia",
    );

    const entradaRef = {
      assinaturaEntrada: assinaturaEntrada(params.documentos, params.estrategia),
      totalDocumentos: params.documentos.length,
      modeloUsado: params.modeloUsado ?? "n\u00e3o informado",
    };

    const saidaEstruturada = { ...params.confirmacao } as Record<string, unknown>;

    const serializar = (v: unknown): string => JSON.stringify(v, Object.keys(v as object).sort());
    const mudou =
      !ultimo ||
      serializar(ultimo.entradaRef) !== serializar(entradaRef) ||
      serializar(ultimo.saidaEstruturada) !== serializar(saidaEstruturada) ||
      ultimo.status !== "concluido";

    if (!mudou) {
      console.log(`[confirmar-estrategia] snapshot n\u00e3o mudou para ${params.pedidoId}`);
      return;
    }

    await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId: params.pedidoId,
      etapa: "assistente_confirmacao_estrategia",
      entradaRef,
      saidaEstruturada,
      status: "concluido",
      tentativa: (ultimo?.tentativa ?? 0) + 1,
    });

    console.log(`[confirmar-estrategia] snapshot persistido para ${params.pedidoId}`);
  } catch (err) {
    console.warn(`[confirmar-estrategia] falha ao persistir snapshot para ${params.pedidoId}:`, err);
  }
}

function construirPromptConfirmacao(params: {
  pedido: { tipoPeca: string; casoId: string; intencaoProcessual?: string };
  documentos: DocumentoListItem[];
  estrategia: Record<string, unknown> | null;
  respostaAdvogado: string;
}): { system: string; prompt: string } {
  const { pedido, estrategia, respostaAdvogado } = params;

  const estTexto = estrategia
    ? `ESTRAT\u00c9GIA PROPOSTA:\n- Pe\u00e7a: ${estrategia.pecaCabivel ?? "n\u00e3o identificada"}\n- Tipo a\u00e7\u00e3o: ${estrategia.tipoAcaoProvavel ?? "n\u00e3o identificado"}\n- Objetivo: ${estrategia.objetivoProcessual ?? "n\u00e3o informado"}\n- Linha: ${estrategia.linhaArgumentativaPrincipal ?? "n\u00e3o definida"}\n- Teses: ${(estrategia.tesesPrincipais as Array<{ titulo: string }> ?? []).map((t) => t.titulo).join("; ")}\n- Pedidos: ${(estrategia.pedidosRecomendados as string[] ?? []).join("; ")}\n- Riscos: ${(estrategia.riscosEFragilidades as string[] ?? []).join("; ")}\n- Perguntas pendentes: ${(estrategia.perguntasPendentes as string[] ?? []).join("; ")}\n- Pode avan\u00e7ar: ${estrategia.podeAvancarParaMinuta ?? false}`
    : "Nenhuma estrat\u00e9gia proposta.";

  const system = `Voc\u00ea \u00e9 um assistente jur\u00eddico que interpreta respostas de advogados sobre estrat\u00e9gia processual. Analise a resposta livre do advogado e estruture-a como confirma\u00e7\u00e3o formal. Seja conservador: se a resposta for amb\u00edgua, incompleta ou indicar d\u00favida, defina estrategiaAprovada=false e podeAvancarParaMinuta=false. Nunca aprovar t\u00e1citamente. Registre ressalvas explicitamente.`;

  const prompt = `CASO: ${pedido.casoId}
PE\u00c7A: ${pedido.tipoPeca}

${estTexto}

RESPOSTA DO ADVOGADO:
"${respostaAdvogado}"

Tarefa: interprete a resposta do advogado e produza uma confirma\u00e7\u00e3o estruturada conforme o schema. Regras:
- Se o advogado disser "sim", "aprovo", "pode seguir", "estrat\u00e9gia aprovada" \u2192 estrategiaAprovada=true.
- Se disser "n\u00e3o", "rejeito", "mude", "n\u00e3o concordo" \u2192 estrategiaAprovada=false.
- Se houver ambiguidade, d\u00favida ou resposta evasiva \u2192 estrategiaAprovada=false e podeAvancarParaMinuta=false.
- Capture teses aprovadas, rejeitadas, pedidos obrigat\u00f3rios/removidos, riscos aceitos e ressalvas.
- Use arrays vazios quando n\u00e3o houver dados.
- confirmadoEm deve ser o timestamp atual.`;

  return { system, prompt };
}

function montarFallbackParcial(params: {
  estrategia: Record<string, unknown> | null;
  respostaAdvogado: string;
  observacao: string;
}): ConfirmacaoEstrategia {
  const { estrategia, respostaAdvogado, observacao } = params;

  const peca = (estrategia?.pecaCabivel as string) ?? "N\u00e3o identificada";
  const pedidos = (estrategia?.pedidosRecomendados as string[] ?? []);

  return {
    fonte: "parcial",
    observacoes: observacao,
    estrategiaAprovada: false,
    parteRepresentadaConfirmada: (estrategia?.parteProvavelmenteRepresentada as string) ?? "Indefinido",
    pecaCabivelConfirmada: peca,
    tesesAprovadas: [],
    tesesRejeitadas: [],
    pedidosObrigatorios: pedidos,
    pedidosRemovidos: [],
    riscosAceitos: [],
    ressalvasDoAdvogado: [`Resposta livre recebida: "${respostaAdvogado.slice(0, 200)}". N\u00e3o foi poss\u00edvel interpretar com seguran\u00e7a.`],
    informacoesPendentesIgnoradas: [],
    podeAvancarParaMinuta: false,
    confirmadoEm: new Date().toISOString(),
  };
}

async function interpretarConfirmacaoComIA(params: {
  pedidoId: string;
  pedido: NonNullable<Awaited<ReturnType<typeof obterPedidoDePeca>>>;
  documentos: DocumentoListItem[];
  estrategia: Record<string, unknown> | null;
  respostaAdvogado: string;
}): Promise<ConfirmacaoEstrategia> {
  const { pedido, documentos, estrategia, respostaAdvogado } = params;

  if (!isAIAvailable()) {
    return montarFallbackParcial({
      estrategia,
      respostaAdvogado,
      observacao: "IA n\u00e3o dispon\u00edvel. Confirma\u00e7\u00e3o interpretada de forma conservadora.",
    });
  }

  await syncRuntimeAIConfig();
  const { system, prompt } = construirPromptConfirmacao({ pedido, documentos, estrategia, respostaAdvogado });

  const result = await withRetry(
    async () => {
      const model = getLLM();
      const { object } = await generateObject({
        model,
        system,
        prompt,
        schema: ConfirmacaoEstrategiaAssistenteSchema,
        temperature: 0.1,
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
          `[confirmar-estrategia] tentativa ${attempt} falhou para ${params.pedidoId} \u2014 retry em ${delayMs}ms: ${msg.slice(0, 120)}`,
        );
      },
    },
  );

  if (result.ok) {
    const validated = ConfirmacaoEstrategiaAssistenteSchema.safeParse(result.data);
    if (validated.success) {
      return {
        ...validated.data,
        fonte: validated.data.fonte === "real" ? "real" : validated.data.fonte,
        observacoes: validated.data.observacoes ?? "Confirma\u00e7\u00e3o interpretada por IA com valida\u00e7\u00e3o Zod.",
      };
    }

    console.warn(`[confirmar-estrategia] IA retornou objeto inv\u00e1lido para ${params.pedidoId}:`, validated.error?.issues);
    return montarFallbackParcial({
      estrategia,
      respostaAdvogado,
      observacao: "IA retornou estrutura inv\u00e1lida. Confirma\u00e7\u00e3o conservadora aplicada.",
    });
  }

  const erro = result.lastError instanceof Error ? result.lastError.message : "Erro desconhecido";
  console.error(
    `[confirmar-estrategia] falhou definitivamente (${result.attempts} tentativas) para ${params.pedidoId}:\n`,
    result.lastError,
  );

  return montarFallbackParcial({
    estrategia,
    respostaAdvogado,
    observacao: `Erro ao chamar IA: ${erro}. Confirma\u00e7\u00e3o conservadora aplicada.`,
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
    const body = (await _req.json()) as { respostaAdvogado: string };
    const respostaAdvogado = body.respostaAdvogado?.trim() ?? "";

    if (!respostaAdvogado) {
      return jsonError(requestId, "Resposta do advogado \u00e9 obrigat\u00f3ria.", 400);
    }

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
      console.warn(`[confirmar-estrategia] sincroniza\u00e7\u00e3o do pipeline falhou para ${pedidoId}:`, syncError);
    }

    try {
      documentos = await listarDocumentos({ pedidoId: pedido.id });
      if (documentos.length === 0) {
        documentos = await listarDocumentos({ casoId: pedido.casoId });
      }
    } catch (docError) {
      console.warn(`[confirmar-estrategia] falha ao listar documentos para ${pedidoId}:`, docError);
    }

    if (!contexto) {
      try {
        const pipeline = await obterPipelineDoPedido(pedidoId);
        contexto = pipeline.contextoAtual ?? null;
      } catch {
        // Ignora
      }
    }

    // Recupera estrat\u00e9gia proposta pelo Assistente
    const estrategia = await recuperarSnapshotAssistente(pedidoId, "assistente_estrategia");

    if (!estrategia) {
      return NextResponse.json({
        requestId,
        pedidoId,
        confirmacao: null,
        mensagem: "Nenhuma estrat\u00e9gia encontrada. Execute \"Sugerir estrat\u00e9gia\" primeiro.",
        timestamp: new Date().toISOString(),
      });
    }

    const confirmacao = await interpretarConfirmacaoComIA({
      pedidoId,
      pedido,
      documentos,
      estrategia,
      respostaAdvogado,
    });

    await persistirConfirmacaoSnapshot({ pedidoId, documentos, estrategia, confirmacao });

    return NextResponse.json({
      requestId,
      pedidoId,
      confirmacao,
      totalDocumentos: documentos.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno na confirma\u00e7\u00e3o de estrat\u00e9gia.";
    console.error(`[confirmar-estrategia] erro fatal para ${pedidoId}:`, error);
    return jsonError(requestId, msg, 500);
  }
}
