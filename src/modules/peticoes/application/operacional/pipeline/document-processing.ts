import type { DocumentoComArquivoEVinculos, EtapaProcessamentoDocumental } from "@/modules/documentos/domain/types";
import type { EtapaPipeline, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";
import type { ResultadoEtapaDocumental } from "@/modules/processamento-documental/domain/types";

export type ResultadoProcessamentoDocumento = {
  documento: DocumentoComArquivoEVinculos;
  etapas: ResultadoEtapaDocumental[];
};

export type EtapaConsolidada = {
  etapa: EtapaPipeline;
  etapaDocumental: EtapaProcessamentoDocumental;
  saida: Record<string, unknown>;
  resultados: ResultadoEtapaDocumental[];
};

export async function processarDocumentosComConcorrencia(
  documentos: DocumentoComArquivoEVinculos[],
  limiteConcorrencia = 4,
): Promise<ResultadoProcessamentoDocumento[]> {
  if (documentos.length === 0) {
    return [];
  }

  const resultados: ResultadoProcessamentoDocumento[] = [];
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limiteConcorrencia, documentos.length) }, async () => {
    while (cursor < documentos.length) {
      const indexAtual = cursor;
      cursor += 1;

      const documento = documentos[indexAtual];
      const { processarDocumentoJuridico } = await import(
        "@/modules/processamento-documental/application/processarDocumentoJuridico"
      );
      const resultado = await processarDocumentoJuridico(documento);
      resultados.push({ documento, etapas: resultado.resultados });
    }
  });

  await Promise.all(workers);
  return resultados;
}

export function extrairResultadosPorEtapa(
  resultados: ResultadoProcessamentoDocumento[],
  etapaDocumental: EtapaProcessamentoDocumental,
): ResultadoEtapaDocumental[] {
  return resultados.flatMap((item) => item.etapas.filter((etapa) => etapa.etapa === etapaDocumental));
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

function consolidarClassificacao(resultados: ResultadoProcessamentoDocumento[]): Record<string, unknown> {
  const classificacoes = extrairResultadosPorEtapa(resultados, "classificacao")
    .filter((item) => item.status === "sucesso" || item.status === "parcial")
    .map((item) => toRecord(item.saida));

  return {
    totalDocumentos: resultados.length,
    classificacoes,
  };
}

function consolidarLeitura(resultados: ResultadoProcessamentoDocumento[]): Record<string, unknown> {
  const leituras = extrairResultadosPorEtapa(resultados, "leitura");
  const documentosLidos = leituras.filter(
    (item) => item.status === "sucesso" || item.status === "parcial",
  ).length;

  return {
    totalDocumentos: resultados.length,
    documentosLidos,
    coberturaLeitura: resultados.length > 0 ? Number((documentosLidos / resultados.length).toFixed(2)) : 0,
  };
}

function consolidarExtracaoFatos(resultados: ResultadoProcessamentoDocumento[]): Record<string, unknown> {
  const extracoes = extrairResultadosPorEtapa(resultados, "extracao_fatos");
  const fatosRelevantes = extracoes.flatMap(
    (item) => (toRecord(item.saida).fatosRelevantes as unknown[]) ?? [],
  );
  const cronologia = extracoes.flatMap(
    (item) => (toRecord(item.saida).cronologia as unknown[]) ?? [],
  );
  const pontosControvertidos = extracoes.flatMap(
    (item) => (toRecord(item.saida).pontosControvertidos as unknown[]) ?? [],
  );

  return {
    fatosRelevantes,
    cronologia,
    pontosControvertidos,
  };
}

function consolidarEstrategia(
  pedidoId: string,
  extracao: Record<string, unknown>,
  resultados: ResultadoProcessamentoDocumento[],
): Record<string, unknown> {
  const pontos = Array.isArray(extracao.pontosControvertidos) ? extracao.pontosControvertidos.length : 0;
  const fatos = Array.isArray(extracao.fatosRelevantes) ? extracao.fatosRelevantes.length : 0;

  return {
    pedidoId,
    diretriz:
      "Priorizar narrativa cronológica dos fatos, reforço documental e pedidos com base no risco concreto.",
    totalPontosControvertidos: pontos,
    totalFatosRelevantes: fatos,
    coberturaDocumental: resultados.length,
  };
}

function consolidarRedacao(
  estrategia: Record<string, unknown>,
  extracao: Record<string, unknown>,
): Record<string, unknown> {
  return {
    orientacaoRedacao:
      "Estruturar minuta por fatos, fundamentos e pedidos, citando referências documentais por ID.",
    estrategiaBase: estrategia.diretriz,
    totalFatosRelevantes: Array.isArray(extracao.fatosRelevantes) ? extracao.fatosRelevantes.length : 0,
  };
}

function consolidarRevisao(
  extracao: Record<string, unknown>,
  redacao: Record<string, unknown>,
): Record<string, unknown> {
  const pendencias: string[] = [];
  if (!Array.isArray(extracao.fatosRelevantes) || extracao.fatosRelevantes.length === 0) {
    pendencias.push("Sem fatos relevantes consolidados para validação final.");
  }

  if (!redacao.orientacaoRedacao) {
    pendencias.push("Orientação de redação não foi consolidada.");
  }

  return {
    checklistRevisao: [
      "Validar aderência entre narrativa fática e pedidos.",
      "Conferir referências documentais citadas na minuta.",
      "Revisar consistência terminológica e fundamento jurídico.",
    ],
    pendencias,
  };
}

export function montarEtapasConsolidadas(
  pedidoId: string,
  resultadosProcessamento: ResultadoProcessamentoDocumento[],
): EtapaConsolidada[] {
  const consolidadoClassificacao = consolidarClassificacao(resultadosProcessamento);
  const consolidadoLeitura = consolidarLeitura(resultadosProcessamento);
  const consolidadoExtracao = consolidarExtracaoFatos(resultadosProcessamento);
  const consolidadoEstrategia = consolidarEstrategia(pedidoId, consolidadoExtracao, resultadosProcessamento);
  const consolidadoRedacao = consolidarRedacao(consolidadoEstrategia, consolidadoExtracao);
  const consolidadoRevisao = consolidarRevisao(consolidadoExtracao, consolidadoRedacao);

  return [
    {
      etapa: "classificacao",
      etapaDocumental: "classificacao",
      saida: consolidadoClassificacao,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "classificacao"),
    },
    {
      etapa: "leitura_documental",
      etapaDocumental: "leitura",
      saida: consolidadoLeitura,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "leitura"),
    },
    {
      etapa: "extracao_de_fatos",
      etapaDocumental: "extracao_fatos",
      saida: consolidadoExtracao,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "extracao_fatos"),
    },
    {
      etapa: "estrategia_juridica",
      etapaDocumental: "classificacao",
      saida: consolidadoEstrategia,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "classificacao"),
    },
    {
      etapa: "redacao",
      etapaDocumental: "resumo",
      saida: consolidadoRedacao,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "resumo"),
    },
    {
      etapa: "revisao",
      etapaDocumental: "extracao_fatos",
      saida: consolidadoRevisao,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "extracao_fatos"),
    },
  ];
}

export function statusPipelinePorEtapa(resultados: ResultadoEtapaDocumental[]): SnapshotPipelineEtapa["status"] {
  if (resultados.length === 0) {
    return "pendente";
  }

  if (resultados.some((item) => item.status === "falha")) {
    return "erro";
  }

  if (resultados.every((item) => item.status === "sucesso" || item.status === "parcial")) {
    return "concluido";
  }

  return "pendente";
}
