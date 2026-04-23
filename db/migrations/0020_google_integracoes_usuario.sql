CREATE TABLE IF NOT EXISTS google_integracoes_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_google varchar(255),
  access_token text NOT NULL,
  refresh_token text,
  token_type varchar(50),
  scope text,
  expiry_date timestamptz,
  selected_calendar_id varchar(255),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS google_integracoes_usuario_user_unique
  ON google_integracoes_usuario (user_id);

CREATE INDEX IF NOT EXISTS idx_google_integracoes_usuario_email
  ON google_integracoes_usuario (email_google);
