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
          valor: "14",
          tendencia: "+2 desde ontem",
        },
        {
          id: "KPI-002",
          label: "Casos com prazo crítico",
          valor: "5",
          tendencia: "1 vence hoje",
        },
        {
          id: "KPI-003",
          label: "Documentos pendentes de leitura",
          valor: "11",
          tendencia: "-3 na semana",
        },
        {
          id: "KPI-004",
          label: "Minutas em revisão",
          valor: "4",
          tendencia: "2 aguardando aprovação",
        },
      ],
      atividadesRecentes: [
        {
          id: "ATV-001",
          titulo: "Pedido PED-2026-001 avançou para extração de fatos",
          modulo: "Petições",
          horario: "09:42",
        },
        {
          id: "ATV-002",
          titulo: "Documento DOC-006 enviado para leitura documental",
          modulo: "Documentos",
          horario: "08:57",
        },
        {
          id: "ATV-003",
          titulo: "Caso CAS-2026-002 recebeu atualização de estratégia",
          modulo: "Casos",
          horario: "08:13",
        },
      ],
    };
  }
}
