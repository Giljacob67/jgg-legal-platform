CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  initials VARCHAR(10),
  role VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS casos (
  id VARCHAR(50) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  cliente VARCHAR(255) NOT NULL,
  materia VARCHAR(100) NOT NULL,
  tribunal VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  prazo_final TIMESTAMPTZ,
  resumo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id VARCHAR(50) REFERENCES casos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  papel VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS eventos_caso (
  id VARCHAR(50) PRIMARY KEY,
  caso_id VARCHAR(50) REFERENCES casos(id) ON DELETE CASCADE,
  data TIMESTAMPTZ NOT NULL,
  descricao TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos_peca (
  id VARCHAR(50) PRIMARY KEY,
  caso_id VARCHAR(50) REFERENCES casos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  tipo_peca VARCHAR(150) NOT NULL,
  prioridade VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  etapa_atual VARCHAR(100) NOT NULL,
  responsavel VARCHAR(255),
  prazo_final TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historico_pipeline (
  id VARCHAR(50) PRIMARY KEY,
  pedido_id VARCHAR(50) REFERENCES pedidos_peca(id) ON DELETE CASCADE,
  etapa VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL,
  responsavel VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS minutas (
  id VARCHAR(50) PRIMARY KEY,
  pedido_id VARCHAR(50) REFERENCES pedidos_peca(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  conteudo_atual TEXT
);

CREATE TABLE IF NOT EXISTS versoes_minuta (
  id VARCHAR(50) PRIMARY KEY,
  minuta_id VARCHAR(50) REFERENCES minutas(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  autor VARCHAR(255) NOT NULL,
  resumo_mudancas TEXT,
  conteudo TEXT NOT NULL,
  contexto_versao_origem INT,
  template_id_origem VARCHAR(255),
  materia_canonica_origem VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_casos_status ON casos (status, prazo_final);
CREATE INDEX IF NOT EXISTS idx_pedidos_peca_status ON pedidos_peca (status, prazo_final);
CREATE INDEX IF NOT EXISTS idx_pedidos_peca_caso_id ON pedidos_peca (caso_id);
CREATE INDEX IF NOT EXISTS idx_minutas_pedido_id ON minutas (pedido_id);
CREATE INDEX IF NOT EXISTS idx_versoes_minuta_minuta_id_numero ON versoes_minuta (minuta_id, numero DESC);
