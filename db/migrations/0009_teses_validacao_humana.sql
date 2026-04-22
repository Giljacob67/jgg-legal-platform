ALTER TABLE pedido_contexto_juridico_versao
  ADD COLUMN IF NOT EXISTS teses JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE pedido_contexto_juridico_versao
  ADD COLUMN IF NOT EXISTS validacao_humana_teses_pendente BOOLEAN NOT NULL DEFAULT TRUE;
