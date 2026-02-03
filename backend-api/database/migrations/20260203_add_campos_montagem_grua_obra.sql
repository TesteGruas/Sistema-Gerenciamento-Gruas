-- Migration: Adicionar campos de montagem/desmontagem na tabela grua_obra
-- Data: 2026-02-03
-- Descrição: Adiciona campos relacionados à montagem e desmontagem da grua na obra

-- Adicionar campo data_montagem (data de montagem da grua na obra)
ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS data_montagem DATE;

-- Adicionar campo data_desmontagem (data de desmontagem da grua da obra)
ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS data_desmontagem DATE;

-- Adicionar campo local_instalacao (local de instalação da grua na obra)
ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS local_instalacao VARCHAR(255);

-- Adicionar campo observacoes_montagem (observações sobre a montagem/desmontagem)
ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS observacoes_montagem TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN grua_obra.data_montagem IS 'Data de montagem da grua na obra';
COMMENT ON COLUMN grua_obra.data_desmontagem IS 'Data de desmontagem da grua da obra';
COMMENT ON COLUMN grua_obra.local_instalacao IS 'Local de instalação da grua na obra';
COMMENT ON COLUMN grua_obra.observacoes_montagem IS 'Observações sobre a montagem e desmontagem da grua';
