-- Migration: Medições Mensais sem Orçamento
-- Data: 2025-02-25
-- Descrição: Permite criar medições mensais diretamente vinculadas a obras, sem necessidade de orçamento

-- Tornar orcamento_id opcional (permitir NULL)
ALTER TABLE medicoes_mensais 
  ALTER COLUMN orcamento_id DROP NOT NULL;

-- Adicionar coluna obra_id para vincular medições diretamente à obra
ALTER TABLE medicoes_mensais 
  ADD COLUMN IF NOT EXISTS obra_id INTEGER REFERENCES obras(id) ON DELETE CASCADE;

-- Criar índice para melhorar performance de consultas por obra
CREATE INDEX IF NOT EXISTS idx_medicoes_mensais_obra_id 
  ON medicoes_mensais(obra_id);

-- Atualizar constraint de unicidade para considerar obra_id
-- Remover constraint antiga se existir
ALTER TABLE medicoes_mensais 
  DROP CONSTRAINT IF EXISTS medicoes_mensais_orcamento_id_periodo_key;

-- Criar nova constraint que permite:
-- - Uma medição por orcamento/período (se orcamento_id não for NULL)
-- - Uma medição por obra/período (se obra_id não for NULL e orcamento_id for NULL)
CREATE UNIQUE INDEX IF NOT EXISTS medicoes_mensais_orcamento_periodo_unique 
  ON medicoes_mensais(orcamento_id, periodo) 
  WHERE orcamento_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS medicoes_mensais_obra_periodo_unique 
  ON medicoes_mensais(obra_id, periodo) 
  WHERE obra_id IS NOT NULL AND orcamento_id IS NULL;

-- Adicionar constraint para garantir que pelo menos um dos dois (obra_id ou orcamento_id) seja fornecido
ALTER TABLE medicoes_mensais 
  ADD CONSTRAINT medicoes_mensais_obra_ou_orcamento_check 
  CHECK (
    (obra_id IS NOT NULL AND orcamento_id IS NULL) OR 
    (obra_id IS NULL AND orcamento_id IS NOT NULL) OR
    (obra_id IS NOT NULL AND orcamento_id IS NOT NULL)
  );

-- Comentários
COMMENT ON COLUMN medicoes_mensais.obra_id IS 'ID da obra relacionada (opcional quando orcamento_id está presente)';
COMMENT ON COLUMN medicoes_mensais.orcamento_id IS 'ID do orçamento relacionado (opcional quando obra_id está presente)';

