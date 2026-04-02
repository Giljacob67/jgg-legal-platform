import { services } from "@/services/container";
import type { EtapaPipelineInfo, HistoricoPipeline } from "@/modules/peticoes/domain/types";

export function obterPipelineDoPedido(pedidoId: string): {
  etapas: EtapaPipelineInfo[];
  historico: HistoricoPipeline[];
} {
  return {
    etapas: services.peticoesRepository.listarEtapasPipeline(),
    historico: services.peticoesRepository.listarHistoricoPipeline(pedidoId),
  };
}
