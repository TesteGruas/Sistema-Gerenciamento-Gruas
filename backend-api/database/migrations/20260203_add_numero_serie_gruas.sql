-- Migration: Adicionar campo numero_serie na tabela gruas
-- Data: 2026-02-03
-- Descrição: Adiciona o campo numero_serie na tabela gruas para armazenar o número de série de cada grua

-- Adicionar campo numero_serie (número de série da grua)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS numero_serie VARCHAR(100);

-- Comentário na coluna
COMMENT ON COLUMN gruas.numero_serie IS 'Número de série da grua';

-- Criar índice para melhorar performance em buscas por número de série
CREATE INDEX IF NOT EXISTS idx_gruas_numero_serie ON gruas(numero_serie);
