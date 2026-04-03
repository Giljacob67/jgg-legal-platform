// ─────────────────────────────────────────────────────────────
// MÓDULO JURISPRUDÊNCIA — Domain Types
// ─────────────────────────────────────────────────────────────

export type TipoDecisao =
  | "acordao"
  | "decisao_monocratica"
  | "sumula"
  | "enunciado"
  | "repercussao_geral"
  | "tema_stj"
  | "resolucao"
  | "nota_tecnica";

export const LABEL_TIPO_DECISAO: Record<TipoDecisao, string> = {
  acordao: "Acórdão",
  decisao_monocratica: "Decisão Monocrática",
  sumula: "Súmula",
  enunciado: "Enunciado",
  repercussao_geral: "Repercussão Geral",
  tema_stj: "Tema STJ",
  resolucao: "Resolução",
  nota_tecnica: "Nota Técnica",
};

export interface Jurisprudencia {
  id: string;
  titulo: string;
  ementa: string;
  ementaResumida?: string;   // gerada pela IA
  tribunal: string;          // "STJ", "STF", "TRF1", "TJMT", etc.
  relator?: string;
  dataJulgamento?: string;   // ISO date
  tipo: TipoDecisao;
  materias: string[];        // ["direito agrário", "arrendamento rural", ...]
  tese?: string;             // tese jurídica principal extraída
  fundamentosLegais: string[]; // art. 5º, XXVI CF/88; art. 95 Estatuto da Terra...
  urlOrigem?: string;
  relevancia: number;        // 1-5 — curado manualmente
  criadoEm: string;
}

export interface ResultadoBuscaJurisprudencia {
  jurisprudencias: Jurisprudencia[];
  total: number;
  query: string;
  filtros?: { tribunal?: string; tipo?: TipoDecisao; materia?: string };
}
