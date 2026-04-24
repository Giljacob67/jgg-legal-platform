export type TipoMensagemAssistente =
  | "usuario"
  | "sistema"
  | "acao"
  | "diagnostico"
  | "minuta"
  | "alerta";

export interface MensagemAssistente {
  id: string;
  tipo: TipoMensagemAssistente;
  conteudo: string;
  titulo?: string;
  acaoId?: string;
  timestamp: string;
}

export type AcaoRapidaId =
  | "analisar-documentos"
  | "identificar-peca"
  | "gerar-diagnostico"
  | "sugerir-estrategia"
  | "redigir-minuta"
  | "revisar-peca";

export interface AcaoRapida {
  id: AcaoRapidaId;
  titulo: string;
  descricao: string;
  icone: string;
}

export interface ContextoCasoAssistente {
  cliente: string;
  casoId: string;
  tipoPeca: string;
  materia: string;
  polo: string;
  prazoFinal: string;
  responsavel: string;
  status: string;
}
