import { getDb, getSqlClient } from "@/lib/database/client";
import { casos, partes, eventosCaso } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type { Caso, StatusCaso, Parte, EventoCaso } from "@/modules/casos/domain/types";
import type { CasosRepository, NovoCasoPayload, AtualizarCasoPayload } from "@/modules/casos/infrastructure/mockCasosRepository";

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

  async criarCaso(payload: NovoCasoPayload): Promise<Caso> {
    const db = getDb();

    // Gerar ID sequencial baseado no ano atual
    const ano = new Date().getFullYear();
    const existentes = await db.select({ id: casos.id }).from(casos);
    const seq = existentes.length + 1;
    const novoCasoId = `CAS-${ano}-${seq.toString().padStart(3, "0")}`;

    await db.insert(casos).values({
      id: novoCasoId,
      titulo: payload.titulo,
      cliente: payload.cliente,
      materia: payload.materia,
      tribunal: payload.tribunal ?? null,
      status: "novo",
      prazoFinal: payload.prazoFinal ? new Date(payload.prazoFinal) : null,
      resumo: payload.resumo ?? null,
    });

    if (payload.partes && payload.partes.length > 0) {
      await db.insert(partes).values(
        payload.partes.map((parte) => ({
          casoId: novoCasoId,
          nome: parte.nome,
          papel: parte.papel,
        })),
      );
    }

    const caso = await this.obterCasoPorId(novoCasoId);
    if (!caso) throw new Error("Erro ao recuperar caso recém-criado.");
    return caso;
  }

  async atualizarCaso(casoId: string, payload: AtualizarCasoPayload): Promise<Caso> {
    const db = getDb();

    const existing = await db.select().from(casos).where(eq(casos.id, casoId));
    if (existing.length === 0) throw new Error(`Caso ${casoId} não encontrado.`);

    await db
      .update(casos)
      .set({
        ...(payload.titulo !== undefined && { titulo: payload.titulo }),
        ...(payload.cliente !== undefined && { cliente: payload.cliente }),
        ...(payload.materia !== undefined && { materia: payload.materia }),
        ...(payload.tribunal !== undefined && { tribunal: payload.tribunal }),
        ...(payload.prazoFinal !== undefined && { prazoFinal: payload.prazoFinal ? new Date(payload.prazoFinal) : null }),
        ...(payload.resumo !== undefined && { resumo: payload.resumo }),
        ...(payload.status !== undefined && { status: payload.status }),
      })
      .where(eq(casos.id, casoId));

    if (payload.partes !== undefined) {
      await db.delete(partes).where(eq(partes.casoId, casoId));
      if (payload.partes.length > 0) {
        await db.insert(partes).values(
          payload.partes.map((p) => ({
            casoId,
            nome: p.nome,
            papel: p.papel,
          })),
        );
      }
    }

    const caso = await this.obterCasoPorId(casoId);
    if (!caso) throw new Error("Erro ao recuperar caso após atualização.");
    return caso;
  }

  async excluirCaso(casoId: string): Promise<void> {
    const db = getDb();
    const existing = await db.select({ id: casos.id }).from(casos).where(eq(casos.id, casoId));
    if (existing.length === 0) throw new Error(`Caso ${casoId} não encontrado.`);
    await db.delete(casos).where(eq(casos.id, casoId));
  }
}
