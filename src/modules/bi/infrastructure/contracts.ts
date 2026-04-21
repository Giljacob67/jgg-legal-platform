import type { InsightIA, MetricaFinanceira, MetricaJuridica } from "@/modules/bi/domain/types";

export interface BIRepository {
  obterFinanceiro(): Promise<MetricaFinanceira>;
  obterJuridico(): Promise<MetricaJuridica>;
  obterInsights(): Promise<InsightIA[]>;
}
