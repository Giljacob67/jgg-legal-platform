import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

export type TipoPeca =
  | "Petição inicial"
  | "Contestação"
  | "Manifestação"
  | "Embargos à execução"
  | "Apelação cível"
  | "Recurso especial cível"
  | "Réplica"
  | "Recurso";

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

export type StatusSnapshotPipeline = "pendente" | "em_andamento" | "concluido" | "erro" | "mock_controlado";

export interface SnapshotPipelineEtapa {
  id: string;
  pedidoId: string;
  etapa: EtapaPipeline;
  versao: number;
  entradaRef: Record<string, unknown>;
  saidaEstruturada: Record<string, unknown>;
  status: StatusSnapshotPipeline;
  executadoEm: string;
  codigoErro?: string;
  mensagemErro?: string;
  tentativa: number;
}

export interface ReferenciaDocumentalContexto {
  documentoId: string;
  titulo: string;
  tipoDocumento: string;
  trecho?: string;
}

export interface ContextoJuridicoPedido {
  id: string;
  pedidoId: string;
  versaoContexto: number;
  fatosRelevantes: string[];
  cronologia: Array<{ data: string; descricao: string; documentoId?: string }>;
  pontosControvertidos: string[];
  documentosChave: Array<{ documentoId: string; titulo: string; tipoDocumento: string }>;
  referenciasDocumentais: ReferenciaDocumentalContexto[];
  estrategiaSugerida: string;
  fontesSnapshot: Array<{ etapa: EtapaPipeline; versao: number }>;
  criadoEm: string;
}

export interface VersaoMinuta {
  id: string;
  numero: number;
  criadoEm: string;
  autor: string;
  resumoMudancas: string;
  conteudo: string;
  contextoVersaoOrigem?: number;
  templateIdOrigem?: string;
  templateNomeOrigem?: string;
  templateVersaoOrigem?: number;
  tipoPecaCanonicaOrigem?: TipoPecaCanonica;
  materiaCanonicaOrigem?: MateriaCanonica;
  referenciasDocumentaisOrigem?: string[];
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
