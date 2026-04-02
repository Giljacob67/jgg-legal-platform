ALTER TABLE documento_juridico
ADD COLUMN IF NOT EXISTS texto_extraido TEXT NULL;

ALTER TABLE documento_juridico
ADD COLUMN IF NOT EXISTS texto_normalizado TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_documento_juridico_atualizado_em
  ON documento_juridico (atualizado_em DESC);
