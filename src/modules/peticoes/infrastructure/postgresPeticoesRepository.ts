import { getDb, getSqlClient } from "@/lib/database/client";
import { pedidosPeca, minutas as minutasTable, versoesMinuta } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type { PeticoesRepository } from "@/modules/peticoes/infrastructure/contracts";
import { TODOS_TIPOS_PECA } from "@/modules/peticoes/domain/types";
import type {
  PedidoDePeca,
  EtapaPipelineInfo,
  HistoricoPipeline,
  Minuta,
  NovoPedidoPayload,
  TipoPeca,
  PrioridadePedido,
  StatusPedido,
  EtapaPipeline,
  IntencaoProcessual,
} from "@/modules/peticoes/domain/types";

export class PostgresPeticoesRepository implements PeticoesRepository {
  private mapPedido(row: typeof pedidosPeca.$inferSelect): PedidoDePeca {
    return {
      id: row.id,
      casoId: row.casoId ?? "",
      titulo: row.titulo,
      tipoPeca: row.tipoPeca as TipoPeca,
      prioridade: row.prioridade as PrioridadePedido,
      status: row.status as StatusPedido,
      etapaAtual: row.etapaAtual as EtapaPipeline,
      responsavel: row.responsavel ?? "",
      prazoFinal: row.prazoFinal ? row.prazoFinal.toISOString().split("T")[0] : "",
      criadoEm: row.criadoEm.toISOString(),
      intencaoProcessual: row.intencaoProcessual as IntencaoProcessual | undefined ?? undefined,
      documentoOrigemId: row.documentoOrigemId ?? undefined,
    };
  }

  async listarPedidos(): Promise<PedidoDePeca[]> {
    const db = getDb();
    const rows = await db.select().from(pedidosPeca);
    return rows.map((row) => this.mapPedido(row));
  }

  async obterPedidoPorId(pedidoId: string): Promise<PedidoDePeca | undefined> {
    const db = getDb();
    const rows = await db.select().from(pedidosPeca).where(eq(pedidosPeca.id, pedidoId));
    if (rows.length === 0) return undefined;
    return this.mapPedido(rows[0]);
  }

  async listarEtapasPipeline(): Promise<EtapaPipelineInfo[]> {
    return [
      { id: "classificacao", nome: "Classificação", priorizadaMvp: true },
      { id: "leitura_documental", nome: "Leitura documental", priorizadaMvp: true },
      { id: "extracao_de_fatos", nome: "Extração de fatos", priorizadaMvp: true },
      { id: "estrategia_juridica", nome: "Estratégia jurídica", priorizadaMvp: true },
      { id: "redacao", nome: "Redação de minuta", priorizadaMvp: true },
      { id: "revisao", nome: "Revisão e aprovação", priorizadaMvp: true },
    ];
  }

  async listarHistoricoPipeline(pedidoId: string): Promise<HistoricoPipeline[]> {
    // Derive history from pedido_pipeline_snapshot — the canonical source of truth.
    // The legacy historico_pipeline table is not written to in the current system.
    const sql = getSqlClient();
    const rows = await sql<Array<{
      id: string;
      etapa: string;
      status: string;
      executado_em: string | null;
    }>>`
      SELECT id, etapa, status, executado_em
      FROM pedido_pipeline_snapshot
      WHERE pedido_id = ${pedidoId}
      ORDER BY executado_em DESC, versao DESC
    `;

    const descricaoPorStatus: Record<string, string> = {
      concluido: "concluído com sucesso.",
      em_andamento: "em processamento.",
      erro: "concluído com erro.",
      mock_controlado: "mantido em mock controlado.",
      pendente: "aguardando execução.",
    };

    return rows.map((r) => ({
      id: `HIST-${r.id}`,
      etapa: r.etapa as EtapaPipeline,
      descricao: `${r.etapa.replaceAll("_", " ")}: ${descricaoPorStatus[r.status] ?? "processado."}`,
      data: r.executado_em ?? new Date().toISOString(),
      responsavel: "Sistema",
    }));
  }

  async obterMinutaPorId(minutaId: string): Promise<Minuta | undefined> {
    const db = getDb();
    const rows = await db.select().from(minutasTable).where(eq(minutasTable.id, minutaId));
    if (rows.length === 0) return undefined;
    
    // Obter versoes
    const versoesRows = await db.select().from(versoesMinuta).where(eq(versoesMinuta.minutaId, minutaId));
    
    return {
      id: rows[0].id,
      pedidoId: rows[0].pedidoId ?? "",
      titulo: rows[0].titulo,
      conteudoAtual: rows[0].conteudoAtual ?? "",
      versoes: versoesRows.map((v) => ({
        id: v.id,
        numero: v.numero,
        criadoEm: v.criadoEm.toISOString(),
        autor: v.autor,
        resumoMudancas: v.resumoMudancas ?? "",
        conteudo: v.conteudo,
      })),
    };
  }

  async obterMinutaPorPedidoId(pedidoId: string): Promise<Minuta | undefined> {
    const db = getDb();
    const rows = await db.select().from(minutasTable).where(eq(minutasTable.pedidoId, pedidoId));
    if (rows.length === 0) return undefined;
    return this.obterMinutaPorId(rows[0].id);
  }

  async criarPedidoDePeca(payload: NovoPedidoPayload): Promise<PedidoDePeca> {
    const db = getDb();
    const novoId = `PED-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    await db.insert(pedidosPeca).values({
      id: novoId,
      casoId: payload.casoId,
      titulo: payload.titulo,
      tipoPeca: payload.tipoPeca,
      prioridade: payload.prioridade,
      status: "em triagem",
      etapaAtual: "classificacao",
      responsavel: "Distribuição automática",
      prazoFinal: new Date(payload.prazoFinal),
      intencaoProcessual: payload.intencaoProcessual ?? null,
      documentoOrigemId: payload.documentoOrigemId ?? null,
    });

    return this.obterPedidoPorId(novoId) as Promise<PedidoDePeca>;
  }

  /** @deprecated Use criarPedidoDePeca */
  async simularCriacaoPedido(payload: NovoPedidoPayload): Promise<PedidoDePeca> {
    return this.criarPedidoDePeca(payload);
  }

  async listarTiposPeca(): Promise<TipoPeca[]> {
    return [...TODOS_TIPOS_PECA];
  }
}
