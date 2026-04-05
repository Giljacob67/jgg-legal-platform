-- ─────────────────────────────────────────────────────────────
-- 0014 — Clientes, Jurisprudência, Contratos, Configurações
-- Adiciona tabelas que estavam apenas em mock
-- ─────────────────────────────────────────────────────────────

-- Adicionar colunas na tabela users para suporte ao módulo Administração
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS perfil VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMPTZ;

-- ─── CLIENTES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id           VARCHAR(50) PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL,
  tipo         VARCHAR(30)  NOT NULL,   -- 'pessoa_fisica' | 'pessoa_juridica'
  cpf_cnpj     VARCHAR(30),
  email        VARCHAR(255),
  telefone     VARCHAR(30),
  endereco_json TEXT,                   -- JSON stringified Endereco
  status       VARCHAR(30)  NOT NULL DEFAULT 'ativo',
  responsavel_id VARCHAR(50),
  anotacoes    TEXT,
  criado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── JURISPRUDÊNCIA ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jurisprudencia (
  id                    VARCHAR(50)  PRIMARY KEY,
  titulo                VARCHAR(500) NOT NULL,
  ementa                TEXT         NOT NULL,
  ementa_resumida       TEXT,
  tribunal              VARCHAR(100) NOT NULL,
  relator               VARCHAR(255),
  data_julgamento       VARCHAR(20),   -- ISO date string
  tipo                  VARCHAR(50)  NOT NULL,
  materias_json         TEXT         NOT NULL DEFAULT '[]',
  tese                  TEXT,
  fundamentos_legais_json TEXT        NOT NULL DEFAULT '[]',
  url_origem            VARCHAR(500),
  relevancia            INTEGER      NOT NULL DEFAULT 3,
  criado_em             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── CONTRATOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id                VARCHAR(50)  PRIMARY KEY,
  caso_id           VARCHAR(50),
  cliente_id        VARCHAR(50),
  titulo            VARCHAR(255) NOT NULL,
  tipo              VARCHAR(100) NOT NULL,
  status            VARCHAR(50)  NOT NULL DEFAULT 'rascunho',
  objeto            TEXT         NOT NULL,
  partes_json       TEXT         NOT NULL DEFAULT '[]',
  clausulas_json    TEXT         NOT NULL DEFAULT '[]',
  valor_reais       INTEGER,
  vigencia_inicio   VARCHAR(20),
  vigencia_fim      VARCHAR(20),
  conteudo_atual    TEXT         NOT NULL DEFAULT '',
  versoes_json      TEXT         NOT NULL DEFAULT '[]',
  responsavel_id    VARCHAR(50),
  analise_risco_json TEXT,
  criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── CONFIGURAÇÕES DO SISTEMA ─────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
  chave     VARCHAR(100) PRIMARY KEY,
  valor     TEXT         NOT NULL,
  descricao TEXT
);

-- Seed das configurações padrão do sistema
INSERT INTO configuracoes_sistema (chave, valor, descricao)
VALUES
  ('ai_provider',         'anthropic',       'Provedor de IA padrão'),
  ('ai_model',            'claude-opus-4-5', 'Modelo de IA padrão'),
  ('data_mode',           'real',            'Modo de dados: real | mock'),
  ('nome_escritorio',     'JGG Group — Advocacia e Consultoria', 'Nome do escritório exibido na plataforma'),
  ('tema',                'escuro',          'Tema da interface: claro | escuro | sistema'),
  ('prazo_alerta_dias',   '7',               'Dias de antecedência para alerta de prazo')
ON CONFLICT (chave) DO NOTHING;
