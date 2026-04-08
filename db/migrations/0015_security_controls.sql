CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(100),
  acao VARCHAR(80) NOT NULL,
  recurso VARCHAR(120) NOT NULL,
  recurso_id TEXT,
  resultado VARCHAR(30) NOT NULL,
  detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip VARCHAR(80),
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_data
  ON audit_log (user_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_recurso_data
  ON audit_log (recurso, recurso_id, criado_em DESC);

CREATE TABLE IF NOT EXISTS api_rate_limit (
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limit_updated_at
  ON api_rate_limit (updated_at DESC);

CREATE TABLE IF NOT EXISTS pipeline_execution_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id VARCHAR(50) NOT NULL,
  estagio VARCHAR(80) NOT NULL,
  user_id TEXT NOT NULL,
  input_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL,
  schema_valid BOOLEAN,
  rag_degraded BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pipeline_execution_control_lookup
  ON pipeline_execution_control (pedido_id, estagio, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pipeline_execution_control_input_hash
  ON pipeline_execution_control (pedido_id, estagio, input_hash, created_at DESC);
