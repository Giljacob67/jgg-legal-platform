// ─────────────────────────────────────────────────────────────
// MÓDULO GESTÃO — Domain Types
// ─────────────────────────────────────────────────────────────

export interface KpiOperacional {
  totalCasos: number;
  casosAbertos: number;
  casosEncerrados: number;
  totalPedidos: number;
  pedidosPendentes: number;
  pedidosEmProducao: number;
  pedidosConcluidos: number;
  totalDocumentos: number;
  documentosPendentesOCR: number;
  totalContratos: number;
  contratosVigentes: number;
  totalClientes: number;
  clientesAtivos: number;
}

export interface AlcadaAdvogado {
  userId: string;
  nome: string;
  iniciais: string;
  casosAtivos: number;
  pedidosEmProducao: number;
  pedidosConcluidos: number;
  proximoPrazo?: string; // ISO date
}

export type UrgenciaAlerta = "critica" | "alta" | "media" | "baixa";
export type TipoAlerta = "prazo_vencendo" | "pipeline_parado" | "sem_responsavel" | "contrato_vencendo";

export interface AlertaGestao {
  id: string;
  tipo: TipoAlerta;
  urgencia: UrgenciaAlerta;
  titulo: string;
  descricao: string;
  entidadeId?: string;
  entidadeTipo?: "caso" | "pedido" | "contrato";
  prazo?: string;
}

export const COR_URGENCIA: Record<UrgenciaAlerta, string> = {
  critica: "bg-rose-100 text-rose-800 border-rose-300",
  alta: "bg-orange-100 text-orange-800 border-orange-300",
  media: "bg-amber-100 text-amber-800 border-amber-200",
  baixa: "bg-blue-50 text-blue-700 border-blue-200",
};
