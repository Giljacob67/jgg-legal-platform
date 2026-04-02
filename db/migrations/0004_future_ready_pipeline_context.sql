CREATE TABLE IF NOT EXISTS pedido_pipeline_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id TEXT NOT NULL,
  etapa TEXT NOT NULL,
  versao INT NOT NULL DEFAULT 1,
  entrada_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  saida JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_pipeline_snapshot_pedido ON pedido_pipeline_snapshot (pedido_id, etapa, versao DESC);

CREATE TABLE IF NOT EXISTS pedido_contexto_juridico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id TEXT NOT NULL UNIQUE,
  versao_contexto INT NOT NULL DEFAULT 1,
  contexto JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
