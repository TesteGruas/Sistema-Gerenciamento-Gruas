-- Migration: Adicionar deleção lógica (soft delete) para funcionários e usuários
-- Data: 2025-02-01
-- Descrição: Adiciona campo deleted_at para permitir deleção lógica sem violar constraints de foreign key

-- Adicionar coluna deleted_at na tabela funcionarios
ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Adicionar coluna deleted_at na tabela usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Criar índices para melhorar performance em consultas que filtram por deleted_at
CREATE INDEX IF NOT EXISTS idx_funcionarios_deleted_at 
ON funcionarios(deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_deleted_at 
ON usuarios(deleted_at) 
WHERE deleted_at IS NULL;

-- Comentários nas colunas
COMMENT ON COLUMN funcionarios.deleted_at IS 'Data e hora da deleção lógica. NULL significa que o registro não foi deletado.';
COMMENT ON COLUMN usuarios.deleted_at IS 'Data e hora da deleção lógica. NULL significa que o registro não foi deletado.';
