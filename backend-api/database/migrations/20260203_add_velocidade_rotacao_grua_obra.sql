-- Migration: Adicionar campo velocidade_rotacao na tabela grua_obra
-- Data: 2026-02-03
-- Descrição: Adiciona o campo velocidade_rotacao na tabela grua_obra para armazenar a velocidade de rotação específica da grua nesta obra

-- Adicionar campo velocidade_rotacao (velocidade de rotação em rpm)
ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS velocidade_rotacao DECIMAL(10,2);

-- Comentário na coluna
COMMENT ON COLUMN grua_obra.velocidade_rotacao IS 'Velocidade de rotação da grua nesta obra em rpm';
