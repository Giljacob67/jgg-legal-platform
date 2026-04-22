import type {
  EtapaPipelineInfo,
  HistoricoPipeline,
  Minuta,
  NovoPedidoPayload,
  PedidoDePeca,
  EtapaPipeline,
  StatusPedido,
  TipoPeca,
} from "@/modules/peticoes/domain/types";

export interface PeticoesRepository {
  listarPedidos(): Promise<PedidoDePeca[]>;
  obterPedidoPorId(pedidoId: string): Promise<PedidoDePeca | undefined>;
  listarEtapasPipeline(): Promise<EtapaPipelineInfo[]>;
  listarHistoricoPipeline(pedidoId: string): Promise<HistoricoPipeline[]>;
  obterMinutaPorId(minutaId: string): Promise<Minuta | undefined>;
  obterMinutaPorPedidoId(pedidoId: string): Promise<Minuta | undefined>;
  criarPedidoDePeca(payload: NovoPedidoPayload): Promise<PedidoDePeca>;
  simularCriacaoPedido(payload: NovoPedidoPayload): Promise<PedidoDePeca>;
  atualizarResponsavel(pedidoId: string, responsavel: string): Promise<PedidoDePeca | undefined>;
  atualizarFluxoPedido(
    pedidoId: string,
    input: { status: StatusPedido; etapaAtual: EtapaPipeline },
  ): Promise<PedidoDePeca | undefined>;
  listarTiposPeca(): Promise<TipoPeca[]>;
}
