import { getDb } from "@/lib/database/client";
import { casos, pedidosPeca, minutas } from "@/lib/database/schema";
import type { DashboardViewModel, IndicadorDashboard, AtividadeRecente } from "@/modules/dashboard/domain/types";
import type { DashboardRepository } from "@/modules/dashboard/infrastructure/contracts";

export class PostgresDashboardRepository implements DashboardRepository {
  async obterVisaoGeral(): Promise<DashboardViewModel> {
    const db = getDb();

    const [casosRows, pedidosRows, minutasRows] = await Promise.all([
      db.select().from(casos),
      db.select().from(pedidosPeca),
      db.select().from(minutas),
    ]);

    // ─── Indicadores ─────────────────────────────────────────

    const totalPeticoesEmProducao = pedidosRows.filter(
      (p) => p.status !== "concluído" && p.status !== "cancelado",
    ).length;

    const totalCasosAtivos = casosRows.filter((c) => c.status !== "encerrado").length;

    const totalMinutasEmElaboracao = minutasRows.length;

    const hoje = new Date();
    const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    const prazoCriticos = pedidosRows.filter((p) => {
      if (!p.prazoFinal) return false;
      return p.prazoFinal.getTime() <= em7Dias.getTime() && p.status !== "concluído" && p.status !== "cancelado";
    });

    const indicadores: IndicadorDashboard[] = [
      {
        id: "KPI-001",
        label: "Petições em produção",
        valor: String(totalPeticoesEmProducao),
        tendencia: `${pedidosRows.filter((p) => p.status === "em triagem").length} em triagem`,
      },
      {
        id: "KPI-002",
        label: "Casos ativos",
        valor: String(totalCasosAtivos),
        tendencia: `${casosRows.filter((c) => c.status === "estratégia").length} em estratégia`,
      },
      {
        id: "KPI-003",
        label: "Minutas em elaboração",
        valor: String(totalMinutasEmElaboracao),
        tendencia: `${pedidosRows.filter((p) => p.etapaAtual === "revisao").length} aguardando revisão`,
      },
      {
        id: "KPI-004",
        label: "Prazos críticos esta semana",
        valor: String(prazoCriticos.length),
        tendencia:
          prazoCriticos.length > 0
            ? `${prazoCriticos.length} vence${prazoCriticos.length > 1 ? "m" : ""} em até 7 dias`
            : "Sem prazos críticos",
      },
    ];

    // ─── Atividades recentes ──────────────────────────────────

    const recentesPedidos: AtividadeRecente[] = pedidosRows
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
      .slice(0, 5)
      .map((p) => ({
        id: `atv-ped-${p.id}`,
        titulo: `${p.tipoPeca} — ${p.titulo} (${p.etapaAtual.replace(/_/g, " ")})`,
        modulo: "Petições",
        timestamp: p.criadoEm.toISOString(),
      }));

    const recentesCasos: AtividadeRecente[] = casosRows
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(0, 3)
      .map((c) => ({
        id: `atv-cas-${c.id}`,
        titulo: `Caso ${c.id} — ${c.titulo} (${c.status})`,
        modulo: "Casos",
        timestamp: c.createdAt?.toISOString() ?? new Date().toISOString(),
      }));

    const atividadesRecentes = [...recentesPedidos, ...recentesCasos]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 8);

    return { indicadores, atividadesRecentes };
  }
}
