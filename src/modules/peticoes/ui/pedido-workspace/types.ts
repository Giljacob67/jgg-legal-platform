import type { ContextoJuridicoPedido, DossieJuridicoPedido, EtapaPipeline, HistoricoPipeline, Minuta, PedidoDePeca, SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";
import type { DocumentoListItem } from "@/modules/documentos/domain/types";
import type { ProntidaoAprovacao } from "@/modules/peticoes/application/avaliarProntidaoAprovacao";
import type { PainelInteligenciaJuridica } from "@/modules/peticoes/inteligencia-juridica/domain/types";

export type SecaoPedidoId =
  | "resumo"
  | "briefing"
  | "documentos"
  | "fatos-provas"
  | "analise-adversa"
  | "estrategia"
  | "teses"
  | "estrutura-peca"
  | "minuta"
  | "revisao-auditoria"
  | "assistente";

export interface SecaoPedidoMeta {
  id: SecaoPedidoId;
  titulo: string;
  descricao: string;
}

export interface PedidoWorkspaceData {
  pedido: PedidoDePeca;
  minuta: Minuta | null;
  contextoAtual: ContextoJuridicoPedido | null;
  dossie: DossieJuridicoPedido | null;
  documentos: DocumentoListItem[];
  historico: HistoricoPipeline[];
  snapshots: SnapshotPipelineEtapa[];
  etapaAtual: EtapaPipeline;
  prontidaoAprovacao?: ProntidaoAprovacao;
  inteligenciaJuridica?: PainelInteligenciaJuridica | null;
  percentualConclusao: number;
  diasRestantes: number;
  responsavelDefinido: boolean;
  proximaAcao?: { titulo: string; descricao: string; href: string; label: string };
}
