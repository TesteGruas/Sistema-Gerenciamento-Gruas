-- Migration: Adicionar campo eh_supervisor na tabela funcionarios
-- Data: 2025-02-26
-- Descrição: Permite marcar funcionários como supervisores no cadastro

-- Adicionar coluna eh_supervisor
ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS eh_supervisor BOOLEAN DEFAULT false;

-- Criar índice para melhorar performance em consultas de supervisores
CREATE INDEX IF NOT EXISTS idx_funcionarios_eh_supervisor 
ON funcionarios(eh_supervisor) 
WHERE eh_supervisor = true;

-- Comentário na coluna
COMMENT ON COLUMN funcionarios.eh_supervisor IS 'Indica se o funcionário é supervisor (informação auxiliar do cadastro). O status real de supervisor é definido por obra na tabela funcionarios_obras.';

