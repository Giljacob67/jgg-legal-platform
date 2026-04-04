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

    // 5. Inserir chunks com embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const vectorStr = `[${embedding.join(",")}]`;

      await sql`
        INSERT INTO biblioteca_chunks (id, documento_id, sequencia, conteudo, embedding)
        VALUES (
          gen_random_uuid()::TEXT,
          ${documentoId},
          ${chunk.sequencia},
          ${chunk.conteudo},
          ${vectorStr}::vector
        )
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
