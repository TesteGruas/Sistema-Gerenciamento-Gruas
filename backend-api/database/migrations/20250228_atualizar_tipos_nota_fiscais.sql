-- Migration: Atualizar tipos de nota fiscal
-- Data: 2025-02-28
-- Descrição: Atualiza os tipos de nota fiscal para incluir: NFs (SERVIÇO), NF LOCAÇÃO, FATURA, NFe (ELETRÔNICA)

-- Atualizar coluna tipo_nota para incluir os novos tipos
DO $$ 
BEGIN
    -- Atualizar o comentário da coluna
    COMMENT ON COLUMN notas_fiscais.tipo_nota IS 'Tipo de nota: nf_servico (NFs de Serviço), nf_locacao (NF Locação), fatura (Fatura), nfe_eletronica (NFe Eletrônica)';
    
    -- Se a coluna não existir, criar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'tipo_nota'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN tipo_nota VARCHAR(50);
    END IF;
    
    -- Atualizar valores antigos para os novos tipos
    -- Mapeamento dos valores antigos para os novos
    UPDATE notas_fiscais 
    SET tipo_nota = CASE
        WHEN tipo_nota = 'locacao' THEN 'nf_locacao'
        WHEN tipo_nota = 'medicao' THEN 'nf_servico'
        WHEN tipo_nota = 'fornecedor' THEN 'nf_servico'
        WHEN tipo_nota = 'circulacao_equipamentos' THEN 'nf_servico'
        WHEN tipo_nota = 'outros_equipamentos' THEN 'nf_servico'
        ELSE tipo_nota
    END
    WHERE tipo_nota IN ('locacao', 'medicao', 'fornecedor', 'circulacao_equipamentos', 'outros_equipamentos');
END $$;

-- Adicionar coluna para indicar se é nota fiscal eletrônica
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'eletronica'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN eletronica BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN notas_fiscais.eletronica IS 'Indica se a nota fiscal é eletrônica (NFe) ou não';
        
        -- Se já existe arquivo XML, marcar como eletrônica
        UPDATE notas_fiscais 
        SET eletronica = true 
        WHERE tipo_arquivo = 'xml' OR arquivo_nf LIKE '%.xml';
    END IF;
END $$;

-- Adicionar coluna chave_acesso para NFe eletrônica
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'chave_acesso'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN chave_acesso VARCHAR(44);
        
        COMMENT ON COLUMN notas_fiscais.chave_acesso IS 'Chave de acesso da NFe eletrônica (44 caracteres)';
        
        CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave_acesso 
        ON notas_fiscais(chave_acesso);
    END IF;
END $$;

-- Criar índice para tipo_nota se não existir
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_tipo_nota 
ON notas_fiscais(tipo_nota);

-- Criar índice para eletronica se não existir
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_eletronica 
ON notas_fiscais(eletronica);

