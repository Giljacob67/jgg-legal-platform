DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'etapa_processamento_documental') THEN
    CREATE TYPE etapa_processamento_documental AS ENUM (
      'leitura',
      'classificacao',
      'resumo',
      'extracao_fatos'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_execucao_etapa') THEN
    CREATE TYPE status_execucao_etapa AS ENUM (
      'pendente',
      'em_andamento',
      'sucesso',
      'falha',
      'parcial'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS documento_processamento_etapa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_juridico_id UUID NOT NULL REFERENCES documento_juridico(id) ON DELETE CASCADE,
  etapa etapa_processamento_documental NOT NULL,
  status status_execucao_etapa NOT NULL,
  tentativa INT NOT NULL DEFAULT 1,
  codigo_erro TEXT NULL,
  mensagem_erro TEXT NULL,
  entrada_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  saida JSONB NOT NULL DEFAULT '{}'::jsonb,
  iniciado_em TIMESTAMPTZ NULL,
  finalizado_em TIMESTAMPTZ NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_etapa_doc_etapa ON documento_processamento_etapa (documento_juridico_id, etapa, tentativa DESC);
CREATE INDEX IF NOT EXISTS idx_proc_etapa_status ON documento_processamento_etapa (status, criado_em DESC);
