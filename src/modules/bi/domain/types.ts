// ─────────────────────────────────────────────────────────────
// MÓDULO BI — Domain Types
// ─────────────────────────────────────────────────────────────

export interface MetricaFinanceira {
  receitaTotal: number;           // centavos — soma de contratos vigentes/assinados
  receitaPorMes: { mes: string; valor: number }[]; // últimos 6 meses
  contratosPorStatus: { status: string; count: number; valor: number }[];
  ticketMedioContrato: number;
}

export interface MetricaJuridica {
  casosPorMateria: { materia: string; count: number }[];
  casosPorStatus: { status: string; count: number }[];
  pedidosPorTipo: { tipo: string; count: number }[];
  tempoMedioConclusaoDias: number;
  totalJurisprudenciasCadastradas: number;
}

export interface InsightIA {
  titulo: string;
  descricao: string;
  tipo: "oportunidade" | "risco" | "tendencia" | "recomendacao";
  prioridade: "alta" | "media" | "baixa";
  geradoEm: string;
}

export interface MetricaObservabilidadePipelineEstagio {
  estagio: string;
  totalExecucoes: number;
  totalFalhas: number;
  taxaFalhaPct: number;
  latenciaMediaMs: number;
  latenciaP95Ms: number;
  schemaInvalidoPct: number;
  ragDegradadoPct: number;
}

export interface MetricaObservabilidadePipeline {
  janelaHoras: number;
  totalExecucoes: number;
  totalFalhas: number;
  taxaFalhaPct: number;
  latenciaMediaMs: number;
  latenciaP95Ms: number;
  schemaInvalidoPct: number;
  ragDegradadoPct: number;
  porEstagio: MetricaObservabilidadePipelineEstagio[];
  principaisErros: { erro: string; count: number }[];
  geradoEm: string;
}

export const COR_INSIGHT: Record<InsightIA["tipo"], string> = {
  oportunidade: "bg-emerald-50 text-emerald-800 border-emerald-200",
  risco: "bg-rose-50 text-rose-800 border-rose-200",
  tendencia: "bg-blue-50 text-blue-800 border-blue-200",
  recomendacao: "bg-violet-50 text-violet-800 border-violet-200",
};
