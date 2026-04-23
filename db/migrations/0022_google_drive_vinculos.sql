CREATE TABLE IF NOT EXISTS google_drive_vinculos (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  drive_file_name TEXT NOT NULL,
  drive_mime_type TEXT,
  drive_web_view_link TEXT,
  tipo_entidade TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  entidade_label TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_drive_vinculos_user_id
  ON google_drive_vinculos (user_id);

CREATE INDEX IF NOT EXISTS idx_google_drive_vinculos_drive_file_id
  ON google_drive_vinculos (drive_file_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_google_drive_vinculos_unique_link
  ON google_drive_vinculos (user_id, drive_file_id, tipo_entidade, entidade_id);
