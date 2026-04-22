import "server-only";

import { services } from "@/services/container";
import { listarDocumentosComDetalhes } from "@/modules/documentos/application/listarDocumentos";
import type { DocumentoComArquivoEVinculos } from "@/modules/documentos/domain/types";
import type { EtapaProcessamentoDocumental } from "@/modules/documentos/domain/types";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import type {
  ContextoJuridicoPedido,
  EtapaPipeline,
  EtapaPipelineInfo,
  HistoricoPipeline,
  SnapshotPipelineEtapa,
} from "@/modules/peticoes/domain/types";
import { processarDocumentoJuridico } from "@/modules/processamento-documental/application/processarDocumentoJuridico";
import { parallelMap } from "@/lib/parallel";
import type { ResultadoEtapaDocumental } from "@/modules/processamento-documental/domain/types";
import {
  buildMapaTesesContexto,
  existeValidacaoHumanaPendente,
} from "@/modules/peticoes/application/teses-juridicas";

const ETAPAS_IMPLEMENTADAS_PIPELINE: EtapaPipeline[] = [
  "classificacao",
  "leitura_documental",
  "extracao_de_fatos",
  "estrategia_juridica",
  "redacao",
  "revisao",
];

const ETAPAS_MOCK_CONTROLADO: EtapaPipeline[] = [
  "analise_adversa",
  "analise_documental_do_cliente",
  "pesquisa_de_apoio",
  "aprovacao",
];

const MAPA_ETAPA_DOCUMENTAL_PIPELINE: Record<EtapaProcessamentoDocumental, EtapaPipeline> = {
  leitura: "leitura_documental",
  classificacao: "classificacao",
  resumo: "redacao",
  extracao_fatos: "extracao_de_fatos",
};

function toHistoricoSnapshot(snapshot: SnapshotPipelineEtapa): HistoricoPipeline {
  const descricaoBase: Record<SnapshotPipelineEtapa["status"], string> = {
    concluido: "Snapshot persistido com sucesso.",
    em_andamento: "Etapa em processamento.",
    erro: "Etapa concluída com erro registrado.",
    mock_controlado: "Etapa mantida em mock controlado nesta fase.",
    pendente: "Etapa aguardando execução.",
  };

  return {
    id: `HIST-${snapshot.id}`,
    etapa: snapshot.etapa,
    descricao: `${snapshot.etapa.replaceAll("_", " ")}: ${descricaoBase[snapshot.status]}`,
    data: snapshot.executadoEm,
    responsavel: "Sistema",
  };
}

function toEtapaAtual(snapshots: SnapshotPipelineEtapa[]): EtapaPipeline {
  const ultimos = new Map<EtapaPipeline, SnapshotPipelineEtapa>();
  for (const snapshot of snapshots) {
    if (!ultimos.has(snapshot.etapa)) {
      ultimos.set(snapshot.etapa, snapshot);
    }
  }

  for (const etapa of ETAPAS_IMPLEMENTADAS_PIPELINE) {
    const snapshot = ultimos.get(etapa);
    if (!snapshot || snapshot.status !== "concluido") {
      return etapa;
    }
  }

  return "revisao";
}

function serializar(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializar(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${key}:${serializar(item)}`).join(",")}}`;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

function mudouSnapshot(input: {
  ultimo: SnapshotPipelineEtapa | null;
  entradaRef: Record<string, unknown>;
  saidaEstruturada: Record<string, unknown>;
  status: SnapshotPipelineEtapa["status"];
  codigoErro?: string;
  mensagemErro?: string;
}): boolean {
  if (!input.ultimo) {
    return true;
  }

  return !(
    serializar(input.ultimo.entradaRef) === serializar(input.entradaRef) &&
    serializar(input.ultimo.saidaEstruturada) === serializar(input.saidaEstruturada) &&
    input.ultimo.status === input.status &&
    (input.ultimo.codigoErro ?? "") === (input.codigoErro ?? "") &&
    (input.ultimo.mensagemErro ?? "") === (input.mensagemErro ?? "")
  );
}

async function salvarSnapshotSeMudou(input: {
  pedidoId: string;
  etapa: EtapaPipeline;
  entradaRef: Record<string, unknown>;
  saidaEstruturada: Record<string, unknown>;
  status: SnapshotPipelineEtapa["status"];
  codigoErro?: string;
  mensagemErro?: string;
}): Promise<SnapshotPipelineEtapa> {
  const infra = getPeticoesOperacionalInfra();
  const ultimo = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(input.pedidoId, input.etapa);

  if (
    ultimo &&
    !mudouSnapshot({
      ultimo,
      entradaRef: input.entradaRef,
      saidaEstruturada: input.saidaEstruturada,
      status: input.status,
      codigoErro: input.codigoErro,
      mensagemErro: input.mensagemErro,
    })
  ) {
    return ultimo;
  }

  return infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId: input.pedidoId,
    etapa: input.etapa,
    entradaRef: input.entradaRef,
    saidaEstruturada: input.saidaEstruturada,
    status: input.status,
    codigoErro: input.codigoErro,
    mensagemErro: input.mensagemErro,
    tentativa: (ultimo?.tentativa ?? 0) + 1,
  });
}

function extrairResultadosPorEtapa(
  resultados: Array<{ documento: DocumentoComArquivoEVinculos; etapas: ResultadoEtapaDocumental[] }>,
  etapaDocumental: EtapaProcessamentoDocumental,
): ResultadoEtapaDocumental[] {
  return resultados.flatMap((item) => item.etapas.filter((etapa) => etapa.etapa === etapaDocumental));
}

function consolidarClassificacao(
  resultados: Array<{ documento: DocumentoComArquivoEVinculos; etapas: ResultadoEtapaDocumental[] }>,
): Record<string, unknown> {
  const classificacoes = extrairResultadosPorEtapa(resultados, "classificacao")
    .filter((item) => item.status === "sucesso" || item.status === "parcial")
    .map((item) => toRecord(item.saida));

  return {
    totalDocumentos: resultados.length,
    classificacoes,
  };
}

function consolidarLeitura(
  resultados: Array<{ documento: DocumentoComArquivoEVinculos; etapas: ResultadoEtapaDocumental[] }>,
): Record<string, unknown> {
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

function consolidarExtracaoFatos(
  resultados: Array<{ documento: DocumentoComArquivoEVinculos; etapas: ResultadoEtapaDocumental[] }>,
): Record<string, unknown> {
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
  resultados: Array<{ documento: DocumentoComArquivoEVinculos; etapas: ResultadoEtapaDocumental[] }>,
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

function normalizarArrayString(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

async function salvarContextoSeMudou(input: {
  pedidoId: string;
  snapshots: SnapshotPipelineEtapa[];
  documentos: DocumentoComArquivoEVinculos[];
}): Promise<ContextoJuridicoPedido | null> {
  const infra = getPeticoesOperacionalInfra();
  const latestByStage = new Map<EtapaPipeline, SnapshotPipelineEtapa>();

  for (const snapshot of input.snapshots) {
    if (!latestByStage.has(snapshot.etapa)) {
      latestByStage.set(snapshot.etapa, snapshot);
    }
  }

  const extracao = latestByStage.get("extracao_de_fatos")?.saidaEstruturada ?? {};
  const estrategia = latestByStage.get("estrategia_juridica")?.saidaEstruturada ?? {};

  const fatosBrutos = Array.isArray((extracao as Record<string, unknown>).fatosRelevantes)
    ? ((extracao as Record<string, unknown>).fatosRelevantes as unknown[])
    : [];

  const fatosRelevantes = normalizarArrayString(
    fatosBrutos.map((fato) => {
      if (typeof fato === "string") {
        return fato;
      }

      if (typeof fato === "object" && fato && "descricao" in fato) {
        return String((fato as { descricao: string }).descricao);
      }

      return "";
    }),
  );

  const cronologia =
    Array.isArray((extracao as Record<string, unknown>).cronologia) &&
    (extracao as Record<string, unknown>).cronologia
      ? ((extracao as Record<string, unknown>).cronologia as Array<{ data?: string; descricao?: string; documentoId?: string }>)
          .filter((item) => !!item.data || !!item.descricao)
          .map((item) => ({
            data: item.data ?? "sem data",
            descricao: item.descricao ?? "Evento identificado na extração.",
            documentoId: item.documentoId,
          }))
      : [];

  const pontosControvertidos = normalizarArrayString((extracao as Record<string, unknown>).pontosControvertidos);

  const documentosChave = input.documentos.slice(0, 6).map((item) => ({
    documentoId: item.documento.id,
    titulo: item.documento.titulo,
    tipoDocumento: item.documento.tipoDocumento,
  }));

  const referenciasDocumentais = input.documentos.slice(0, 10).map((item) => ({
    documentoId: item.documento.id,
    titulo: item.documento.titulo,
    tipoDocumento: item.documento.tipoDocumento,
    trecho: item.documento.resumoJuridico,
  }));

  const estrategiaSugerida =
    typeof estrategia.diretriz === "string" && estrategia.diretriz.trim()
      ? estrategia.diretriz
      : "Consolidar tese principal a partir dos fatos extraídos e validar pedidos com suporte documental.";

  const ultimo = await infra.contextoJuridicoPedidoRepository.obterUltimaVersao(input.pedidoId);

  const teses = buildMapaTesesContexto({
    pedidoId: input.pedidoId,
    estrategiaSugerida,
    pontosControvertidos,
    fatosRelevantes,
    documentosRelacionados: referenciasDocumentais.map((item) => item.documentoId),
    contextoAnterior: ultimo,
  });

  const validacaoHumanaTesesPendente = existeValidacaoHumanaPendente(teses);

  const fontesSnapshot = [...latestByStage.values()]
    .filter((snapshot) => ETAPAS_IMPLEMENTADAS_PIPELINE.includes(snapshot.etapa))
    .map((snapshot) => ({ etapa: snapshot.etapa, versao: snapshot.versao }));

  const payload = {
    pedidoId: input.pedidoId,
    versaoContexto: (ultimo?.versaoContexto ?? 0) + 1,
    fatosRelevantes,
    cronologia,
    pontosControvertidos,
    documentosChave,
    referenciasDocumentais,
    estrategiaSugerida,
    teses,
    validacaoHumanaTesesPendente,
    fontesSnapshot,
  };

  if (
    ultimo &&
    serializar(ultimo.fatosRelevantes) === serializar(payload.fatosRelevantes) &&
    serializar(ultimo.cronologia) === serializar(payload.cronologia) &&
    serializar(ultimo.pontosControvertidos) === serializar(payload.pontosControvertidos) &&
    serializar(ultimo.documentosChave) === serializar(payload.documentosChave) &&
    serializar(ultimo.referenciasDocumentais) === serializar(payload.referenciasDocumentais) &&
    ultimo.estrategiaSugerida === payload.estrategiaSugerida &&
    serializar(ultimo.teses) === serializar(payload.teses) &&
    ultimo.validacaoHumanaTesesPendente === payload.validacaoHumanaTesesPendente &&
    serializar(ultimo.fontesSnapshot) === serializar(payload.fontesSnapshot)
  ) {
    return ultimo;
  }

  return infra.contextoJuridicoPedidoRepository.salvarNovaVersao(payload);
}

async function garantirSnapshotsMockControlado(pedidoId: string): Promise<void> {
  for (const etapa of ETAPAS_MOCK_CONTROLADO) {
    await salvarSnapshotSeMudou({
      pedidoId,
      etapa,
      entradaRef: { origem: "mock_controlado" },
      saidaEstruturada: {
        observacao: "Etapa visível na UX e mantida em mock controlado nesta fase operacional.",
      },
      status: "mock_controlado",
    });
  }
}

function statusPipelinePorEtapa(resultados: ResultadoEtapaDocumental[]): SnapshotPipelineEtapa["status"] {
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

export async function sincronizarPipelinePedido(pedidoId: string): Promise<{
  etapas: EtapaPipelineInfo[];
  snapshots: SnapshotPipelineEtapa[];
  historico: HistoricoPipeline[];
  etapaAtual: EtapaPipeline;
  contextoAtual: ContextoJuridicoPedido | null;
}> {
  const pedido = await services.peticoesRepository.obterPedidoPorId(pedidoId);
  if (!pedido) {
    return {
      etapas: await services.peticoesRepository.listarEtapasPipeline(),
      snapshots: [],
      historico: await services.peticoesRepository.listarHistoricoPipeline(pedidoId),
      etapaAtual: "classificacao",
      contextoAtual: null,
    };
  }

  const documentosPorPedido = await listarDocumentosComDetalhes({ pedidoId: pedido.id });
  const documentos =
    documentosPorPedido.length > 0
      ? documentosPorPedido
      : await listarDocumentosComDetalhes({ casoId: pedido.casoId });

  const resultadosProcessamentoRaw = await parallelMap(
    documentos,
    5,
    async (documento) => {
      const resultado = await processarDocumentoJuridico(documento);
      return { documento, etapas: resultado.resultados };
    },
  );

  const resultadosProcessamento = resultadosProcessamentoRaw.filter(
    (
      r,
    ): r is { documento: DocumentoComArquivoEVinculos; etapas: ResultadoEtapaDocumental[] } =>
      r !== undefined,
  );

  const consolidadoClassificacao = consolidarClassificacao(resultadosProcessamento);
  const consolidadoLeitura = consolidarLeitura(resultadosProcessamento);
  const consolidadoExtracao = consolidarExtracaoFatos(resultadosProcessamento);
  const consolidadoEstrategia = consolidarEstrategia(pedido.id, consolidadoExtracao, resultadosProcessamento);
  const consolidadoRedacao = consolidarRedacao(consolidadoEstrategia, consolidadoExtracao);
  const consolidadoRevisao = consolidarRevisao(consolidadoExtracao, consolidadoRedacao);

  const etapasExecutadas = [
    {
      etapa: "classificacao",
      saida: consolidadoClassificacao,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "classificacao"),
    },
    {
      etapa: "leitura_documental",
      saida: consolidadoLeitura,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "leitura"),
    },
    {
      etapa: "extracao_de_fatos",
      saida: consolidadoExtracao,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "extracao_fatos"),
    },
    {
      etapa: "estrategia_juridica",
      saida: consolidadoEstrategia,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "classificacao"),
    },
    {
      etapa: "redacao",
      saida: consolidadoRedacao,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "resumo"),
    },
    {
      etapa: "revisao",
      saida: consolidadoRevisao,
      resultados: extrairResultadosPorEtapa(resultadosProcessamento, "extracao_fatos"),
    },
  ] satisfies Array<{
    etapa: EtapaPipeline;
    saida: Record<string, unknown>;
    resultados: ResultadoEtapaDocumental[];
  }>;

  for (const etapa of etapasExecutadas) {
    const etapaDocumental =
      etapa.etapa === "classificacao"
        ? "classificacao"
        : etapa.etapa === "leitura_documental"
          ? "leitura"
          : etapa.etapa === "extracao_de_fatos"
            ? "extracao_fatos"
            : etapa.etapa === "redacao"
              ? "resumo"
              : "classificacao";

    const erroEtapa = etapa.resultados.find((resultado) => resultado.status === "falha");

    await salvarSnapshotSeMudou({
      pedidoId: pedido.id,
      etapa: etapa.etapa,
      entradaRef: {
        pedidoId: pedido.id,
        etapaDocumental,
        mapaEtapas: MAPA_ETAPA_DOCUMENTAL_PIPELINE,
      },
      saidaEstruturada: etapa.saida,
      status: statusPipelinePorEtapa(etapa.resultados),
      codigoErro: erroEtapa?.codigoErro,
      mensagemErro: erroEtapa?.mensagemErro,
    });
  }

  await garantirSnapshotsMockControlado(pedido.id);

  const infra = getPeticoesOperacionalInfra();
  const snapshots = await infra.pipelineSnapshotRepository.listarPorPedido(pedido.id);
  const contextoAtual = await salvarContextoSeMudou({
    pedidoId: pedido.id,
    snapshots,
    documentos,
  });

  const snapshotsAtualizados = await infra.pipelineSnapshotRepository.listarPorPedido(pedido.id);
  const historicoPersistido = snapshotsAtualizados.map(toHistoricoSnapshot);
  const historicoLegado = await services.peticoesRepository.listarHistoricoPipeline(pedido.id);

  const historico = [...historicoPersistido, ...historicoLegado].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );

  return {
    etapas: await services.peticoesRepository.listarEtapasPipeline(),
    snapshots: snapshotsAtualizados,
    historico,
    etapaAtual: toEtapaAtual(snapshotsAtualizados),
    contextoAtual,
  };
}
