import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getRequestId, jsonError } from "@/lib/api-response";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { obterPipelineDoPedido } from "@/modules/peticoes/application/obterPipelineDoPedido";
import { sincronizarPipelinePedido } from "@/modules/peticoes/application/operacional/sincronizarPipelinePedido";
import { isAIAvailable } from "@/lib/ai/provider";
import { generateText } from "ai";
import { getLLM } from "@/lib/ai/provider";
import { syncRuntimeAIConfig } from "@/lib/ai/runtime-config";
import { listarDocumentos } from "@/modules/documentos/application/listarDocumentos";
import type { DocumentoListItem } from "@/modules/documentos/domain/types";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";

export const maxDuration = 120;

type DiagnosticoDocumental = {
  fonte: "real" | "parcial" | "simulado";
  documentosAnalisados: Array<{
    id: string;
    titulo: string;
    tipo: string;
    status: string;
    fatosExtraidos?: string[];
  }>;
  tipoAcaoProvavel: string;
  parteRepresentada: string;
  pecaCabivelSugerida: string;
  fatosRelevantes: string[];
  pontosControvertidos: string[];
  riscosFragilidades: string[];
  documentosFaltantes: string[];
  perguntasMinimasAdvogado: string[];
  proximaAcaoRecomendada: string;
  observacao?: string;
};

function extrairFatosDoContexto(
  contexto: ContextoJuridicoPedido | null,
): { fatos: string[]; controvertidos: string[]; riscos: string[] } {
  const fatos = contexto?.fatosRelevantes ?? [];
  const controvertidos = contexto?.dossieJuridico?.contextoDoCaso?.pontosControvertidos ?? [];
  const riscos =
    contexto?.dossieJuridico?.analiseAdversa?.riscosProcessuais ?? [];
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
        `${i + 1}. ${d.titulo} (${d.tipo}) — status: ${d.status}${d.resumo ? `\n   Resumo: ${d.resumo}` : ""}`,
    )
    .join("\n");

  const fatos = contexto?.fatosRelevantes?.join("\n- ") ?? "Nenhum fato extraído ainda.";

  const system = `Você é um assistente jurídico sênior de análise documental. Analise os documentos do caso e produza um diagnóstico estruturado em português-BR. Seja preciso, técnico e prático. Responda apenas com o JSON no formato solicitado, sem markdown.`;

  const prompt = `CASO: ${pedido.casoId}\nTIPO DE PEÇA PREVISTO: ${pedido.tipoPeca}\nINTENÇÃO PROCESSUAL: ${pedido.intencaoProcessual ?? "Não informada"}\n\nDOCUMENTOS VINCULADOS:\n${docsTexto}\n\nFATOS RELEVANTES JÁ IDENTIFICADOS:\n- ${fatos}\n\nTarefa: produza um diagnóstico documental completo com os seguintes campos em JSON:\n{\n  "tipoAcaoProvavel": "descreva a ação judicial ou medida mais provável",\n  "parteRepresentada": "ativo, passivo ou indefinido — justifique em uma frase",\n  "pecaCabivelSugerida": "nome da peça jurídica mais adequada",\n  "fatosRelevantes": ["fato 1", "fato 2", ...],\n  "pontosControvertidos": ["ponto 1", "ponto 2", ...],\n  "riscosFragilidades": ["risco 1", "risco 2", ...],\n  "documentosFaltantes": ["documento 1", "documento 2", ...],\n  "perguntasMinimasAdvogado": ["pergunta 1", "pergunta 2", ...],\n  "proximaAcaoRecomendada": "descreva a próxima ação operacional recomendada"\n}`;

  return { system, prompt };
}

async function gerarDiagnosticoReal(params: {
  pedidoId: string;
  pedido: NonNullable<Awaited<ReturnType<typeof obterPedidoDePeca>>>;
  documentos: DocumentoListItem[];
  contexto: ContextoJuridicoPedido | null;
}): Promise<DiagnosticoDocumental> {
  const { pedido, documentos, contexto } = params;

  const { fatos, controvertidos, riscos } = extrairFatosDoContexto(contexto);

  if (!isAIAvailable()) {
    return {
      fonte: "parcial",
      observacao: "Diagnóstico derivado de dados existentes do pipeline. IA não disponível para enriquecimento.",
      documentosAnalisados: documentos.map((d) => ({
        id: d.id,
        titulo: d.titulo,
        tipo: d.tipo,
        status: d.status,
        fatosExtraidos: d.resumo ? [d.resumo] : undefined,
      })),
      tipoAcaoProvavel: `Ação relacionada a ${pedido.tipoPeca}`,
      parteRepresentada: "Indefinido — requer análise do contrato e do polo processual.",
      pecaCabivelSugerida: pedido.tipoPeca,
      fatosRelevantes: fatos.length > 0 ? fatos : ["Nenhum fato estruturado disponível. Execute o pipeline de extração de fatos."],
      pontosControvertidos: controvertidos.length > 0
        ? controvertidos
        : ["Nenhum ponto controvertido identificado pelo pipeline até o momento."],
      riscosFragilidades: riscos.length > 0
        ? riscos
        : ["Riscos não avaliados. Execute o estágio de análise adversa no pipeline."],
      documentosFaltantes: ["Comprovação de vínculo", "Documento de identidade da parte contrária", "Laudo técnico se aplicável"],
      perguntasMinimasAdvogado: [
        "Qual o objetivo processual exato do cliente?",
        "Existe documentação adicional não anexada?",
        "Há prazo prescricional ou decadencial em risco?",
      ],
      proximaAcaoRecomendada: "Executar o pipeline de extração de fatos ou aguardar processamento documental.",
    };
  }

  await syncRuntimeAIConfig();
  const model = getLLM();
  const { system, prompt } = construirPromptAnaliseDocumental({ pedido, documentos, contexto });

  try {
    const { text } = await generateText({
      model,
      system,
      prompt,
      temperature: 0.2,
      maxOutputTokens: 3000,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as Partial<Omit<DiagnosticoDocumental, "fonte" | "documentosAnalisados" | "observacao">>) : null;

    return {
      fonte: parsed ? "real" : "parcial",
      observacao: parsed
        ? "Diagnóstico enriquecido por IA com base nos documentos e contexto do pipeline."
        : "IA respondeu, mas não retornou JSON estruturado. Diagnóstico parcial derivado de dados existentes.",
      documentosAnalisados: documentos.map((d) => ({
        id: d.id,
        titulo: d.titulo,
        tipo: d.tipo,
        status: d.status,
        fatosExtraidos: d.resumo ? [d.resumo] : undefined,
      })),
      tipoAcaoProvavel: parsed?.tipoAcaoProvavel ?? `Ação relacionada a ${pedido.tipoPeca}`,
      parteRepresentada: parsed?.parteRepresentada ?? "Indefinido",
      pecaCabivelSugerida: parsed?.pecaCabivelSugerida ?? pedido.tipoPeca,
      fatosRelevantes: parsed?.fatosRelevantes ?? fatos,
      pontosControvertidos: parsed?.pontosControvertidos ?? controvertidos,
      riscosFragilidades: parsed?.riscosFragilidades ?? riscos,
      documentosFaltantes: parsed?.documentosFaltantes ?? ["Comprovação de vínculo", "Documento de identidade da parte contrária"],
      perguntasMinimasAdvogado: parsed?.perguntasMinimasAdvogado ?? [
        "Qual o objetivo processual exato do cliente?",
        "Existe documentação adicional não anexada?",
      ],
      proximaAcaoRecomendada:
        parsed?.proximaAcaoRecomendada ?? "Executar o pipeline de extração de fatos.",
    };
  } catch {
    return {
      fonte: "parcial",
      observacao: "Erro ao chamar IA para análise documental. Diagnóstico derivado de dados existentes do pipeline.",
      documentosAnalisados: documentos.map((d) => ({
        id: d.id,
        titulo: d.titulo,
        tipo: d.tipo,
        status: d.status,
        fatosExtraidos: d.resumo ? [d.resumo] : undefined,
      })),
      tipoAcaoProvavel: `Ação relacionada a ${pedido.tipoPeca}`,
      parteRepresentada: "Indefinido",
      pecaCabivelSugerida: pedido.tipoPeca,
      fatosRelevantes: fatos.length > 0 ? fatos : ["Nenhum fato estruturado disponível."],
      pontosControvertidos: controvertidos.length > 0
        ? controvertidos
        : ["Nenhum ponto controvertido identificado."],
      riscosFragilidades: riscos.length > 0 ? riscos : ["Riscos não avaliados."],
      documentosFaltantes: ["Comprovação de vínculo", "Documento de identidade da parte contrária"],
      perguntasMinimasAdvogado: [
        "Qual o objetivo processual exato do cliente?",
        "Existe documentação adicional não anexada?",
      ],
      proximaAcaoRecomendada: "Executar o pipeline de extração de fatos.",
    };
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
      return jsonError(requestId, "Pedido não encontrado.", 404);
    }

    let contexto: ContextoJuridicoPedido | null = null;
    let documentos: DocumentoListItem[] = [];

    try {
      const pipelineSync = await sincronizarPipelinePedido(pedidoId);
      contexto = pipelineSync.contextoAtual;
    } catch (syncError) {
      console.warn(`[analisar-documentos] sincronização do pipeline falhou para ${pedidoId}:`, syncError);
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

    const diagnostico = await gerarDiagnosticoReal({ pedidoId, pedido, documentos, contexto });

    return NextResponse.json({
      requestId,
      pedidoId,
      diagnostico,
      totalDocumentos: documentos.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno na análise documental.";
    console.error(`[analisar-documentos] erro fatal para ${pedidoId}:`, error);
    return jsonError(requestId, msg, 500);
  }
}
