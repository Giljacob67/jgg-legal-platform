import "server-only";

import { randomUUID } from "node:crypto";
import { getDataMode } from "@/lib/data-mode";
import { getSqlClient } from "@/lib/database/client";
import type { DriveExplorerVinculo } from "@/modules/drive-explorer/domain/types";

type TipoEntidadeDrive = "caso" | "pedido" | "cliente";

type CriarDriveExplorerVinculoInput = {
  userId: string;
  driveFileId: string;
  driveFileName: string;
  driveMimeType?: string;
  driveWebViewLink?: string;
  tipoEntidade: TipoEntidadeDrive;
  entidadeId: string;
  entidadeLabel: string;
};

const mockStore = new Map<string, DriveExplorerVinculo[]>();

function isTabelaVinculosDriveMissing(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("google_drive_vinculos") &&
    (
      error.message.includes("does not exist") ||
      error.message.includes("relation") ||
      error.message.includes("undefined_table")
    )
  );
}

function normalizarVinculo(row: {
  id: string;
  drive_file_id: string;
  drive_file_name: string;
  drive_mime_type: string | null;
  drive_web_view_link: string | null;
  tipo_entidade: TipoEntidadeDrive;
  entidade_id: string;
  entidade_label: string;
  criado_em: Date | string;
}): DriveExplorerVinculo {
  return {
    id: row.id,
    driveFileId: row.drive_file_id,
    driveFileName: row.drive_file_name,
    driveMimeType: row.drive_mime_type ?? undefined,
    driveWebViewLink: row.drive_web_view_link ?? undefined,
    tipoEntidade: row.tipo_entidade,
    entidadeId: row.entidade_id,
    entidadeLabel: row.entidade_label,
    criadoEm: row.criado_em instanceof Date ? row.criado_em.toISOString() : new Date(row.criado_em).toISOString(),
  };
}

export async function listarVinculosDriveExplorer(
  userId: string,
  filtro?: { driveFileIds?: string[] },
): Promise<DriveExplorerVinculo[]> {
  if (getDataMode() !== "real") {
    const items = mockStore.get(userId) ?? [];
    if (!filtro?.driveFileIds?.length) return items;
    const permitidos = new Set(filtro.driveFileIds);
    return items.filter((item) => permitidos.has(item.driveFileId));
  }

  try {
    const sql = getSqlClient();
    if (!filtro?.driveFileIds?.length) {
      const rows = await sql`
        SELECT id, drive_file_id, drive_file_name, drive_mime_type, drive_web_view_link,
               tipo_entidade, entidade_id, entidade_label, criado_em
        FROM google_drive_vinculos
        WHERE user_id = ${userId}
        ORDER BY criado_em DESC
      `;
      return rows.map((row) => normalizarVinculo(row as never));
    }

    const rows = await sql`
      SELECT id, drive_file_id, drive_file_name, drive_mime_type, drive_web_view_link,
             tipo_entidade, entidade_id, entidade_label, criado_em
      FROM google_drive_vinculos
      WHERE user_id = ${userId}
        AND drive_file_id = ANY(${sql.array(filtro.driveFileIds)})
      ORDER BY criado_em DESC
    `;
    return rows.map((row) => normalizarVinculo(row as never));
  } catch (error) {
    if (isTabelaVinculosDriveMissing(error)) {
      return [];
    }
    throw error;
  }
}

export async function criarVinculoDriveExplorer(
  input: CriarDriveExplorerVinculoInput,
): Promise<DriveExplorerVinculo> {
  if (getDataMode() !== "real") {
    const atual = mockStore.get(input.userId) ?? [];
    const existente = atual.find(
      (item) =>
        item.driveFileId === input.driveFileId &&
        item.tipoEntidade === input.tipoEntidade &&
        item.entidadeId === input.entidadeId,
    );
    if (existente) return existente;

    const novo: DriveExplorerVinculo = {
      id: `drv-vinc-${randomUUID()}`,
      driveFileId: input.driveFileId,
      driveFileName: input.driveFileName,
      driveMimeType: input.driveMimeType,
      driveWebViewLink: input.driveWebViewLink,
      tipoEntidade: input.tipoEntidade,
      entidadeId: input.entidadeId,
      entidadeLabel: input.entidadeLabel,
      criadoEm: new Date().toISOString(),
    };
    mockStore.set(input.userId, [novo, ...atual]);
    return novo;
  }

  const sql = getSqlClient();
  try {
    const existente = await sql`
      SELECT id, drive_file_id, drive_file_name, drive_mime_type, drive_web_view_link,
             tipo_entidade, entidade_id, entidade_label, criado_em
      FROM google_drive_vinculos
      WHERE user_id = ${input.userId}
        AND drive_file_id = ${input.driveFileId}
        AND tipo_entidade = ${input.tipoEntidade}
        AND entidade_id = ${input.entidadeId}
      LIMIT 1
    `;
    if (existente.length > 0) {
      return normalizarVinculo(existente[0] as never);
    }

    const rows = await sql`
      INSERT INTO google_drive_vinculos (
        id, user_id, drive_file_id, drive_file_name, drive_mime_type, drive_web_view_link,
        tipo_entidade, entidade_id, entidade_label
      )
      VALUES (
        ${randomUUID()}, ${input.userId}, ${input.driveFileId}, ${input.driveFileName},
        ${input.driveMimeType ?? null}, ${input.driveWebViewLink ?? null},
        ${input.tipoEntidade}, ${input.entidadeId}, ${input.entidadeLabel}
      )
      RETURNING id, drive_file_id, drive_file_name, drive_mime_type, drive_web_view_link,
                tipo_entidade, entidade_id, entidade_label, criado_em
    `;
    return normalizarVinculo(rows[0] as never);
  } catch (error) {
    if (isTabelaVinculosDriveMissing(error)) {
      throw new Error("A migration do vínculo operacional do Drive ainda não foi aplicada no banco.");
    }
    throw error;
  }
}
