import "server-only";
import { getSqlClient } from "@/lib/database/client";
import { gerarEmbedding } from "@/lib/ai/embeddings";

export interface ChunkRelevante {
  id: string;
  conteudo: string;
  documentoId: string;
  similaridade: number;
}

/**
 * Busca chunks da biblioteca de conhecimento semanticamente próximos à query.
 * Usa pgvector com distância de cosseno (operador <=>).
 */
export async function buscarChunksRelevantes(
  query: string,
  limite: number = 5,
): Promise<ChunkRelevante[]> {
  const embedding = await gerarEmbedding(query);
  const vectorStr = `[${embedding.join(",")}]`;
  const sql = getSqlClient();

  const rows = await sql<{
    id: string;
    conteudo: string;
    documento_id: string;
    similaridade: number;
  }[]>`
    SELECT
      id,
      conteudo,
      documento_id,
      1 - (embedding <=> ${vectorStr}::vector) AS similaridade
    FROM biblioteca_chunks
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limite}
  `;

  return rows.map((row) => ({
    id: row.id,
    conteudo: row.conteudo,
    documentoId: row.documento_id,
    similaridade: row.similaridade,
  }));
}
