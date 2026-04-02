ALTER TABLE minuta_versao_contexto
ADD COLUMN IF NOT EXISTS template_id TEXT NULL;

ALTER TABLE minuta_versao_contexto
ADD COLUMN IF NOT EXISTS template_nome TEXT NULL;

ALTER TABLE minuta_versao_contexto
ADD COLUMN IF NOT EXISTS template_versao INT NULL;

ALTER TABLE minuta_versao_contexto
ADD COLUMN IF NOT EXISTS tipo_peca_canonica TEXT NULL;

ALTER TABLE minuta_versao_contexto
ADD COLUMN IF NOT EXISTS materia_canonica TEXT NULL;

ALTER TABLE minuta_versao_contexto
ADD COLUMN IF NOT EXISTS referencias_documentais JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE minuta_versao_contexto
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_minuta_versao_contexto_template
  ON minuta_versao_contexto (template_id, template_versao DESC);
