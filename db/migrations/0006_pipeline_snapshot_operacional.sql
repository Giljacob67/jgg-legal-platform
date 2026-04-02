DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pedido_pipeline_snapshot'
      AND column_name = 'saida'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pedido_pipeline_snapshot'
      AND column_name = 'saida_estruturada'
  ) THEN
    ALTER TABLE pedido_pipeline_snapshot
      RENAME COLUMN saida TO saida_estruturada;
  END IF;
END $$;

ALTER TABLE pedido_pipeline_snapshot
ADD COLUMN IF NOT EXISTS saida_estruturada JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE pedido_pipeline_snapshot
ADD COLUMN IF NOT EXISTS executado_em TIMESTAMPTZ NULL;

ALTER TABLE pedido_pipeline_snapshot
ADD COLUMN IF NOT EXISTS codigo_erro TEXT NULL;

ALTER TABLE pedido_pipeline_snapshot
ADD COLUMN IF NOT EXISTS mensagem_erro TEXT NULL;

ALTER TABLE pedido_pipeline_snapshot
ADD COLUMN IF NOT EXISTS tentativa INT NOT NULL DEFAULT 1;

UPDATE pedido_pipeline_snapshot
SET executado_em = COALESCE(executado_em, criado_em)
WHERE executado_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_pipeline_snapshot_status_data
  ON pedido_pipeline_snapshot (status, executado_em DESC);
