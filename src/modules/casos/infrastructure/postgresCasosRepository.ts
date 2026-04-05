import { getDb, getSqlClient } from "@/lib/database/client";
import { casos, partes, eventosCaso } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type { Caso, StatusCaso, Parte, EventoCaso } from "@/modules/casos/domain/types";
import type { CasosRepository } from "@/modules/casos/infrastructure/mockCasosRepository";

type DocVinculoRow = { documento_juridico_id: string };

async function obterIdsDocumentosDoCaso(casoId: string): Promise<string[]> {
  try {
    const sql = getSqlClient();
    const rows = await sql<DocVinculoRow[]>`
      SELECT documento_juridico_id
      FROM documento_vinculo
      WHERE tipo_entidade = 'caso' AND entidade_id = ${casoId}
    `;
    return rows.map((r) => r.documento_juridico_id);
  } catch {
    // tabela pode não existir em ambientes de desenvolvimento
    return [];
  }
}

function mapRowToCaso(
  row: typeof casos.$inferSelect,
  partesRows: Array<typeof partes.$inferSelect>,
  eventosRows: Array<typeof eventosCaso.$inferSelect>,
  documentosRelacionados: string[],
): Caso {
  return {
    id: row.id,
    titulo: row.titulo,
    cliente: row.cliente,
    materia: row.materia,
    tribunal: row.tribunal ?? "",
    status: row.status as StatusCaso,
    prazoFinal: row.prazoFinal ? row.prazoFinal.toISOString().split("T")[0] : "",
    resumo: row.resumo ?? "",
    documentosRelacionados,
    partes: partesRows.map((p): Parte => ({
      nome: p.nome,
      papel: p.papel as Parte["papel"],
    })),
    eventos: eventosRows.map((e): EventoCaso => ({
      id: e.id,
      data: e.data.toISOString().split("T")[0],
      descricao: e.descricao,
    })),
  };
}

export class PostgresCasosRepository implements CasosRepository {
  async listarCasos(): Promise<Caso[]> {
    const db = getDb();
    const [casosRows, partesRows, eventosRows] = await Promise.all([
      db.select().from(casos),
      db.select().from(partes),
      db.select().from(eventosCaso),
    ]);

    return Promise.all(
      casosRows.map(async (row) => {
        const documentosRelacionados = await obterIdsDocumentosDoCaso(row.id);
        return mapRowToCaso(
          row,
          partesRows.filter((p) => p.casoId === row.id),
          eventosRows.filter((e) => e.casoId === row.id),
          documentosRelacionados,
        );
      }),
    );
  }

  async obterCasoPorId(casoId: string): Promise<Caso | undefined> {
    const db = getDb();
    const [casosRows, partesRows, eventosRows, documentosRelacionados] = await Promise.all([
      db.select().from(casos).where(eq(casos.id, casoId)),
      db.select().from(partes).where(eq(partes.casoId, casoId)),
      db.select().from(eventosCaso).where(eq(eventosCaso.casoId, casoId)),
      obterIdsDocumentosDoCaso(casoId),
    ]);

    if (casosRows.length === 0) return undefined;

    return mapRowToCaso(casosRows[0], partesRows, eventosRows, documentosRelacionados);
  }
}
