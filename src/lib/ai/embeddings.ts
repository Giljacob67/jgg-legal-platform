import { embedMany, embed } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Modelo fixo: text-embedding-3-small via OpenRouter — dimensão 1536
// ATENÇÃO: trocar o modelo exige recriar a coluna vector(1536) e reprocessar todos os chunks
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

function getEmbeddingProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-or-...") || apiKey.length <= 10) {
    throw new Error("OPENROUTER_API_KEY não configurada para geração de embeddings");
  }

  return createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

/**
 * Gera embedding para um único texto.
 * Use `gerarEmbeddingsLote` para múltiplos textos (mais eficiente).
 */
export async function gerarEmbedding(texto: string): Promise<number[]> {
  const provider = getEmbeddingProvider();
  const { embedding } = await embed({
    model: provider.embedding(EMBEDDING_MODEL),
    value: texto,
  });
  return embedding;
}

/**
 * Gera embeddings para múltiplos textos em lote.
 * Retorna array de embeddings na mesma ordem dos textos de entrada.
 */
export async function gerarEmbeddingsLote(textos: string[]): Promise<number[][]> {
  if (textos.length === 0) return [];

  const provider = getEmbeddingProvider();
  const { embeddings } = await embedMany({
    model: provider.embedding(EMBEDDING_MODEL),
    values: textos,
  });
  return embeddings;
}
