-- db/migrations/0013_pgvector_biblioteca.sql
-- Ativa extensão pgvector e cria tabela de chunks da biblioteca de conhecimento.
-- Modelo fixo: text-embedding-3-small (OpenAI via OpenRouter) — dimensão 1536.
-- ATENÇÃO: Trocar o modelo exige recriar a coluna e reprocessar todos os chunks.

CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de chunks da biblioteca de conhecimento
CREATE TABLE IF NOT EXISTS biblioteca_chunks (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  documento_id TEXT NOT NULL,
  sequencia    INTEGER NOT NULL,
  conteudo     TEXT NOT NULL,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adiciona coluna embedding (idempotente via DO)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'biblioteca_chunks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE biblioteca_chunks ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- Índice de similaridade por cosseno (IVFFlat)
CREATE INDEX IF NOT EXISTS biblioteca_chunks_embedding_idx
  ON biblioteca_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Índice auxiliar para busca por documento
CREATE INDEX IF NOT EXISTS biblioteca_chunks_documento_id_idx
  ON biblioteca_chunks (documento_id);
