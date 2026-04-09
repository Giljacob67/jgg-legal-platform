-- Migration: 0015_jsonb_conversion_and_constraints
-- Converte colunas TEXT (JSON stringified) → JSONB para permitir queries estruturais.
-- Converte VARCHAR de datas → DATE/TIMESTAMPTZ para permitir aritmética de datas.
-- Adiciona CHECK constraints para campos de domínio.
-- Data: 2026-04-09

BEGIN;

-- ─── Jurisprudência: TEXT JSON → JSONB ────────────────────────────
ALTER TABLE jurisprudencia
  ALTER COLUMN materias_json TYPE JSONB
  USING materias_json::jsonb,
  ALTER COLUMN fundamentos_legais_json TYPE JSONB
  USING fundamentos_legais_json::jsonb;

CREATE INDEX IF NOT EXISTS idx_jurisprudencia_tribunal
  ON jurisprudencia (tribunal);
CREATE INDEX IF NOT EXISTS idx_jurisprudencia_tipo
  ON jurisprudencia (tipo);
CREATE INDEX IF NOT EXISTS idx_jurisprudencia_relevancia
  ON jurisprudencia (relevancia DESC);

-- ─── Jurisprudência: VARCHAR date → DATE ──────────────────────────
ALTER TABLE jurisprudencia
  ALTER COLUMN data_julgamento TYPE DATE
  USING NULLIF(data_julgamento, '')::date;

-- ─── Contratos: TEXT JSON → JSONB ────────────────────────────────
ALTER TABLE contratos
  ALTER COLUMN partes_json TYPE JSONB
  USING partes_json::jsonb,
  ALTER COLUMN clausulas_json TYPE JSONB
  USING clausulas_json::jsonb,
  ALTER COLUMN versoes_json TYPE JSONB
  USING versoes_json::jsonb,
  ALTER COLUMN analise_risco_json TYPE JSONB
  USING NULLIF(analise_risco_json, '')::jsonb;

-- ─── Contratos: VARCHAR dates → DATE ─────────────────────────────
ALTER TABLE contratos
  ALTER COLUMN vigencia_inicio TYPE DATE
  USING NULLIF(vigencia_inicio, '')::date,
  ALTER COLUMN vigencia_fim TYPE DATE
  USING NULLIF(vigencia_fim, '')::date;

-- ─── Clientes: TEXT JSON → JSONB ──────────────────────────────────
ALTER TABLE clientes
  ALTER COLUMN endereco_json TYPE JSONB
  USING NULLIF(endereco_json, '')::jsonb;

-- ─── CHECK CONSTRAINTS ─────────────────────────────────────────────

-- Status de casos
ALTER TABLE casos
  ADD CONSTRAINT casos_status_check
  CHECK (status IN ('novo', 'em_analise', 'em_tramitacao', 'suspenso', 'arquivado', 'improcedente', 'procedente', 'parcialmente_procedente'))
  NOT VALID; -- dados existentes podem violar; validar sem bloquear

-- Status de pedidos de peça
ALTER TABLE pedidos_peca
  ADD CONSTRAINT pedidos_peca_status_check
  CHECK (status IN ('novo', 'em_triagem', 'em_producao', 'em_revisao', 'aprovado', 'rejeitado', 'cancelado'))
  NOT VALID;

-- Status de contratos
ALTER TABLE contratos
  ADD CONSTRAINT contratos_status_check
  CHECK (status IN ('rascunho', 'em_negociacao', 'em_aprovacao', 'ativo', 'renovado', 'encerrado', 'rescindido', 'anulado'))
  NOT VALID;

-- Tipo de cliente
ALTER TABLE clientes
  ADD CONSTRAINT clientes_tipo_check
  CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica'))
  NOT VALID;

-- Status de cliente
ALTER TABLE clientes
  ADD CONSTRAINT clientes_status_check
  CHECK (status IN ('ativo', 'inativo', 'suspenso', 'emandamento'))
  NOT VALID;

-- Papel das partes
ALTER TABLE partes
  ADD CONSTRAINT partes_papel_check
  CHECK (papel IN ('autor', 'reu', 'terceiro_interessado', 'testemunha', 'perito', 'advogado_oposto'))
  NOT VALID;

-- Categoria de checklist
ALTER TABLE checklist_juridico_versao
  ADD CONSTRAINT checklist_categoria_check
  CHECK (categoria IN ('obrigatorio', 'recomendavel'))
  NOT VALID;

-- Valida constraints (não bloqueia dados existentes, apenas registra violação)
-- ALTER TABLE casos VALIDATE CONSTRAINT casos_status_check;
-- ALTER TABLE pedidos_peca VALIDATE CONSTRAINT pedidos_peca_status_check;
-- ALTER TABLE contratos VALIDATE CONSTRAINT contratos_status_check;
-- ALTER TABLE clientes VALIDATE CONSTRAINT clientes_tipo_check;
-- ALTER TABLE partes VALIDATE CONSTRAINT partes_papel_check;

COMMIT;

-- Nota: Execute "VALIDATE CONSTRAINT" separadamente em janela de manutenção
-- para evitar lock em tabelas com muitos dados:
--
-- ALTER TABLE casos VALIDATE CONSTRAINT casos_status_check;
-- ALTER TABLE pedidos_peca VALIDATE CONSTRAINT pedidos_peca_status_check;
-- ALTER TABLE contratos VALIDATE CONSTRAINT contratos_status_check;
-- ALTER TABLE clientes VALIDATE CONSTRAINT clientes_tipo_check;
-- ALTER TABLE partes VALIDATE CONSTRAINT partes_papel_check;
