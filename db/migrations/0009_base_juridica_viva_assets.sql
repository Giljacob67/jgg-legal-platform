CREATE TABLE IF NOT EXISTS template_juridico_versao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  versao INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')),
  tipos_peca_canonica JSONB NOT NULL DEFAULT '[]'::jsonb,
  materias JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocos JSONB NOT NULL DEFAULT '[]'::jsonb,
  clausulas_base JSONB NOT NULL DEFAULT '{}'::jsonb,
  especializacao_materia JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (codigo, versao)
);

CREATE INDEX IF NOT EXISTS idx_template_juridico_codigo_versao
  ON template_juridico_versao (codigo, versao DESC);

CREATE INDEX IF NOT EXISTS idx_template_juridico_status
  ON template_juridico_versao (status, atualizado_em DESC);

CREATE TABLE IF NOT EXISTS tese_juridica_versao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  versao INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')),
  tipos_peca_canonica JSONB NOT NULL DEFAULT '[]'::jsonb,
  materias JSONB NOT NULL DEFAULT '[]'::jsonb,
  palavras_chave JSONB NOT NULL DEFAULT '[]'::jsonb,
  gatilhos JSONB NOT NULL DEFAULT '[]'::jsonb,
  tese_base TEXT NOT NULL,
  fundamento_sintetico TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (codigo, versao)
);

CREATE INDEX IF NOT EXISTS idx_tese_juridica_codigo_versao
  ON tese_juridica_versao (codigo, versao DESC);

CREATE INDEX IF NOT EXISTS idx_tese_juridica_status
  ON tese_juridica_versao (status, atualizado_em DESC);

CREATE TABLE IF NOT EXISTS checklist_juridico_versao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('obrigatorio', 'recomendavel')),
  bloco_esperado TEXT NOT NULL,
  versao INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')),
  tipos_peca_canonica JSONB NOT NULL DEFAULT '[]'::jsonb,
  materias JSONB NOT NULL DEFAULT '[]'::jsonb,
  tokens_esperados JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (codigo, versao)
);

CREATE INDEX IF NOT EXISTS idx_checklist_juridico_codigo_versao
  ON checklist_juridico_versao (codigo, versao DESC);

CREATE INDEX IF NOT EXISTS idx_checklist_juridico_status
  ON checklist_juridico_versao (status, atualizado_em DESC);
