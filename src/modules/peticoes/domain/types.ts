export type TipoPeca = "Petição inicial" | "Contestação" | "Réplica" | "Recurso" | "Manifestação";

export type PrioridadePedido = "baixa" | "média" | "alta";

export type StatusPedido = "em triagem" | "em produção" | "em revisão" | "aprovado";

export type EtapaPipeline =
  | "classificacao"
  | "leitura_documental"
  | "extracao_de_fatos"
  | "analise_adversa"
  | "analise_documental_do_cliente"
  | "estrategia_juridica"
  | "pesquisa_de_apoio"
  | "redacao"
  | "revisao"
  | "aprovacao";

export interface EtapaPipelineInfo {
  id: EtapaPipeline;
  nome: string;
  priorizadaMvp: boolean;
}

export interface PedidoDePeca {
  id: string;
  casoId: string;
  titulo: string;
  tipoPeca: TipoPeca;
  prioridade: PrioridadePedido;
  status: StatusPedido;
  etapaAtual: EtapaPipeline;
  responsavel: string;
  prazoFinal: string;
  criadoEm: string;
}

export interface HistoricoPipeline {
  id: string;
  etapa: EtapaPipeline;
  descricao: string;
  data: string;
  responsavel: string;
}

export interface VersaoMinuta {
  id: string;
  numero: number;
  criadoEm: string;
  autor: string;
  resumoMudancas: string;
  conteudo: string;
}

export interface Minuta {
  id: string;
  pedidoId: string;
  titulo: string;
  conteudoAtual: string;
  versoes: VersaoMinuta[];
}

export interface NovoPedidoPayload {
  casoId: string;
  titulo: string;
  tipoPeca: TipoPeca;
  prioridade: PrioridadePedido;
  prazoFinal: string;
}
