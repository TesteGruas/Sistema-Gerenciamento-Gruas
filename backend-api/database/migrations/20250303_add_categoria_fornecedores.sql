-- Adicionar colunas categoria e observacoes na tabela fornecedores caso não existam
DO $$ 
BEGIN
    -- Adicionar coluna categoria
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fornecedores' 
        AND column_name = 'categoria'
    ) THEN
        ALTER TABLE fornecedores 
        ADD COLUMN categoria VARCHAR(100);
        
        -- Criar índice para a coluna categoria
        CREATE INDEX IF NOT EXISTS idx_fornecedores_categoria ON fornecedores(categoria);
        
        -- Adicionar comentário
        COMMENT ON COLUMN fornecedores.categoria IS 'Categoria do fornecedor (ex: Material de Construção, Equipamentos, etc.)';
    END IF;

    -- Adicionar coluna observacoes
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fornecedores' 
        AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE fornecedores 
        ADD COLUMN observacoes TEXT;
        
        -- Adicionar comentário
        COMMENT ON COLUMN fornecedores.observacoes IS 'Observações adicionais sobre o fornecedor';
    END IF;
END $$;

