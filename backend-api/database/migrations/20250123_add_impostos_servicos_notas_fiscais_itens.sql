-- Migration: Adicionar campos de impostos de serviços na tabela notas_fiscais_itens
-- Data: 2025-01-23
-- Descrição: Adiciona campos para cálculo de impostos de serviços (ISSQN, INSS, CBS)

-- Adicionar campos de impostos de serviços
ALTER TABLE notas_fiscais_itens
ADD COLUMN IF NOT EXISTS base_calculo_issqn DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS aliquota_issqn DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_issqn DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_inss DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_cbs DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_liquido DECIMAL(12,2) DEFAULT 0.00;

-- Comentários
COMMENT ON COLUMN notas_fiscais_itens.base_calculo_issqn IS 'Base de cálculo do ISSQN (geralmente igual ao valor do serviço)';
COMMENT ON COLUMN notas_fiscais_itens.aliquota_issqn IS 'Alíquota do ISSQN em percentual (ex: 5.00 para 5%)';
COMMENT ON COLUMN notas_fiscais_itens.valor_issqn IS 'Valor do ISSQN calculado (base_calculo_issqn × aliquota_issqn / 100)';
COMMENT ON COLUMN notas_fiscais_itens.valor_inss IS 'Valor da retenção de INSS (retenção federal)';
COMMENT ON COLUMN notas_fiscais_itens.valor_cbs IS 'Valor da Contribuição sobre Bens e Serviços (CBS)';
COMMENT ON COLUMN notas_fiscais_itens.valor_liquido IS 'Valor líquido após dedução dos impostos (preco_total - impostos)';
