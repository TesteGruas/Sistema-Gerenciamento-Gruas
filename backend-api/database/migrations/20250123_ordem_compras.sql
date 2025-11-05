-- Migration: Criar tabelas para sistema de ordem de compras
-- Data: 2025-01-23

-- Criar tabela ordem_compras
CREATE TABLE IF NOT EXISTS ordem_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id INTEGER NOT NULL REFERENCES funcionarios(id),
  descricao TEXT NOT NULL,
  valor_total NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'aguardando_orcamento', 'orcamento_aprovado', 'enviado_financeiro', 'pagamento_registrado', 'pagamento_aprovado', 'finalizada', 'cancelada')),
  aprovador_orcamento_id INTEGER REFERENCES usuarios(id),
  responsavel_pagamento_id INTEGER REFERENCES usuarios(id),
  aprovador_final_id INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para ordem_compras
CREATE INDEX IF NOT EXISTS idx_ordem_compras_solicitante_id ON ordem_compras(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_ordem_compras_status ON ordem_compras(status);
CREATE INDEX IF NOT EXISTS idx_ordem_compras_aprovador_orcamento_id ON ordem_compras(aprovador_orcamento_id);
CREATE INDEX IF NOT EXISTS idx_ordem_compras_responsavel_pagamento_id ON ordem_compras(responsavel_pagamento_id);

-- Criar trigger para atualizar updated_at em ordem_compras
CREATE OR REPLACE FUNCTION update_ordem_compras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ordem_compras_updated_at
  BEFORE UPDATE ON ordem_compras
  FOR EACH ROW
  EXECUTE FUNCTION update_ordem_compras_updated_at();

-- Criar tabela aprovacoes_ordem_compras
CREATE TABLE IF NOT EXISTS aprovacoes_ordem_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id UUID NOT NULL REFERENCES ordem_compras(id) ON DELETE CASCADE,
  etapa VARCHAR(50) NOT NULL CHECK (etapa IN ('orcamento', 'financeiro', 'pagamento')),
  aprovador_id INTEGER NOT NULL REFERENCES usuarios(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  comentarios TEXT,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para aprovacoes_ordem_compras
CREATE INDEX IF NOT EXISTS idx_aprovacoes_ordem_compras_ordem_id ON aprovacoes_ordem_compras(ordem_id);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_ordem_compras_etapa ON aprovacoes_ordem_compras(etapa);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_ordem_compras_status ON aprovacoes_ordem_compras(status);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_ordem_compras_aprovador_id ON aprovacoes_ordem_compras(aprovador_id);

-- Criar trigger para atualizar updated_at em aprovacoes_ordem_compras
CREATE OR REPLACE FUNCTION update_aprovacoes_ordem_compras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_aprovacoes_ordem_compras_updated_at
  BEFORE UPDATE ON aprovacoes_ordem_compras
  FOR EACH ROW
  EXECUTE FUNCTION update_aprovacoes_ordem_compras_updated_at();

-- Comentários nas tabelas
COMMENT ON TABLE ordem_compras IS 'Ordens de compras com fluxo de aprovação';
COMMENT ON TABLE aprovacoes_ordem_compras IS 'Histórico de aprovações das ordens de compras';

