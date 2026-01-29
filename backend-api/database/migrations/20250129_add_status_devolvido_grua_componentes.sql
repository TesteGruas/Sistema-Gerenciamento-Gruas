-- Migration: Adicionar status "Devolvido" na constraint CHECK da tabela grua_componentes
-- Data: 2025-01-29
-- Descrição: Atualiza a constraint CHECK do campo status para incluir "Devolvido"

-- Remover constraint antiga se existir
ALTER TABLE grua_componentes 
DROP CONSTRAINT IF EXISTS grua_componentes_status_check;

-- Adicionar nova constraint com "Devolvido" incluído
ALTER TABLE grua_componentes 
ADD CONSTRAINT grua_componentes_status_check 
CHECK (status IN ('Disponível', 'Em uso', 'Danificado', 'Manutenção', 'Descontinuado', 'Devolvido'));

-- Comentário na coluna
COMMENT ON COLUMN grua_componentes.status IS 'Status do componente: Disponível, Em uso, Danificado, Manutenção, Descontinuado ou Devolvido';
