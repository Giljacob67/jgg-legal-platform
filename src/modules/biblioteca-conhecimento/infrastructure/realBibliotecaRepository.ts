import "server-only";

import { getSqlClient } from "@/lib/database/client";
import type {
  DocumentoBiblioteca,
  FonteDocumentoBC,
  StatusEmbedding,
  TipoDocumentoBC,
} from "@/modules/biblioteca-conhecimento/domain/types";

type BibliotecaRow = {
  id: string;
  titulo: string;
  tipo: string;
  subtipo: string | null;
  fonte: string;
  drive_file_id: string | null;
  drive_folder_path: string | null;
  url_arquivo: string | null;
  mime_type: string | null;
  tamanho_bytes: number | null;
  chunks_gerados: number;
  embedding_status: string;
  erro_processamento: string | null;
  processado_em: string | null;
  criado_em: string;
};

function mapRow(row: BibliotecaRow): DocumentoBiblioteca {
  return {
    id: row.id,
    titulo: row.titulo,
    tipo: row.tipo as TipoDocumentoBC,
    subtipo: row.subtipo ?? undefined,
    fonte: row.fonte as FonteDocumentoBC,
    driveFileId: row.drive_file_id ?? undefined,
    driveFolderPath: row.drive_folder_path ?? undefined,
    urlArquivo: row.url_arquivo ?? undefined,
    mimeType: row.mime_type ?? undefined,
    tamanhoBytes: row.tamanho_bytes ?? undefined,
    chunksGerados: row.chunks_gerados,
    embeddingStatus: row.embedding_status as StatusEmbedding,
    erroProcessamento: row.erro_processamento ?? undefined,
    processadoEm: row.processado_em ?? undefined,
    criadoEm: row.criado_em,
  };
}

export class RealBibliotecaRepository {
  async listar(filtros?: {
    tipo?: TipoDocumentoBC;
    fonte?: string;
    status?: StatusEmbedding;
  }): Promise<DocumentoBiblioteca[]> {
    const sql = getSqlClient();
    const rows = await sql<BibliotecaRow[]>`
      SELECT *
      FROM biblioteca_documentos
      WHERE
        (${filtros?.tipo ?? null} IS NULL OR tipo = ${filtros?.tipo ?? null})
        AND (${filtros?.fonte ?? null} IS NULL OR fonte = ${filtros?.fonte ?? null})
        AND (${filtros?.status ?? null} IS NULL OR embedding_status = ${filtros?.status ?? null})
      ORDER BY criado_em DESC
    `;
    return rows.map(mapRow);
  }

  async encontrarPorDriveId(driveFileId: string): Promise<DocumentoBiblioteca | null> {
    const sql = getSqlClient();
    const [row] = await sql<BibliotecaRow[]>`
      SELECT * FROM biblioteca_documentos
      WHERE drive_file_id = ${driveFileId}
      LIMIT 1
    `;
    return row ? mapRow(row) : null;
  }

  async criar(
    dados: Omit<DocumentoBiblioteca, "id" | "criadoEm" | "chunksGerados" | "embeddingStatus">,
  ): Promise<DocumentoBiblioteca> {
    const sql = getSqlClient();
    const [row] = await sql<BibliotecaRow[]>`
      INSERT INTO biblioteca_documentos (
        id, titulo, tipo, subtipo, fonte,
        drive_file_id, drive_folder_path, url_arquivo,
        mime_type, tamanho_bytes,
        chunks_gerados, embedding_status
      )
      VALUES (
        gen_random_uuid()::TEXT,
        ${dados.titulo},
        ${dados.tipo},
        ${dados.subtipo ?? null},
        ${dados.fonte},
        ${dados.driveFileId ?? null},
        ${dados.driveFolderPath ?? null},
        ${dados.urlArquivo ?? null},
        ${dados.mimeType ?? null},
        ${dados.tamanhoBytes ?? null},
        0,
        'pendente'
      )
      RETURNING *
    `;
    return mapRow(row);
  }

  async atualizarStatus(
    id: string,
    status: StatusEmbedding,
    chunksGerados?: number,
    erro?: string,
  ): Promise<void> {
    const sql = getSqlClient();
    await sql`
      UPDATE biblioteca_documentos
      SET
        embedding_status    = ${status},
        chunks_gerados      = COALESCE(${chunksGerados ?? null}, chunks_gerados),
        erro_processamento  = ${erro ?? null},
        processado_em       = CASE WHEN ${status} = 'concluido' THEN NOW() ELSE processado_em END
      WHERE id = ${id}
    `;
  }

  async remover(id: string): Promise<void> {
    const sql = getSqlClient();
    await sql`DELETE FROM biblioteca_documentos WHERE id = ${id}`;
  }

  async contar(): Promise<{
    total: number;
    concluidos: number;
    pendentes: number;
    erros: number;
    chunks: number;
  }> {
    const sql = getSqlClient();
    const [row] = await sql<
      [{ total: string; concluidos: string; pendentes: string; erros: string; chunks: string }]
    >`
      SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE embedding_status = 'concluido') AS concluidos,
        COUNT(*) FILTER (WHERE embedding_status = 'pendente')  AS pendentes,
        COUNT(*) FILTER (WHERE embedding_status = 'erro')      AS erros,
        COALESCE(SUM(chunks_gerados), 0)                       AS chunks
      FROM biblioteca_documentos
    `;
    return {
      total: Number(row.total),
      concluidos: Number(row.concluidos),
      pendentes: Number(row.pendentes),
      erros: Number(row.erros),
      chunks: Number(row.chunks),
    };
  }
}
