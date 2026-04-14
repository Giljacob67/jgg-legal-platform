-- Migration 0017: converter campos text → jsonb onde o banco já armazenava JSON
-- Corrige mismatch entre schema Drizzle (text) e banco real (jsonb conforme migration 0014).
-- Feito com USING para conversão segura do conteúdo existente.

-- ── contratos ──────────────────────────────────────────────────────────────────

ALTER TABLE contratos
  ALTER COLUMN partes_json TYPE JSONB
    USING CASE
      WHEN partes_json IS NULL THEN '[]'::jsonb
      WHEN partes_json ~ '^\s*[\[\{]' THEN partes_json::jsonb
      ELSE '[]'::jsonb
    END,
  ALTER COLUMN clausulas_json TYPE JSONB
    USING CASE
      WHEN clausulas_json IS NULL THEN '[]'::jsonb
      WHEN clausulas_json ~ '^\s*[\[\{]' THEN clausulas_json::jsonb
      ELSE '[]'::jsonb
    END,
  ALTER COLUMN versoes_json TYPE JSONB
    USING CASE
      WHEN versoes_json IS NULL THEN '[]'::jsonb
      WHEN versoes_json ~ '^\s*[\[\{]' THEN versoes_json::jsonb
      ELSE '[]'::jsonb
    END,
  ALTER COLUMN analise_risco_json TYPE JSONB
    USING CASE
      WHEN analise_risco_json IS NULL THEN NULL
      WHEN analise_risco_json ~ '^\s*[\[\{]' THEN analise_risco_json::jsonb
      ELSE NULL
    END;

-- ── jurisprudencia ────────────────────────────────────────────────────────────

ALTER TABLE jurisprudencia
  ALTER COLUMN materias_json TYPE JSONB
    USING CASE
      WHEN materias_json IS NULL THEN '[]'::jsonb
      WHEN materias_json ~ '^\s*[\[\{]' THEN materias_json::jsonb
      ELSE '[]'::jsonb
    END,
  ALTER COLUMN fundamentos_legais_json TYPE JSONB
    USING CASE
      WHEN fundamentos_legais_json IS NULL THEN '[]'::jsonb
      WHEN fundamentos_legais_json ~ '^\s*[\[\{]' THEN fundamentos_legais_json::jsonb
      ELSE '[]'::jsonb
    END;

-- ── clientes ──────────────────────────────────────────────────────────────────

ALTER TABLE clientes
  ALTER COLUMN endereco_json TYPE JSONB
    USING CASE
      WHEN endereco_json IS NULL THEN NULL
      WHEN endereco_json ~ '^\s*[\[\{]' THEN endereco_json::jsonb
      ELSE NULL
    END;
