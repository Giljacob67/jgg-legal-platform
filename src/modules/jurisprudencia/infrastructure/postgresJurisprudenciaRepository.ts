import { getDb, getSqlClient } from "@/lib/database/client";
import { jurisprudencia as jurisprudenciaTable } from "@/lib/database/schema";
import { eq, ilike, or } from "drizzle-orm";
import type { Jurisprudencia, TipoDecisao } from "@/modules/jurisprudencia/domain/types";
import type { MockJurisprudenciaRepository } from "@/modules/jurisprudencia/infrastructure/mockJurisprudenciaRepository";

export type JurisprudenciaRepository = InstanceType<typeof MockJurisprudenciaRepository>;

function mapRow(row: typeof jurisprudenciaTable.$inferSelect): Jurisprudencia {
  let materias: string[] = [];
  let fundamentosLegais: string[] = [];
  materias = (row.materiasJson as string[]) ?? [];
  fundamentosLegais = (row.fundamentosLegaisJson as string[]) ?? [];

  return {
    id: row.id,
    titulo: row.titulo,
    ementa: row.ementa,
    ementaResumida: row.ementaResumida ?? undefined,
    tribunal: row.tribunal,
    relator: row.relator ?? undefined,
    dataJulgamento: row.dataJulgamento ?? undefined,
    tipo: row.tipo as TipoDecisao,
    materias,
    tese: row.tese ?? undefined,
    fundamentosLegais,
    urlOrigem: row.urlOrigem ?? undefined,
    relevancia: row.relevancia,
    criadoEm: row.criadoEm.toISOString(),
  };
}

export class PostgresJurisprudenciaRepository implements JurisprudenciaRepository {
  async listar(filtros?: { tribunal?: string; tipo?: TipoDecisao; materia?: string }): Promise<Jurisprudencia[]> {
    const db = getDb();
    const rows = await db.select().from(jurisprudenciaTable);
    let resultado = rows.map(mapRow);

    if (filtros?.tribunal) {
      resultado = resultado.filter((j) => j.tribunal.toLowerCase() === filtros.tribunal!.toLowerCase());
    }
    if (filtros?.tipo) {
      resultado = resultado.filter((j) => j.tipo === filtros.tipo);
    }
    if (filtros?.materia) {
      const m = filtros.materia.toLowerCase();
      resultado = resultado.filter((j) => j.materias.some((mat) => mat.toLowerCase().includes(m)));
    }

    return resultado.sort((a, b) => b.relevancia - a.relevancia);
  }

  async pesquisarPorTexto(query: string): Promise<Jurisprudencia[]> {
    const db = getDb();
    const q = `%${query}%`;
    const rows = await db
      .select()
      .from(jurisprudenciaTable)
      .where(
        or(
          ilike(jurisprudenciaTable.titulo, q),
          ilike(jurisprudenciaTable.ementa, q),
          ilike(jurisprudenciaTable.tese, q),
          ilike(jurisprudenciaTable.materiasJson, q),
        ),
      );
    return rows.map(mapRow).sort((a, b) => b.relevancia - a.relevancia);
  }

  async obterPorId(id: string): Promise<Jurisprudencia | null> {
    const db = getDb();
    const rows = await db.select().from(jurisprudenciaTable).where(eq(jurisprudenciaTable.id, id));
    return rows.length > 0 ? mapRow(rows[0]) : null;
  }

  async criar(dados: Omit<Jurisprudencia, "id" | "criadoEm">): Promise<Jurisprudencia> {
    const db = getDb();
    const rows = await db.select({ id: jurisprudenciaTable.id }).from(jurisprudenciaTable);
    const id = `JD-${String(rows.length + 1).padStart(3, "0")}`;

    await db.insert(jurisprudenciaTable).values({
      id,
      titulo: dados.titulo,
      ementa: dados.ementa,
      ementaResumida: dados.ementaResumida ?? null,
      tribunal: dados.tribunal,
      relator: dados.relator ?? null,
      dataJulgamento: dados.dataJulgamento ?? null,
      tipo: dados.tipo,
      materiasJson: dados.materias,
      tese: dados.tese ?? null,
      fundamentosLegaisJson: dados.fundamentosLegais,
      urlOrigem: dados.urlOrigem ?? null,
      relevancia: dados.relevancia,
      embeddingStatus: "pendente",
    });

    return (await this.obterPorId(id))!;
  }

  async salvarEmbedding(id: string, embedding: number[]): Promise<void> {
    const sql = getSqlClient();
    // Usa sql raw pois Drizzle não suporta o tipo vector nativamente no update
    await sql`
      UPDATE jurisprudencia
      SET embedding = ${JSON.stringify(embedding)}::vector,
          embedding_status = 'indexado'
      WHERE id = ${id}
    `;
  }

  async listarPendentesIndexacao(limite = 50): Promise<Jurisprudencia[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(jurisprudenciaTable)
      .where(eq(jurisprudenciaTable.embeddingStatus, "pendente"))
      .limit(limite);
    return rows.map(mapRow);
  }

  async buscaSemantica(embedding: number[], limite = 10): Promise<Jurisprudencia[]> {
    const sql = getSqlClient();
    type Row = typeof jurisprudenciaTable.$inferSelect;
    const rows = await sql<Row[]>`
      SELECT id, titulo, ementa, ementa_resumida, tribunal, relator,
             data_julgamento, tipo, materias_json, tese,
             fundamentos_legais_json, url_origem, relevancia,
             embedding_status, criado_em
      FROM jurisprudencia
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT ${limite}
    `;
    return rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      ementa: row.ementa,
      ementaResumida: row.ementaResumida ?? undefined,
      tribunal: row.tribunal,
      relator: row.relator ?? undefined,
      dataJulgamento: row.dataJulgamento ?? undefined,
      tipo: row.tipo as TipoDecisao,
      materias: (row.materiasJson as string[]) ?? [],
      tese: row.tese ?? undefined,
      fundamentosLegais: (row.fundamentosLegaisJson as string[]) ?? [],
      urlOrigem: row.urlOrigem ?? undefined,
      relevancia: row.relevancia,
      criadoEm: row.criadoEm.toISOString(),
    }));
  }
}
