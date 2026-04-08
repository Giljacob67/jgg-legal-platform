import "server-only";

import { services } from "@/services/container";
import { listarDocumentosComDetalhes } from "@/modules/documentos/application/listarDocumentos";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import type {
  ContextoJuridicoPedido,
  EtapaPipeline,
  EtapaPipelineInfo,
  HistoricoPipeline,
  SnapshotPipelineEtapa,
} from "@/modules/peticoes/domain/types";
import {
  montarEtapasConsolidadas,
  processarDocumentosComConcorrencia,
  statusPipelinePorEtapa,
} from "./pipeline/document-processing";
import { salvarContextoSeMudou } from "./pipeline/contexto-persistence";
import {
  garantirSnapshotsMockControlado,
  salvarSnapshotSeMudou,
  toEtapaAtual,
  toHistoricoSnapshot,
} from "./pipeline/snapshot-persistence";
import { MAPA_ETAPA_DOCUMENTAL_PIPELINE } from "./pipeline/pipeline-constants";

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

  const resultadosProcessamento = await processarDocumentosComConcorrencia(documentos, 4);
  const etapasExecutadas = montarEtapasConsolidadas(pedido.id, resultadosProcessamento);

  for (const etapa of etapasExecutadas) {
    const erroEtapa = etapa.resultados.find((resultado) => resultado.status === "falha");

    await salvarSnapshotSeMudou({
      pedidoId: pedido.id,
      etapa: etapa.etapa,
      entradaRef: {
        pedidoId: pedido.id,
        etapaDocumental: etapa.etapaDocumental,
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
