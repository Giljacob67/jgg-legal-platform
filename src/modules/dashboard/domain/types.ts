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
  horario: string;
}

export interface DashboardViewModel {
  indicadores: IndicadorDashboard[];
  atividadesRecentes: AtividadeRecente[];
}
