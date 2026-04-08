CREATE TABLE IF NOT EXISTS teses_juridicas (
  id VARCHAR(100) PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tese_base TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_teses_juridicas_codigo
  ON teses_juridicas (codigo);

CREATE INDEX IF NOT EXISTS idx_teses_juridicas_status
  ON teses_juridicas (status);
