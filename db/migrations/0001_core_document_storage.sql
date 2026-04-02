CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS arquivo_fisico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('vercel_blob', 'mock')),
  provider_key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extensao TEXT NULL,
  tamanho_bytes BIGINT NOT NULL,
  sha256 TEXT NULL,
  checksum_algoritmo TEXT NOT NULL DEFAULT 'sha256',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arquivo_fisico_sha256 ON arquivo_fisico (sha256);
CREATE INDEX IF NOT EXISTS idx_arquivo_fisico_criado_em ON arquivo_fisico (criado_em DESC);
