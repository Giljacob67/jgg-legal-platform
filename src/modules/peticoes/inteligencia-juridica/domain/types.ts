import type { BlocoMinutaId, MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import type { ContextoJuridicoPedido, Minuta } from "@/modules/peticoes/domain/types";

export type TipoGatilhoTese =
  | "palavra_chave"
  | "padrao_textual"
  | "ponto_controvertido"
  | "estrategia"
  | "referencia_documental";

export interface GatilhoTese {
  id: string;
  tipo: TipoGatilhoTese;
  valor: string;
  peso: number;
}

export interface TeseJuridicaCatalogo {
  id: string;
  titulo: string;
  tipoPecaCanonica: TipoPecaCanonica[];
  materias: MateriaCanonica[];
  palavrasChave: string[];
  gatilhos: GatilhoTese[];
  teseBase: string;
  fundamentoSintetico: string;
}

export interface GatilhoAcionado {
  gatilhoId: string;
  tipo: TipoGatilhoTese;
  valor: string;
  peso: number;
}

export interface AvaliacaoTese {
  teseId: string;
  titulo: string;
  scoreAderencia: number;
  justificativa: string;
  lacunas: string[];
  gatilhosAcionados: GatilhoAcionado[];
}

export type CategoriaChecklist = "obrigatorio" | "recomendavel";

export interface ChecklistItem {
  id: string;
  descricao: string;
  tipoPecaCanonica: TipoPecaCanonica[];
  categoria: CategoriaChecklist;
  blocoEsperado: BlocoMinutaId | "geral";
  tokensEsperados: string[];
}

export interface ChecklistItemAvaliado {
  itemId: string;
  descricao: string;
  categoria: CategoriaChecklist;
  status: "atendido" | "pendente";
  evidencia?: string;
}

export interface ChecklistAvaliado {
  obrigatorios: ChecklistItemAvaliado[];
  recomendaveis: ChecklistItemAvaliado[];
  coberturaObrigatoria: number;
  coberturaRecomendavel: number;
}

export type CodigoAlertaJuridico = "AJ-001" | "AJ-002" | "AJ-003" | "AJ-004";

export interface AlertaJuridico {
  codigo: CodigoAlertaJuridico;
  tipo:
    | "ausencia_documentos"
    | "fatos_nao_utilizados"
    | "inconsistencia_tipo_peca"
    | "contexto_incompleto";
  severidade: "alta" | "media" | "baixa";
  mensagem: string;
  recomendacao: string;
}

export interface PesosScoreQualidade {
  checklistObrigatorio: number;
  checklistRecomendavel: number;
  blocos: number;
  referencias: number;
  coerencia: number;
}

export interface ScoreQualidadeBreakdown {
  checklistObrigatorio: number;
  checklistRecomendavel: number;
  blocos: number;
  referencias: number;
  coerencia: number;
}

export interface ScoreQualidadeMinuta {
  total: number;
  nivel: "critico" | "regular" | "bom" | "excelente";
  breakdown: ScoreQualidadeBreakdown;
}

export interface ResumoExecutivoInteligencia {
  statusGeral: string;
  principaisPontos: string[];
  prioridadeRevisao: "alta" | "media" | "baixa";
}

export interface PainelInteligenciaJuridica {
  resumoExecutivo: ResumoExecutivoInteligencia;
  tesesSugeridas: AvaliacaoTese[];
  checklist: ChecklistAvaliado;
  alertas: AlertaJuridico[];
  score: ScoreQualidadeMinuta;
}

export interface EntradaMotorInteligenciaJuridica {
  minuta: Minuta;
  contextoJuridico: ContextoJuridicoPedido | null;
  tipoPecaCanonica: TipoPecaCanonica;
  materiaCanonica: MateriaCanonica;
}
