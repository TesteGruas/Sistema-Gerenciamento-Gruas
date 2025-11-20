-- Migration: Adicionar campos faltantes na tabela orcamentos_locacao
-- Data: 2025-02-20
-- Descrição: Adiciona campos condicoes_gerais, logistica, garantias e cria tabelas para valores_fixos e custos_mensais

-- Adicionar campos gerais na tabela orcamentos_locacao
ALTER TABLE orcamentos_locacao 
ADD COLUMN IF NOT EXISTS condicoes_gerais TEXT;

ALTER TABLE orcamentos_locacao 
ADD COLUMN IF NOT EXISTS logistica TEXT;

ALTER TABLE orcamentos_locacao 
ADD COLUMN IF NOT EXISTS garantias TEXT;

-- Criar tabela para valores fixos do orçamento de locação
CREATE TABLE IF NOT EXISTS orcamento_valores_fixos_locacao (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos_locacao(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Locação', 'Serviço')),
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orcamento_valores_fixos_locacao_orcamento_id ON orcamento_valores_fixos_locacao(orcamento_id);

-- Criar tabela para custos mensais do orçamento de locação
CREATE TABLE IF NOT EXISTS orcamento_custos_mensais_locacao (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos_locacao(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor_mensal DECIMAL(12,2) NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orcamento_custos_mensais_locacao_orcamento_id ON orcamento_custos_mensais_locacao(orcamento_id);

-- Comentários
COMMENT ON COLUMN orcamentos_locacao.condicoes_gerais IS 'Condições gerais do contrato e termos legais';
COMMENT ON COLUMN orcamentos_locacao.logistica IS 'Informações sobre transporte, entrega e instalação';
COMMENT ON COLUMN orcamentos_locacao.garantias IS 'Garantias oferecidas e condições de garantia';
COMMENT ON TABLE orcamento_valores_fixos_locacao IS 'Valores fixos do orçamento de locação (montagem, desmontagem, frete, etc.)';
COMMENT ON TABLE orcamento_custos_mensais_locacao IS 'Custos mensais do orçamento de locação (locação, operador, sinaleiro, etc.)';

