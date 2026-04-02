import type { EtapaProcessamentoDocumental, StatusExecucaoEtapa } from "@/modules/documentos/domain/types";

export type EtapaProcessamentoDocumentalImplementada = EtapaProcessamentoDocumental;

export interface FatoRelevante {
  descricao: string;
  trechoBase: string;
  documentoId: string;
  dataReferencia?: string;
}

export interface EventoCronologico {
  data: string;
  descricao: string;
  documentoId: string;
}

export interface ResultadoLeituraDocumental {
  textoExtraido?: string;
  textoNormalizado?: string;
  observacao: string;
}

export interface ResultadoClassificacaoDocumental {
  classePrincipal: string;
  confianca: number;
  justificativa: string;
}

export interface ResultadoResumoDocumental {
  resumo: string;
  palavrasChave: string[];
}

export interface ResultadoExtracaoFatos {
  fatosRelevantes: FatoRelevante[];
  cronologia: EventoCronologico[];
  pontosControvertidos: string[];
}

export type SaidaEtapaDocumental =
  | ResultadoLeituraDocumental
  | ResultadoClassificacaoDocumental
  | ResultadoResumoDocumental
  | ResultadoExtracaoFatos;

export interface ResultadoEtapaDocumental {
  etapa: EtapaProcessamentoDocumentalImplementada;
  status: StatusExecucaoEtapa;
  tentativa: number;
  saida: SaidaEtapaDocumental;
  codigoErro?: string;
  mensagemErro?: string;
}

export interface ResultadoProcessamentoDocumento {
  documentoId: string;
  resultados: ResultadoEtapaDocumental[];
}
