import type { MetricaFinanceira, MetricaJuridica, InsightIA } from "../domain/types";
import type { BIRepository } from "@/modules/bi/infrastructure/contracts";

const FINANCEIRO_MOCK: MetricaFinanceira = {
  receitaTotal: 19500000, // R$ 195.000 em centavos
  receitaPorMes: [
    { mes: "Nov/25", valor: 0 },
    { mes: "Dez/25", valor: 500000 },
    { mes: "Jan/26", valor: 1500000 },
    { mes: "Fev/26", valor: 2000000 },
    { mes: "Mar/26", valor: 3000000 },
    { mes: "Abr/26", valor: 1500000 },
  ],
  contratosPorStatus: [
    { status: "vigente", count: 2, valor: 19500000 },
    { status: "assinado", count: 1, valor: 1500000 },
    { status: "em_revisao", count: 1, valor: 0 },
    { status: "rascunho", count: 1, valor: 0 },
  ],
  ticketMedioContrato: 4875000, // R$ 48.750
};

const JURIDICO_MOCK: MetricaJuridica = {
  casosPorMateria: [
    { materia: "Agrário / Agronegócio", count: 8 },
    { materia: "Cível Empresarial", count: 1 },
    { materia: "Trabalhista", count: 1 },
    { materia: "Tributário", count: 1 },
    { materia: "Consumidor", count: 1 },
    { materia: "Família", count: 1 },
    { materia: "Criminal", count: 1 },
    { materia: "Empresarial", count: 1 },
    { materia: "Bancário", count: 1 },
    { materia: "Ambiental", count: 1 },
  ],
  casosPorStatus: [
    { status: "estratégia", count: 4 },
    { status: "em análise", count: 5 },
    { status: "minuta em elaboração", count: 3 },
    { status: "novo", count: 3 },
    { status: "encerrado", count: 2 },
  ],
  pedidosPorTipo: [
    { tipo: "Contestação", count: 3 },
    { tipo: "Impugnação", count: 2 },
    { tipo: "Recurso", count: 2 },
    { tipo: "Petição Simples", count: 1 },
  ],
  tempoMedioConclusaoDias: 18,
  totalJurisprudenciasCadastradas: 13,
};

const INSIGHTS_MOCK: InsightIA[] = [
  {
    titulo: "Concentração em Direito Agrário",
    descricao: "50% dos casos ativos são de direito agrário — oportunidade de especialização e marketing neste nicho de alta demanda regional.",
    tipo: "oportunidade",
    prioridade: "alta",
    geradoEm: new Date().toISOString(),
  },
  {
    titulo: "Prazo crítico detectado",
    descricao: "Há 1 pedido com prazo em menos de 7 dias sem conclusão. Risco de intempestividade.",
    tipo: "risco",
    prioridade: "alta",
    geradoEm: new Date().toISOString(),
  },
  {
    titulo: "Crescimento de receita em março",
    descricao: "A receita de contratos cresceu 50% entre fevereiro e março/2026. Tendência de expansão da carteira.",
    tipo: "tendencia",
    prioridade: "media",
    geradoEm: new Date().toISOString(),
  },
  {
    titulo: "Base jurisprudencial em expansão",
    descricao: "13 precedentes cadastrados. Continue enriquecendo a base de jurisprudência — especialmente em agrário e tributário — para fortalecer os argumentos das petições.",
    tipo: "recomendacao",
    prioridade: "media",
    geradoEm: new Date().toISOString(),
  },
];

export class MockBIRepository implements BIRepository {
  async obterFinanceiro(): Promise<MetricaFinanceira> { return FINANCEIRO_MOCK; }
  async obterJuridico(): Promise<MetricaJuridica> { return JURIDICO_MOCK; }
  async obterInsights(): Promise<InsightIA[]> { return INSIGHTS_MOCK; }
}
