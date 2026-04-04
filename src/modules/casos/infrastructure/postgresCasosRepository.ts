import { getDb } from "@/lib/database/client";
import { casos, partes, eventosCaso } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type { Caso, StatusCaso, Parte, EventoCaso } from "@/modules/casos/domain/types";
import type { CasosRepository } from "@/modules/casos/infrastructure/mockCasosRepository";

function mapRowToCaso(
  row: typeof casos.$inferSelect,
  partesRows: Array<typeof partes.$inferSelect>,
  eventosRows: Array<typeof eventosCaso.$inferSelect>,
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
    documentosRelacionados: [],
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

    return casosRows.map((row) =>
      mapRowToCaso(
        row,
        partesRows.filter((p) => p.casoId === row.id),
        eventosRows.filter((e) => e.casoId === row.id),
      )
    );
  }

  async obterCasoPorId(casoId: string): Promise<Caso | undefined> {
    const db = getDb();
    const [casosRows, partesRows, eventosRows] = await Promise.all([
      db.select().from(casos).where(eq(casos.id, casoId)),
      db.select().from(partes).where(eq(partes.casoId, casoId)),
      db.select().from(eventosCaso).where(eq(eventosCaso.casoId, casoId)),
    ]);

    if (casosRows.length === 0) return undefined;

    return mapRowToCaso(casosRows[0], partesRows, eventosRows);
  }
}
