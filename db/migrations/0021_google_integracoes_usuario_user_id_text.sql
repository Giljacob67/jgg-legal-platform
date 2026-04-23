ALTER TABLE google_integracoes_usuario
  DROP CONSTRAINT IF EXISTS google_integracoes_usuario_user_id_users_id_fk;

ALTER TABLE google_integracoes_usuario
  ALTER COLUMN user_id TYPE text USING user_id::text;
