import { getDb } from "@/lib/database/client";
import { casos, pedidosPeca, contratos as contratosTable, jurisprudencia as jurisprudenciaTable } from "@/lib/database/schema";
import type { MetricaFinanceira, MetricaJuridica, InsightIA } from "@/modules/bi/domain/types";
import type { MockBIRepository } from "@/modules/bi/infrastructure/mockBIRepository";

export type BIRepository = InstanceType<typeof MockBIRepository>;

export class PostgresBIRepository implements BIRepository {
  async obterFinanceiro(): Promise<MetricaFinanceira> {
    const db = getDb();
    const contratos = await db.select().from(contratosTable);

    const receitaTotal = contratos
      .filter((c) => c.status === "vigente" || c.status === "assinado")
      .reduce((sum, c) => sum + (c.valorReais ?? 0), 0);

    // Agrupa contratos por status
    const statusMap: Record<string, { count: number; valor: number }> = {};
    for (const c of contratos) {
      if (!statusMap[c.status]) statusMap[c.status] = { count: 0, valor: 0 };
      statusMap[c.status].count++;
      statusMap[c.status].valor += c.valorReais ?? 0;
    }
    const contratosPorStatus = Object.entries(statusMap).map(([status, data]) => ({
      status,
      count: data.count,
      valor: data.valor,
    }));

    // Receita por mês (últimos 6 meses baseado em contratos criados)
    const hoje = new Date();
    const receitaPorMes: { mes: string; valor: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const valor = contratos
        .filter((c) => {
          const criado = new Date(c.criadoEm);
          return criado.getFullYear() === d.getFullYear() && criado.getMonth() === d.getMonth();
        })
        .reduce((sum, c) => sum + (c.valorReais ?? 0), 0);
      receitaPorMes.push({ mes: label, valor });
    }

    const ticketMedioContrato =
      contratos.length > 0 ? Math.round(receitaTotal / contratos.length) : 0;

    return { receitaTotal, receitaPorMes, contratosPorStatus, ticketMedioContrato };
  }

  async obterJuridico(): Promise<MetricaJuridica> {
    const db = getDb();
    const [casosRows, pedidosRows, jdRows] = await Promise.all([
      db.select().from(casos),
      db.select().from(pedidosPeca),
      db.select().from(jurisprudenciaTable),
    ]);

    // Casos por matéria
    const materiaMap: Record<string, number> = {};
    for (const c of casosRows) {
      materiaMap[c.materia] = (materiaMap[c.materia] ?? 0) + 1;
    }
    const casosPorMateria = Object.entries(materiaMap)
      .map(([materia, count]) => ({ materia, count }))
      .sort((a, b) => b.count - a.count);

    // Casos por status
    const statusMap: Record<string, number> = {};
    for (const c of casosRows) {
      statusMap[c.status] = (statusMap[c.status] ?? 0) + 1;
    }
    const casosPorStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Pedidos por tipo
    const tipoMap: Record<string, number> = {};
    for (const p of pedidosRows) {
      tipoMap[p.tipoPeca] = (tipoMap[p.tipoPeca] ?? 0) + 1;
    }
    const pedidosPorTipo = Object.entries(tipoMap)
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      casosPorMateria,
      casosPorStatus,
      pedidosPorTipo,
      tempoMedioConclusaoDias: 0, // calculado futuramente com historico_pipeline
      totalJurisprudenciasCadastradas: jdRows.length,
    };
  }

  async obterInsights(): Promise<InsightIA[]> {
    const db = getDb();
    const [casosRows, pedidosRows, jdRows] = await Promise.all([
      db.select().from(casos),
      db.select().from(pedidosPeca),
      db.select().from(jurisprudenciaTable),
    ]);

    const insights: InsightIA[] = [];
    const agora = new Date().toISOString();

    // Insight: concentração por matéria
    const materiaMap: Record<string, number> = {};
    for (const c of casosRows) materiaMap[c.materia] = (materiaMap[c.materia] ?? 0) + 1;
    const [topMateria] = Object.entries(materiaMap).sort((a, b) => b[1] - a[1]);
    if (topMateria && casosRows.length > 0) {
      const pct = Math.round((topMateria[1] / casosRows.length) * 100);
      if (pct >= 30) {
        insights.push({
          titulo: `Concentração em ${topMateria[0]}`,
          descricao: `${pct}% dos casos ativos são de ${topMateria[0].toLowerCase()} — oportunidade de especialização e marketing neste nicho.`,
          tipo: "oportunidade",
          prioridade: pct >= 50 ? "alta" : "media",
          geradoEm: agora,
        });
      }
    }

    // Insight: prazos críticos
    const hoje = new Date();
    const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    const prazoCriticos = pedidosRows.filter(
      (p) => p.prazoFinal && p.prazoFinal.getTime() <= em7Dias.getTime() && p.status !== "concluído",
    );
    if (prazoCriticos.length > 0) {
      insights.push({
        titulo: "Prazo crítico detectado",
        descricao: `Há ${prazoCriticos.length} pedido(s) com prazo em menos de 7 dias sem conclusão. Risco de intempestividade.`,
        tipo: "risco",
        prioridade: "alta",
        geradoEm: agora,
      });
    }

    // Insight: jurisprudência
    if (jdRows.length < 20) {
      insights.push({
        titulo: "Base jurisprudencial em expansão",
        descricao: `${jdRows.length} precedente(s) cadastrado(s). Continue enriquecendo a base — especialmente em agrário e tributário.`,
        tipo: "recomendacao",
        prioridade: "media",
        geradoEm: agora,
      });
    }

    // Insight: casos sem prazo definido
    const semPrazo = casosRows.filter((c) => !c.prazoFinal && c.status !== "encerrado");
    if (semPrazo.length > 0) {
      insights.push({
        titulo: "Casos sem prazo definido",
        descricao: `${semPrazo.length} caso(s) ativo(s) não têm prazo final cadastrado. Defina prazos para melhor controle.`,
        tipo: "risco",
        prioridade: semPrazo.length >= 3 ? "alta" : "media",
        geradoEm: agora,
      });
    }

    return insights;
  }
}
