-- Migration: Corrigir tipo de grua_id em medicoes_mensais
-- Data: 2025-02-26
-- Descrição: Corrige o tipo de grua_id para VARCHAR para corresponder ao tipo de gruas.id (que é VARCHAR no banco)

-- Remover constraint e índice se existirem
ALTER TABLE medicoes_mensais 
  DROP CONSTRAINT IF EXISTS medicoes_mensais_grua_id_fkey;

DROP INDEX IF EXISTS idx_medicoes_mensais_grua_id;

DROP INDEX IF EXISTS medicoes_mensais_grua_periodo_unique;

-- Remover coluna se existir
ALTER TABLE medicoes_mensais 
  DROP COLUMN IF EXISTS grua_id;

-- Recriar coluna com tipo correto (VARCHAR) - mesmo tipo usado em outras tabelas como manutencoes_ordens
ALTER TABLE medicoes_mensais 
  ADD COLUMN grua_id VARCHAR REFERENCES gruas(id) ON DELETE CASCADE;

-- Recriar índice
CREATE INDEX idx_medicoes_mensais_grua_id 
  ON medicoes_mensais(grua_id);

-- Recriar índice único
CREATE UNIQUE INDEX medicoes_mensais_grua_periodo_unique 
  ON medicoes_mensais(grua_id, periodo) 
  WHERE grua_id IS NOT NULL;
