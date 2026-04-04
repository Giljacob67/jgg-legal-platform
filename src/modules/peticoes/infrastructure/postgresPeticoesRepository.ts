import { getDb } from "@/lib/database/client";
import { pedidosPeca, minutas as minutasTable, versoesMinuta } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type { PeticoesRepository } from "@/modules/peticoes/infrastructure/mockPeticoesRepository";
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
} from "@/modules/peticoes/domain/types";

export class PostgresPeticoesRepository implements PeticoesRepository {
  async listarPedidos(): Promise<PedidoDePeca[]> {
    const db = getDb();
    const rows = await db.select().from(pedidosPeca);
    return rows.map((row) => ({
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
    }));
  }

  async obterPedidoPorId(pedidoId: string): Promise<PedidoDePeca | undefined> {
    const db = getDb();
    const rows = await db.select().from(pedidosPeca).where(eq(pedidosPeca.id, pedidoId));
    if (rows.length === 0) return undefined;
    const row = rows[0];
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
    };
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
    // Para simplificar a POC, não implementamos a query de histórico completa ainda.
    return [];
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

  async simularCriacaoPedido(payload: NovoPedidoPayload): Promise<PedidoDePeca> {
    const db = getDb();
    const novoId = `PED-${Math.floor(Math.random() * 9000) + 1000}`;
    
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
    });

    return this.obterPedidoPorId(novoId) as Promise<PedidoDePeca>;
  }

  async listarTiposPeca(): Promise<TipoPeca[]> {
    return [
      "Petição inicial",
      "Contestação",
      "Réplica",
      "Embargos à execução",
      "Mandado de segurança",
      "Exceção de pré-executividade",
    ];
  }
}
