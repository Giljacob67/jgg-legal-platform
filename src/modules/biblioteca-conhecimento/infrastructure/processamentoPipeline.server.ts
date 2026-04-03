/**
 * Pipeline de processamento de documentos para a Biblioteca de Conhecimento.
 * Extrai texto, divide em chunks e (se OpenAI disponível) gera embeddings.
 * Server-side only.
 */

import { getBibliotecaRepo } from "./mockBibliotecaRepository";
import { extrairTexto } from "./textExtractor.server";
import { dividirEmChunks } from "./chunkingService";

// Simula armazenamento de chunks em memória (prod: pgvector)
const chunksStore: Map<string, { sequencia: number; conteudo: string }[]> = new Map();

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

    // 3. Armazenar chunks (em prod: gerar embeddings + salvar no pgvector)
    chunksStore.set(documentoId, chunks);

    // TODO (prod): para cada chunk, chamar openaiEmbeddings() e salvar na tabela base_conhecimento_chunks

    // 4. Atualizar status
    await repo.atualizarStatus(documentoId, "concluido", chunks.length);

    return { chunksGerados: chunks.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido no processamento.";
    await repo.atualizarStatus(documentoId, "erro", 0, msg);
    throw error;
  }
}

/** Recupera chunks de um documento (para debug/visualização). */
export function obterChunks(documentoId: string) {
  return chunksStore.get(documentoId) ?? [];
}
