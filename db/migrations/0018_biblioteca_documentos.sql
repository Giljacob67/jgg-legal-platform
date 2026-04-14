-- Migration 0018: Tabela de metadados de documentos da biblioteca de conhecimento.
-- Complementa biblioteca_chunks (0013) com metadados persistidos para o repo real.

CREATE TABLE IF NOT EXISTS biblioteca_documentos (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  titulo            VARCHAR(255) NOT NULL,
  tipo              VARCHAR(50)  NOT NULL,
  subtipo           VARCHAR(100),
  fonte             VARCHAR(50)  NOT NULL DEFAULT 'upload_manual',
  drive_file_id     TEXT,
  drive_folder_path TEXT,
  url_arquivo       TEXT,
  mime_type         VARCHAR(100),
  tamanho_bytes     BIGINT,
  chunks_gerados    INTEGER NOT NULL DEFAULT 0,
  embedding_status  VARCHAR(20)  NOT NULL DEFAULT 'pendente',
  erro_processamento TEXT,
  processado_em     TIMESTAMPTZ,
  criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para deduplicação por driveFileId
CREATE UNIQUE INDEX IF NOT EXISTS idx_biblioteca_documentos_drive_file_id
  ON biblioteca_documentos (drive_file_id)
  WHERE drive_file_id IS NOT NULL;

-- Índice por status para fila de processamento
CREATE INDEX IF NOT EXISTS idx_biblioteca_documentos_embedding_status
  ON biblioteca_documentos (embedding_status);

-- FK de biblioteca_chunks → biblioteca_documentos (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'biblioteca_chunks_documento_id_fkey'
      AND table_name = 'biblioteca_chunks'
  ) THEN
    ALTER TABLE biblioteca_chunks
      ADD CONSTRAINT biblioteca_chunks_documento_id_fkey
      FOREIGN KEY (documento_id) REFERENCES biblioteca_documentos(id) ON DELETE CASCADE;
  END IF;
END $$;
