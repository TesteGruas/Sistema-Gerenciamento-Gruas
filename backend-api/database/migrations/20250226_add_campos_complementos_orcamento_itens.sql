-- Migration: Adicionar campos específicos de complementos na tabela orcamento_itens
-- Data: 2025-02-26
-- Descrição: Adiciona campos necessários para orçamentos de complementos (estado, medida/capacidade, peso, ICMS, frete, desconto)

-- Verificar se a tabela orcamento_itens existe, caso contrário criar
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id SERIAL PRIMARY KEY,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  produto_servico VARCHAR(255) NOT NULL,
  descricao TEXT,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('produto', 'servico', 'equipamento')),
  unidade VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar campos específicos de complementos
ALTER TABLE orcamento_itens 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(100);

ALTER TABLE orcamento_itens 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) CHECK (estado IN ('novo', 'usado', 'recondicionado'));

ALTER TABLE orcamento_itens 
ADD COLUMN IF NOT EXISTS medida_capacidade VARCHAR(100);

ALTER TABLE orcamento_itens 
ADD COLUMN IF NOT EXISTS peso DECIMAL(10,2);

ALTER TABLE orcamento_itens 
ADD COLUMN IF NOT EXISTS frete VARCHAR(10) CHECK (frete IN ('CIF', 'FOB'));

ALTER TABLE orcamento_itens 
ADD COLUMN IF NOT EXISTS icms_percentual DECIMAL(5,2) DEFAULT 0;

ALTER TABLE orcamento_itens 
ADD COLUMN IF NOT EXISTS desconto_percentual DECIMAL(5,2) DEFAULT 0;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento_id ON orcamento_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_codigo ON orcamento_itens(codigo);

-- Comentários
COMMENT ON COLUMN orcamento_itens.codigo IS 'Código/SKU do complemento';
COMMENT ON COLUMN orcamento_itens.estado IS 'Estado do item: novo, usado ou recondicionado';
COMMENT ON COLUMN orcamento_itens.medida_capacidade IS 'Medida ou capacidade do complemento (ex: 2m, 500kg)';
COMMENT ON COLUMN orcamento_itens.peso IS 'Peso do item em kg';
COMMENT ON COLUMN orcamento_itens.frete IS 'Tipo de frete: CIF (pago pelo vendedor) ou FOB (pago pelo comprador)';
COMMENT ON COLUMN orcamento_itens.icms_percentual IS 'Percentual de ICMS aplicado ao item';
COMMENT ON COLUMN orcamento_itens.desconto_percentual IS 'Percentual de desconto aplicado ao item (usado principalmente para itens usados ou recondicionados)';













