import type { KpiOperacional, AlcadaAdvogado, AlertaGestao } from "../domain/types";
import type { GestaoRepository } from "@/modules/gestao/infrastructure/contracts";

// KPIs calculados a partir dos dados mock dos módulos existentes
const KPIS_MOCK: KpiOperacional = {
  totalCasos: 6,
  casosAbertos: 4,
  casosEncerrados: 2,
  totalPedidos: 8,
  pedidosPendentes: 2,
  pedidosEmProducao: 4,
  pedidosConcluidos: 2,
  totalDocumentos: 14,
  documentosPendentesOCR: 3,
  totalContratos: 4,
  contratosVigentes: 2,
  totalClientes: 5,
  clientesAtivos: 3,
};

const ALCADAS_MOCK: AlcadaAdvogado[] = [
  { userId: "usr-001", nome: "Gilberto Jacob", iniciais: "GJ", casosAtivos: 2, pedidosEmProducao: 1, pedidosConcluidos: 3, proximoPrazo: "2026-04-15" },
  { userId: "usr-002", nome: "Ana Paula Mendes", iniciais: "AP", casosAtivos: 3, pedidosEmProducao: 2, pedidosConcluidos: 2, proximoPrazo: "2026-04-10" },
  { userId: "usr-003", nome: "Rafael Costa", iniciais: "RC", casosAtivos: 1, pedidosEmProducao: 1, pedidosConcluidos: 0, proximoPrazo: "2026-04-30" },
];

const ALERTAS_MOCK: AlertaGestao[] = [
  {
    id: "alr-001",
    tipo: "prazo_vencendo",
    urgencia: "critica",
    titulo: "Prazo em 7 dias — Impugnação de Sentença",
    descricao: "O pedido PED-2026-003 vence em 10/04/2026. Responsável: Ana Paula Mendes.",
    entidadeId: "PED-2026-003",
    entidadeTipo: "pedido",
    prazo: "2026-04-10",
  },
  {
    id: "alr-002",
    tipo: "contrato_vencendo",
    urgencia: "alta",
    titulo: "Contrato de arrendamento vence em 90 dias",
    descricao: "CTR-2026-001 vence em 30/06/2028. Considere iniciar renovação antecipada.",
    entidadeId: "CTR-2026-001",
    entidadeTipo: "contrato",
    prazo: "2028-06-30",
  },
  {
    id: "alr-003",
    tipo: "pipeline_parado",
    urgencia: "media",
    titulo: "Pipeline parado há 5 dias",
    descricao: "O pedido PED-2026-005 está na etapa 'Extração de Fatos' sem atualização há 5 dias.",
    entidadeId: "PED-2026-005",
    entidadeTipo: "pedido",
  },
  {
    id: "alr-004",
    tipo: "sem_responsavel",
    urgencia: "baixa",
    titulo: "Caso sem responsável atribuído",
    descricao: "CAS-2026-006 foi criado há 3 dias e não possui advogado responsável designado.",
    entidadeId: "CAS-2026-006",
    entidadeTipo: "caso",
  },
];

export class MockGestaoRepository implements GestaoRepository {
  async obterKpis(): Promise<KpiOperacional> { return KPIS_MOCK; }
  async listarAlcadas(): Promise<AlcadaAdvogado[]> { return ALCADAS_MOCK; }
  async listarAlertas(): Promise<AlertaGestao[]> {
    return ALERTAS_MOCK.sort((a, b) => {
      const ordem = { critica: 0, alta: 1, media: 2, baixa: 3 };
      return (ordem[a.urgencia] ?? 4) - (ordem[b.urgencia] ?? 4);
    });
  }
}
