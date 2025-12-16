-- Migration: Adicionar campos medicao_id e locacao_id à tabela notas_fiscais
-- Data: 2025-02-28
-- Descrição: Adiciona suporte para vincular notas fiscais com medições e locações

-- Adicionar coluna medicao_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'medicao_id'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN medicao_id INTEGER REFERENCES medicoes_mensais(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_notas_fiscais_medicao_id 
        ON notas_fiscais(medicao_id);
    END IF;
END $$;

-- Adicionar coluna locacao_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'locacao_id'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN locacao_id INTEGER REFERENCES locacoes(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_notas_fiscais_locacao_id 
        ON notas_fiscais(locacao_id);
    END IF;
END $$;

-- Adicionar coluna tipo_nota se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'tipo_nota'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN tipo_nota VARCHAR(50);
        
        COMMENT ON COLUMN notas_fiscais.tipo_nota IS 'Tipo de nota: locacao, circulacao_equipamentos, outros_equipamentos, medicao, fornecedor';
    END IF;
END $$;

-- Comentários
COMMENT ON COLUMN notas_fiscais.medicao_id IS 'ID da medição mensal vinculada (para notas fiscais de medições)';
COMMENT ON COLUMN notas_fiscais.locacao_id IS 'ID da locação vinculada (para notas fiscais de locações)';

