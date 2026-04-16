-- Migration 0019: coluna embedding + índice HNSW para busca semântica em jurisprudência

ALTER TABLE jurisprudencia
  ADD COLUMN IF NOT EXISTS embedding_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Índice HNSW para busca por similaridade coseno (rápido para até ~1M registros)
CREATE INDEX IF NOT EXISTS jurisprudencia_embedding_hnsw_idx
  ON jurisprudencia USING hnsw (embedding vector_cosine_ops);
