import type { DashboardViewModel } from "@/modules/dashboard/domain/types";

export interface DashboardRepository {
  obterVisaoGeral(): DashboardViewModel;
}

export class MockDashboardRepository implements DashboardRepository {
  obterVisaoGeral(): DashboardViewModel {
    return {
      indicadores: [
        {
          id: "KPI-001",
          label: "Petições em produção",
          valor: "12",
          tendencia: "+4 nesta semana",
        },
        {
          id: "KPI-002",
          label: "Casos ativos",
          valor: "10",
          tendencia: "3 com prazo crítico",
        },
        {
          id: "KPI-003",
          label: "Minutas em elaboração",
          valor: "8",
          tendencia: "2 aguardando revisão",
        },
        {
          id: "KPI-004",
          label: "Tipos de peça disponíveis",
          valor: "18",
          tendencia: "Cobertura completa",
        },
      ],
      atividadesRecentes: [
        {
          id: "ATV-001",
          titulo: "HC PED-2026-007 aprovado e protocolado no TJSP",
          modulo: "Petições",
          horario: "15:00",
        },
        {
          id: "ATV-002",
          titulo: "Mandado de Segurança PED-2026-006 avançou para redação",
          modulo: "Petições",
          horario: "14:00",
        },
        {
          id: "ATV-003",
          titulo: "Embargos PED-2026-004 em fase de estratégia jurídica",
          modulo: "Petições",
          horario: "09:30",
        },
        {
          id: "ATV-004",
          titulo: "Caso CAS-2026-006 recebido com urgência — Criminal",
          modulo: "Casos",
          horario: "07:30",
        },
        {
          id: "ATV-005",
          titulo: "Reconvenção PED-2026-009 — extração de fatos em andamento",
          modulo: "Petições",
          horario: "10:00",
        },
        {
          id: "ATV-006",
          titulo: "Tutela de urgência PED-2026-011 em revisão — 2 sugestões",
          modulo: "Petições",
          horario: "09:00",
        },
        {
          id: "ATV-007",
          titulo: "Novo caso CAS-2026-009 registrado — Ambiental (IBAMA)",
          modulo: "Casos",
          horario: "08:00",
        },
        {
          id: "ATV-008",
          titulo: "Contestação PED-2026-002 com 3 apontamentos de revisão",
          modulo: "Petições",
          horario: "08:30",
        },
      ],
    };
  }
}
