-- Migration: Adicionar campo componente_estoque_id na tabela grua_componentes
-- Data: 2025-01-29
-- Descrição: Adiciona campo para armazenar o ID do produto/componente do estoque quando o componente foi alocado do estoque

-- Adicionar campo componente_estoque_id
ALTER TABLE grua_componentes 
ADD COLUMN IF NOT EXISTS componente_estoque_id VARCHAR(50);

-- Adicionar índice para componente_estoque_id
CREATE INDEX IF NOT EXISTS idx_grua_componentes_componente_estoque_id ON grua_componentes(componente_estoque_id);

-- Comentário na coluna
COMMENT ON COLUMN grua_componentes.componente_estoque_id IS 'ID do produto ou componente no estoque quando foi alocado do estoque (ex: P0006 para produtos)';
