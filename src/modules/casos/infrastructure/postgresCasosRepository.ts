import { getDb } from "@/lib/database/client";
import { casos } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type { Caso, StatusCaso, EventoCaso, Parte } from "@/modules/casos/domain/types";
import type { CasosRepository } from "@/modules/casos/infrastructure/mockCasosRepository";

export class PostgresCasosRepository implements CasosRepository {
  async listarCasos(): Promise<Caso[]> {
    const db = getDb();
    const rows = await db.select().from(casos);
    
    // In a real application, you would also join or fetch `partes` and `eventosCaso` 
    // using Drizzle relations. For this first migration step, we map the base fields.
    return rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      cliente: row.cliente,
      materia: row.materia,
      tribunal: row.tribunal ?? "",
      status: row.status as StatusCaso,
      prazoFinal: row.prazoFinal ? row.prazoFinal.toISOString().split("T")[0] : "",
      resumo: row.resumo ?? "",
      partes: [], // To be populated by relations
      documentosRelacionados: [],
      eventos: [], // To be populated by relations
    }));
  }

  async obterCasoPorId(casoId: string): Promise<Caso | undefined> {
    const db = getDb();
    const rows = await db.select().from(casos).where(eq(casos.id, casoId));
    
    if (rows.length === 0) return undefined;
    
    const row = rows[0];
    return {
      id: row.id,
      titulo: row.titulo,
      cliente: row.cliente,
      materia: row.materia,
      tribunal: row.tribunal ?? "",
      status: row.status as StatusCaso,
      prazoFinal: row.prazoFinal ? row.prazoFinal.toISOString().split("T")[0] : "",
      resumo: row.resumo ?? "",
      partes: [], 
      documentosRelacionados: [],
      eventos: [], 
    };
  }
}
