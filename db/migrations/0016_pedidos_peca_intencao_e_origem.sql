-- Migration 0016: adicionar campos de intenção processual e documento de origem em pedidos_peca
-- Esses campos existem no tipo TypeScript PedidoDePeca mas estavam ausentes no banco.

ALTER TABLE pedidos_peca
  ADD COLUMN IF NOT EXISTS intencao_processual VARCHAR(100),
  ADD COLUMN IF NOT EXISTS documento_origem_id TEXT;

-- Índice para busca por documento de origem (ex: listar pedidos gerados a partir de um documento)
CREATE INDEX IF NOT EXISTS idx_pedidos_peca_documento_origem
  ON pedidos_peca (documento_origem_id)
  WHERE documento_origem_id IS NOT NULL;

COMMENT ON COLUMN pedidos_peca.intencao_processual IS
  'Objetivo processual do pedido (ex: redigir_contestacao, extrair_fatos). Guia o agente de IA.';

COMMENT ON COLUMN pedidos_peca.documento_origem_id IS
  'ID do documento juridico que originou este pedido (ex: petição inicial para contestar).';
