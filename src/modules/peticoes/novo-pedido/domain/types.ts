import type { Caso, PoloRepresentado } from "@/modules/casos/domain/types";
import type { IntencaoProcessual, NovoPedidoPayload, PrioridadePedido, TipoPeca } from "@/modules/peticoes/domain/types";

export type EtapaNovoPedidoWizard =
  | "caso_contexto"
  | "objetivo_juridico"
  | "estrategia_inicial"
  | "documentos_provas"
  | "revisao_criacao";

export type CategoriaObjetivoJuridico =
  | "responder_parte_contraria"
  | "iniciar_medida"
  | "recorrer_decisao"
  | "analisar_cenario"
  | "peticao_personalizada";

export type NivelUrgenciaPedido = "baixa" | "moderada" | "alta" | "critica";

export type SeveridadePendencia = "baixa" | "media" | "alta";

export type OrigemEvidencia = "inferido" | "confirmado" | "faltando";

export interface BriefingNovoPedido {
  casoId: string;
  tituloCaso: string;
  cliente: string;
  materia: string;
  tribunal: string;
  poloInferido: PoloRepresentado;
  contextoFatico: string;
  observacoesOperacionais: string;
}

export interface ObjetivoJuridicoNovoPedido {
  categoria: CategoriaObjetivoJuridico | null;
  intencaoSelecionada: IntencaoProcessual | "";
  intencaoLivre: string;
}

export interface UrgenciaNovoPedido {
  nivel: NivelUrgenciaPedido;
  justificativa: string;
  diasRestantes?: number;
}

export interface EstrategiaInicialNovoPedido {
  tipoPecaSugerida: TipoPeca | null;
  tipoPecaConfirmada: TipoPeca | null;
  prioridadeSugerida: PrioridadePedido;
  prioridadeConfirmada: PrioridadePedido | null;
  urgencia: UrgenciaNovoPedido;
  resumoInferido: string;
  alertas: string[];
  proximasProvidencias: string[];
}

export interface DocumentoSelecionadoNovoPedido {
  id: string;
  nome: string;
  tamanhoBytes: number;
  mimeType: string;
}

export interface PendenciaNovoPedido {
  codigo: string;
  titulo: string;
  descricao: string;
  severidade: SeveridadePendencia;
  etapaRelacionada: EtapaNovoPedidoWizard;
}

export interface EvidenciaRevisaoNovoPedido {
  id: string;
  label: string;
  valor: string;
  origem: OrigemEvidencia;
}

export interface RevisaoNovoPedido {
  inferido: EvidenciaRevisaoNovoPedido[];
  confirmado: EvidenciaRevisaoNovoPedido[];
  faltando: EvidenciaRevisaoNovoPedido[];
}

export interface ConfirmacaoCriacaoNovoPedido {
  confirmadoPeloUsuario: boolean;
  observacoesFinais: string;
}

export interface NovoPedidoWizardDraft {
  caso: Caso | null;
  briefing: BriefingNovoPedido;
  objetivo: ObjetivoJuridicoNovoPedido;
  estrategia: EstrategiaInicialNovoPedido;
  documentos: DocumentoSelecionadoNovoPedido[];
  pendencias: PendenciaNovoPedido[];
  revisao: RevisaoNovoPedido;
  confirmacao: ConfirmacaoCriacaoNovoPedido;
}

export interface SugestaoTriagemWizard {
  poloDetectado: PoloRepresentado;
  justificativaPolo: string;
  tipoPecaClassificado: TipoPeca | null;
  intencaoDetectada: IntencaoProcessual | "";
  prioridade: PrioridadePedido;
  prazoSugerido: string;
  responsavelSugerido: string;
  resumoJustificativa: string;
  alertas: string[];
  pontosVulneraveisAdverso: string[];
  etapaInicial: string;
  modo: "ai" | "mock";
}

export interface ResultadoCriacaoNovoPedido {
  pedidoId: string;
  titulo: string;
  uploadEfetuado: number;
}

export type PayloadCriacaoWizard = NovoPedidoPayload & {
  contextoFatico: string;
  observacoesOperacionais?: string;
};
