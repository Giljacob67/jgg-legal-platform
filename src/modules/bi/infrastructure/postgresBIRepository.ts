import { getDb } from "@/lib/database/client";
import { getSqlClient } from "@/lib/database/client";
import { casos, pedidosPeca, contratos as contratosTable, jurisprudencia as jurisprudenciaTable } from "@/lib/database/schema";
import type {
  MetricaFinanceira,
  MetricaJuridica,
  InsightIA,
  MetricaObservabilidadePipeline,
} from "@/modules/bi/domain/types";
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

  async obterObservabilidadePipeline(): Promise<MetricaObservabilidadePipeline> {
    const janelaHoras = Number(process.env.BI_PIPELINE_WINDOW_HOURS ?? 24);
    const sql = getSqlClient();

    try {
      const totalRows = await sql<{
        total: number;
        falhas: number;
        latencia_media_ms: number | null;
        latencia_p95_ms: number | null;
        schema_invalido_count: number;
        rag_degradado_count: number;
      }[]>`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'failed')::int AS falhas,
          AVG(EXTRACT(EPOCH FROM (COALESCE(finished_at, created_at) - created_at)) * 1000)::float8 AS latencia_media_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (COALESCE(finished_at, created_at) - created_at)) * 1000
          )::float8 AS latencia_p95_ms,
          COUNT(*) FILTER (WHERE schema_valid = false)::int AS schema_invalido_count,
          COUNT(*) FILTER (WHERE rag_degraded = true)::int AS rag_degradado_count
        FROM pipeline_execution_control
        WHERE created_at > NOW() - (${janelaHoras} * interval '1 hour')
      `;

      const estagiosRows = await sql<{
        estagio: string;
        total: number;
        falhas: number;
        latencia_media_ms: number | null;
        latencia_p95_ms: number | null;
        schema_invalido_count: number;
        rag_degradado_count: number;
      }[]>`
        SELECT
          estagio,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'failed')::int AS falhas,
          AVG(EXTRACT(EPOCH FROM (COALESCE(finished_at, created_at) - created_at)) * 1000)::float8 AS latencia_media_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (COALESCE(finished_at, created_at) - created_at)) * 1000
          )::float8 AS latencia_p95_ms,
          COUNT(*) FILTER (WHERE schema_valid = false)::int AS schema_invalido_count,
          COUNT(*) FILTER (WHERE rag_degraded = true)::int AS rag_degradado_count
        FROM pipeline_execution_control
        WHERE created_at > NOW() - (${janelaHoras} * interval '1 hour')
        GROUP BY estagio
        ORDER BY total DESC, estagio ASC
      `;

      const errosRows = await sql<{ erro: string; count: number }[]>`
        SELECT
          COALESCE(NULLIF(error_message, ''), 'Erro não especificado') AS erro,
          COUNT(*)::int AS count
        FROM pipeline_execution_control
        WHERE created_at > NOW() - (${janelaHoras} * interval '1 hour')
          AND status = 'failed'
        GROUP BY COALESCE(NULLIF(error_message, ''), 'Erro não especificado')
        ORDER BY count DESC
        LIMIT 5
      `;

      const total = totalRows[0]?.total ?? 0;
      const falhas = totalRows[0]?.falhas ?? 0;
      const safePct = (count: number) => (total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0);

      return {
        janelaHoras,
        totalExecucoes: total,
        totalFalhas: falhas,
        taxaFalhaPct: safePct(falhas),
        latenciaMediaMs: Math.round(totalRows[0]?.latencia_media_ms ?? 0),
        latenciaP95Ms: Math.round(totalRows[0]?.latencia_p95_ms ?? 0),
        schemaInvalidoPct: safePct(totalRows[0]?.schema_invalido_count ?? 0),
        ragDegradadoPct: safePct(totalRows[0]?.rag_degradado_count ?? 0),
        porEstagio: estagiosRows.map((row) => {
          const pct = (count: number) =>
            row.total > 0 ? Number(((count / row.total) * 100).toFixed(1)) : 0;
          return {
            estagio: row.estagio,
            totalExecucoes: row.total,
            totalFalhas: row.falhas,
            taxaFalhaPct: pct(row.falhas),
            latenciaMediaMs: Math.round(row.latencia_media_ms ?? 0),
            latenciaP95Ms: Math.round(row.latencia_p95_ms ?? 0),
            schemaInvalidoPct: pct(row.schema_invalido_count),
            ragDegradadoPct: pct(row.rag_degradado_count),
          };
        }),
        principaisErros: errosRows.map((row) => ({ erro: row.erro, count: row.count })),
        geradoEm: new Date().toISOString(),
      };
    } catch (error) {
      console.warn("[bi] Falha ao consultar observabilidade de pipeline.", error);
      return {
        janelaHoras,
        totalExecucoes: 0,
        totalFalhas: 0,
        taxaFalhaPct: 0,
        latenciaMediaMs: 0,
        latenciaP95Ms: 0,
        schemaInvalidoPct: 0,
        ragDegradadoPct: 0,
        porEstagio: [],
        principaisErros: [],
        geradoEm: new Date().toISOString(),
      };
    }
  }
}
