import "server-only";
import { getSqlClient } from "@/lib/database/client";
import type { KpiOperacional, AlcadaAdvogado, AlertaGestao } from "../domain/types";

type KpiRow = {
  total: number;
  abertos?: number;
  encerrados?: number;
  pendentes?: number;
  em_producao?: number;
  concluidos?: number;
  vigentes?: number;
  ativos?: number;
};

type AlcadaRow = {
  id: string;
  name: string;
  initials: string | null;
  casos_ativos: number;
  pedidos_em_producao: number;
  pedidos_concluidos: number;
  proximo_prazo: Date | string | null;
};

type PedidoPrazoRow = {
  id: string;
  titulo: string;
  responsavel: string | null;
  prazo_final: Date | string;
};

type ContratoVencendoRow = {
  id: string;
  titulo: string;
  vigencia_fim: string;
};

type PedidoSemResponsavelRow = {
  id: string;
  titulo: string;
};

export class PostgresGestaoRepository {
  async obterKpis(): Promise<KpiOperacional> {
    const sql = getSqlClient();

    const [casosResult, pedidosResult, contratosResult, clientesResult, docsResult] =
      await Promise.all([
        sql<KpiRow[]>`
          SELECT
            COUNT(*)::int AS total,
            COUNT(CASE WHEN status != 'protocolado' THEN 1 END)::int AS abertos,
            COUNT(CASE WHEN status = 'protocolado' THEN 1 END)::int AS encerrados
          FROM casos
        `.catch(() => [] as KpiRow[]),

        sql<KpiRow[]>`
          SELECT
            COUNT(*)::int AS total,
            COUNT(CASE WHEN status = 'em triagem' THEN 1 END)::int AS pendentes,
            COUNT(CASE WHEN status = 'em produção' THEN 1 END)::int AS em_producao,
            COUNT(CASE WHEN status = 'aprovado' THEN 1 END)::int AS concluidos
          FROM pedidos_peca
        `.catch(() => [] as KpiRow[]),

        sql<KpiRow[]>`
          SELECT
            COUNT(*)::int AS total,
            COUNT(CASE WHEN status = 'vigente' THEN 1 END)::int AS vigentes
          FROM contratos
        `.catch(() => [] as KpiRow[]),

        sql<KpiRow[]>`
          SELECT
            COUNT(*)::int AS total,
            COUNT(CASE WHEN status = 'ativo' THEN 1 END)::int AS ativos
          FROM clientes
        `.catch(() => [] as KpiRow[]),

        sql<KpiRow[]>`
          SELECT
            COUNT(*)::int AS total,
            COUNT(CASE WHEN status_documento = 'pendente de leitura' THEN 1 END)::int AS pendentes
          FROM documentos_juridicos
        `.catch(() => [] as KpiRow[]),
      ]);

    return {
      totalCasos: casosResult[0]?.total ?? 0,
      casosAbertos: casosResult[0]?.abertos ?? 0,
      casosEncerrados: casosResult[0]?.encerrados ?? 0,
      totalPedidos: pedidosResult[0]?.total ?? 0,
      pedidosPendentes: pedidosResult[0]?.pendentes ?? 0,
      pedidosEmProducao: pedidosResult[0]?.em_producao ?? 0,
      pedidosConcluidos: pedidosResult[0]?.concluidos ?? 0,
      totalDocumentos: docsResult[0]?.total ?? 0,
      documentosPendentesOCR: docsResult[0]?.pendentes ?? 0,
      totalContratos: contratosResult[0]?.total ?? 0,
      contratosVigentes: contratosResult[0]?.vigentes ?? 0,
      totalClientes: clientesResult[0]?.total ?? 0,
      clientesAtivos: clientesResult[0]?.ativos ?? 0,
    };
  }

  async listarAlcadas(): Promise<AlcadaAdvogado[]> {
    const sql = getSqlClient();

    try {
      const rows = await sql<AlcadaRow[]>`
        SELECT
          u.id,
          u.name,
          u.initials,
          COUNT(DISTINCT CASE WHEN c.status != 'protocolado' THEN p.caso_id END)::int AS casos_ativos,
          COUNT(CASE WHEN p.status = 'em produção' THEN 1 END)::int AS pedidos_em_producao,
          COUNT(CASE WHEN p.status = 'aprovado' THEN 1 END)::int AS pedidos_concluidos,
          MIN(
            CASE WHEN p.status != 'aprovado' AND p.prazo_final >= NOW()
              THEN p.prazo_final END
          ) AS proximo_prazo
        FROM users u
        LEFT JOIN pedidos_peca p ON LOWER(p.responsavel) = LOWER(u.name)
        LEFT JOIN casos c ON c.id = p.caso_id
        WHERE u.ativo = true
        GROUP BY u.id, u.name, u.initials
        HAVING COUNT(p.id) > 0
        ORDER BY casos_ativos DESC, pedidos_em_producao DESC
        LIMIT 20
      `;

      return rows.map((r) => ({
        userId: r.id,
        nome: r.name,
        iniciais: r.initials ?? r.name.slice(0, 2).toUpperCase(),
        casosAtivos: r.casos_ativos ?? 0,
        pedidosEmProducao: r.pedidos_em_producao ?? 0,
        pedidosConcluidos: r.pedidos_concluidos ?? 0,
        proximoPrazo: r.proximo_prazo
          ? new Date(r.proximo_prazo).toISOString().split("T")[0]
          : undefined,
      }));
    } catch {
      return [];
    }
  }

  async listarAlertas(): Promise<AlertaGestao[]> {
    const sql = getSqlClient();
    const alertas: AlertaGestao[] = [];
    const hoje = new Date();
    const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Pedidos com prazo JÁ VENCIDO e não concluídos
    await sql<PedidoPrazoRow[]>`
      SELECT id, titulo, responsavel, prazo_final
      FROM pedidos_peca
      WHERE prazo_final IS NOT NULL
        AND prazo_final < NOW()
        AND status != 'aprovado'
      ORDER BY prazo_final ASC
      LIMIT 5
    `
      .then((rows) => {
        for (const row of rows) {
          alertas.push({
            id: `alr-vencido-${row.id}`,
            tipo: "prazo_vencendo",
            urgencia: "critica",
            titulo: `Prazo VENCIDO — ${row.titulo}`,
            descricao: `${row.id} venceu em ${new Date(row.prazo_final).toLocaleDateString("pt-BR")} e ainda não foi concluído. Responsável: ${row.responsavel ?? "não atribuído"}.`,
            entidadeId: row.id,
            entidadeTipo: "pedido",
            prazo: new Date(row.prazo_final).toISOString().split("T")[0],
          });
        }
      })
      .catch(() => undefined);

    // Pedidos com prazo vencendo nos próximos 7 dias
    await sql<PedidoPrazoRow[]>`
      SELECT id, titulo, responsavel, prazo_final
      FROM pedidos_peca
      WHERE prazo_final IS NOT NULL
        AND prazo_final >= NOW()
        AND prazo_final <= ${em7Dias}
        AND status != 'aprovado'
      ORDER BY prazo_final ASC
      LIMIT 5
    `
      .then((rows) => {
        for (const row of rows) {
          alertas.push({
            id: `alr-prazo-${row.id}`,
            tipo: "prazo_vencendo",
            urgencia: "alta",
            titulo: `Prazo em ${Math.ceil((new Date(row.prazo_final).getTime() - hoje.getTime()) / 86400000)} dias — ${row.titulo}`,
            descricao: `${row.id} vence em ${new Date(row.prazo_final).toLocaleDateString("pt-BR")}. Responsável: ${row.responsavel ?? "não atribuído"}.`,
            entidadeId: row.id,
            entidadeTipo: "pedido",
            prazo: new Date(row.prazo_final).toISOString().split("T")[0],
          });
        }
      })
      .catch(() => undefined);

    // Contratos vencendo em até 90 dias
    await sql<ContratoVencendoRow[]>`
      SELECT id, titulo, vigencia_fim
      FROM contratos
      WHERE vigencia_fim IS NOT NULL
        AND vigencia_fim::date >= CURRENT_DATE
        AND vigencia_fim::date <= CURRENT_DATE + INTERVAL '90 days'
        AND status = 'vigente'
      ORDER BY vigencia_fim ASC
      LIMIT 3
    `
      .then((rows) => {
        for (const row of rows) {
          alertas.push({
            id: `alr-ctr-${row.id}`,
            tipo: "contrato_vencendo",
            urgencia: "alta",
            titulo: `Contrato vencendo — ${row.titulo}`,
            descricao: `${row.id} vence em ${new Date(row.vigencia_fim).toLocaleDateString("pt-BR")}. Considere iniciar renovação antecipada.`,
            entidadeId: row.id,
            entidadeTipo: "contrato",
            prazo: row.vigencia_fim,
          });
        }
      })
      .catch(() => undefined);

    // Pedidos sem responsável atribuído (ou com distribuição automática)
    await sql<PedidoSemResponsavelRow[]>`
      SELECT id, titulo
      FROM pedidos_peca
      WHERE (responsavel IS NULL OR responsavel = '' OR responsavel = 'Distribuição automática')
        AND status != 'aprovado'
      LIMIT 3
    `
      .then((rows) => {
        for (const row of rows) {
          alertas.push({
            id: `alr-resp-${row.id}`,
            tipo: "sem_responsavel",
            urgencia: "media",
            titulo: `Pedido sem responsável — ${row.titulo}`,
            descricao: `${row.id} não possui advogado responsável designado. Atribua um responsável para manter o controle de produção.`,
            entidadeId: row.id,
            entidadeTipo: "pedido",
          });
        }
      })
      .catch(() => undefined);

    return alertas.sort((a, b) => {
      const ordem: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };
      return (ordem[a.urgencia] ?? 4) - (ordem[b.urgencia] ?? 4);
    });
  }
}
