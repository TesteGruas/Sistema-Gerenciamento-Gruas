-- Migration: Adicionar campos adicionais em alugueis_residencias
-- Data: 2025-02-28
-- Descrição: Adiciona campos: tipo_sinal, valor_deposito, periodo_multa, contrato_arquivo

-- Adicionar coluna tipo_sinal (Caução, fiador, ou outros)
ALTER TABLE alugueis_residencias
ADD COLUMN IF NOT EXISTS tipo_sinal VARCHAR(50) CHECK (tipo_sinal IN ('caucao', 'fiador', 'outros'));

-- Adicionar coluna valor_deposito
ALTER TABLE alugueis_residencias
ADD COLUMN IF NOT EXISTS valor_deposito DECIMAL(10,2);

-- Adicionar coluna periodo_multa (se tiver multa)
ALTER TABLE alugueis_residencias
ADD COLUMN IF NOT EXISTS periodo_multa INTEGER; -- dias

-- Adicionar coluna contrato_arquivo (URL ou caminho do arquivo do contrato)
ALTER TABLE alugueis_residencias
ADD COLUMN IF NOT EXISTS contrato_arquivo TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN alugueis_residencias.tipo_sinal IS 'Tipo de sinal: caução, fiador ou outros';
COMMENT ON COLUMN alugueis_residencias.valor_deposito IS 'Valor do depósito em reais';
COMMENT ON COLUMN alugueis_residencias.periodo_multa IS 'Período da multa em dias (se tiver)';
COMMENT ON COLUMN alugueis_residencias.contrato_arquivo IS 'URL ou caminho do arquivo do contrato importado';






