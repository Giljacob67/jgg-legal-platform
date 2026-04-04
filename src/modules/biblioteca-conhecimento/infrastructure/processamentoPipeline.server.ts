/**
 * Pipeline de processamento de documentos para a Biblioteca de Conhecimento.
 * Extrai texto, divide em chunks, gera embeddings via OpenRouter e persiste no pgvector.
 * Server-side only.
 */

import { getBibliotecaRepo } from "./mockBibliotecaRepository";
import { extrairTexto } from "./textExtractor.server";
import { dividirEmChunks } from "./chunkingService";
import { gerarEmbeddingsLote } from "@/lib/ai/embeddings";
import { getSqlClient } from "@/lib/database/client";

export async function processarDocumento(
  documentoId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ chunksGerados: number }> {
  const repo = getBibliotecaRepo();

  await repo.atualizarStatus(documentoId, "processando");

  try {
    // 1. Extrair texto
    const texto = await extrairTexto(buffer, mimeType);

    if (!texto || texto.length < 20) {
      await repo.atualizarStatus(documentoId, "erro", 0, "Texto extraído vazio ou muito curto.");
      return { chunksGerados: 0 };
    }

    // 2. Dividir em chunks
    const chunks = dividirEmChunks(texto);

    // 3. Gerar embeddings em lote
    const conteudos = chunks.map((c) => c.conteudo);
    const embeddings = await gerarEmbeddingsLote(conteudos);

    const sql = getSqlClient();

    // 4. Deletar chunks anteriores do documento (re-processamento idempotente)
    await sql`DELETE FROM biblioteca_chunks WHERE documento_id = ${documentoId}`;

    // 5. Inserir chunks com embeddings em lote
    if (chunks.length > 0) {
      const rows = chunks.map((chunk, i) => ({
        documentoId,
        sequencia: chunk.sequencia,
        conteudo: chunk.conteudo,
        vectorStr: `[${embeddings[i].join(",")}]`,
      }));

      await sql`
        INSERT INTO biblioteca_chunks (id, documento_id, sequencia, conteudo, embedding)
        SELECT
          gen_random_uuid()::TEXT,
          t.documento_id,
          t.sequencia,
          t.conteudo,
          t.vector_str::vector
        FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
          AS t(documento_id TEXT, sequencia INT, conteudo TEXT, vector_str TEXT)
      `;
    }

    // 6. Atualizar status
    await repo.atualizarStatus(documentoId, "concluido", chunks.length);

    return { chunksGerados: chunks.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido no processamento.";
    await repo.atualizarStatus(documentoId, "erro", 0, msg);
    throw error;
  }
}
