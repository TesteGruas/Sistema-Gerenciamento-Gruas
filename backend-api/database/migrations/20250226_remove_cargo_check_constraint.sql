-- Migration: Remover constraint CHECK do campo cargo e torná-lo nullable
-- Data: 2025-02-26
-- Descrição: Remove a constraint CHECK do campo cargo para permitir valores dinâmicos
--            e torna o campo nullable, já que agora usamos cargo_id como referência

-- Remover constraint CHECK se existir
ALTER TABLE funcionarios 
DROP CONSTRAINT IF EXISTS funcionarios_cargo_check;

-- Tornar o campo cargo nullable (já que agora usamos cargo_id)
ALTER TABLE funcionarios 
ALTER COLUMN cargo DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN funcionarios.cargo IS 'Campo mantido para compatibilidade. Use cargo_id para referência ao cargo na tabela cargos.';

