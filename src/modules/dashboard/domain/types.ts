export interface IndicadorDashboard {
  id: string;
  label: string;
  valor: string;
  tendencia: string;
}

export interface AtividadeRecente {
  id: string;
  titulo: string;
  modulo: string;
  /** ISO 8601 timestamp, e.g. "2026-04-04T15:00:00Z" */
  timestamp: string;
}

export interface DashboardViewModel {
  indicadores: IndicadorDashboard[];
  atividadesRecentes: AtividadeRecente[];
}
