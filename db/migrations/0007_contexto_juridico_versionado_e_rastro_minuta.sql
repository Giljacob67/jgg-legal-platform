CREATE TABLE IF NOT EXISTS pedido_contexto_juridico_versao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id TEXT NOT NULL,
  versao_contexto INT NOT NULL,
  fatos_relevantes JSONB NOT NULL DEFAULT '[]'::jsonb,
  cronologia JSONB NOT NULL DEFAULT '[]'::jsonb,
  pontos_controvertidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  documentos_chave JSONB NOT NULL DEFAULT '[]'::jsonb,
  referencias_documentais JSONB NOT NULL DEFAULT '[]'::jsonb,
  estrategia_sugerida TEXT NOT NULL DEFAULT '',
  fontes_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pedido_id, versao_contexto)
);

CREATE INDEX IF NOT EXISTS idx_contexto_juridico_versao_pedido
  ON pedido_contexto_juridico_versao (pedido_id, versao_contexto DESC);

CREATE TABLE IF NOT EXISTS minuta_versao_contexto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minuta_id TEXT NOT NULL,
  versao_id TEXT NOT NULL,
  pedido_id TEXT NOT NULL,
  numero_versao INT NOT NULL,
  contexto_versao INT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (versao_id)
);

CREATE INDEX IF NOT EXISTS idx_minuta_versao_contexto_pedido
  ON minuta_versao_contexto (pedido_id, contexto_versao DESC);
