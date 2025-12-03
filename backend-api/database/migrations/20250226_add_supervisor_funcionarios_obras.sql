-- Migration: Adicionar campo is_supervisor na tabela funcionarios_obras
-- Data: 2025-02-26
-- Descrição: Permite distinguir supervisores de funcionários na obra

-- Adicionar coluna is_supervisor
ALTER TABLE funcionarios_obras
ADD COLUMN IF NOT EXISTS is_supervisor BOOLEAN DEFAULT false;

-- Criar índice para melhorar performance em consultas de supervisores
CREATE INDEX IF NOT EXISTS idx_funcionarios_obras_is_supervisor 
ON funcionarios_obras(obra_id, is_supervisor) 
WHERE is_supervisor = true;

-- Comentário na coluna
COMMENT ON COLUMN funcionarios_obras.is_supervisor IS 'Indica se o funcionário é supervisor da obra (true) ou funcionário comum (false)';

