-- Migration: Expandir Módulo de Orçamentos
-- Data: 2025-02-02
-- Descrição: Adiciona todos os campos necessários para orçamentos conforme modelo GR2025064-1

-- Adicionar campos de obra no orçamento
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_id INTEGER REFERENCES obras(id);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_nome VARCHAR(255);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_tipo VARCHAR(100);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_endereco TEXT;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_cidade VARCHAR(100);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_bairro VARCHAR(100);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_cep VARCHAR(10);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_engenheiro_responsavel VARCHAR(255);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS obra_contato VARCHAR(255);

-- Adicionar campos de grua no orçamento
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_id INTEGER REFERENCES gruas(id);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_modelo VARCHAR(100);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_lanca DECIMAL(10,2);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_altura_final DECIMAL(10,2);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_tipo_base VARCHAR(50);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_ano INTEGER;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_potencia DECIMAL(10,2);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_capacidade_1_cabo DECIMAL(10,2);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_capacidade_2_cabos DECIMAL(10,2);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS grua_voltagem VARCHAR(10);

-- Adicionar campos de cliente expandidos
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS cliente_endereco TEXT;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS cliente_bairro VARCHAR(100);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS cliente_cep VARCHAR(10);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS cliente_cidade VARCHAR(100);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS cliente_estado VARCHAR(2);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(20);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS cliente_contato VARCHAR(255);

-- Criar tabela para valores fixos do orçamento
CREATE TABLE IF NOT EXISTS orcamento_valores_fixos (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Locação', 'Serviço')),
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orcamento_valores_fixos_orcamento_id ON orcamento_valores_fixos(orcamento_id);

-- Criar tabela para custos mensais do orçamento
CREATE TABLE IF NOT EXISTS orcamento_custos_mensais (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor_mensal DECIMAL(12,2) NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orcamento_custos_mensais_orcamento_id ON orcamento_custos_mensais(orcamento_id);

-- Criar tabela para tabela de horas extras
CREATE TABLE IF NOT EXISTS orcamento_horas_extras (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('operador', 'sinaleiro', 'equipamento')),
  dia_semana VARCHAR(20) NOT NULL CHECK (dia_semana IN ('sabado', 'domingo_feriado', 'normal')),
  valor_hora DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(orcamento_id, tipo, dia_semana)
);

CREATE INDEX IF NOT EXISTS idx_orcamento_horas_extras_orcamento_id ON orcamento_horas_extras(orcamento_id);

-- Criar tabela para serviços adicionais
CREATE TABLE IF NOT EXISTS orcamento_servicos_adicionais (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orcamento_servicos_adicionais_orcamento_id ON orcamento_servicos_adicionais(orcamento_id);

-- Adicionar campos gerais no orçamento
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS numero VARCHAR(50) UNIQUE;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS prazo_locacao_meses INTEGER;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS data_inicio_estimada DATE;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS tolerancia_dias INTEGER DEFAULT 15;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS escopo_incluso TEXT;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS responsabilidades_cliente TEXT;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS condicoes_comerciais TEXT;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS condicoes_gerais TEXT;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS logistica TEXT;

ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS garantias TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_id ON orcamentos(obra_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_grua_id ON orcamentos(grua_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero);

-- Comentários
COMMENT ON COLUMN orcamentos.obra_id IS 'ID da obra relacionada ao orçamento';
COMMENT ON COLUMN orcamentos.grua_id IS 'ID da grua relacionada ao orçamento';
COMMENT ON COLUMN orcamentos.numero IS 'Número único do orçamento (ex: GR2025064-1)';
COMMENT ON TABLE orcamento_valores_fixos IS 'Valores fixos do orçamento (montagem, desmontagem, frete, etc.)';
COMMENT ON TABLE orcamento_custos_mensais IS 'Custos mensais do orçamento (locação, operador, sinaleiro, etc.)';
COMMENT ON TABLE orcamento_horas_extras IS 'Tabela de valores de horas extras por tipo e dia da semana';
COMMENT ON TABLE orcamento_servicos_adicionais IS 'Serviços adicionais do orçamento (técnico, eletricista, ART, etc.)';

