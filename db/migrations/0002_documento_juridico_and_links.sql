DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_processamento_documental') THEN
    CREATE TYPE status_processamento_documental AS ENUM (
      'nao_iniciado',
      'enfileirado',
      'em_processamento',
      'processado_parcial',
      'processado',
      'erro'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS documento_juridico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo_fisico_id UUID NOT NULL REFERENCES arquivo_fisico(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  status_documento TEXT NOT NULL,
  status_processamento status_processamento_documental NOT NULL DEFAULT 'nao_iniciado',
  resumo_juridico TEXT NULL,
  metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documento_vinculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_juridico_id UUID NOT NULL REFERENCES documento_juridico(id) ON DELETE CASCADE,
  tipo_entidade TEXT NOT NULL CHECK (tipo_entidade IN ('caso', 'pedido_peca')),
  entidade_id TEXT NOT NULL,
  papel TEXT NOT NULL DEFAULT 'principal',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (documento_juridico_id, tipo_entidade, entidade_id)
);

CREATE INDEX IF NOT EXISTS idx_documento_vinculo_entidade ON documento_vinculo (tipo_entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_documento_juridico_status_proc ON documento_juridico (status_processamento, criado_em DESC);
