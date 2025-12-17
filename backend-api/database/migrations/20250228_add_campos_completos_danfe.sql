-- Migration: Adicionar campos completos do DANFE na tabela notas_fiscais
-- Data: 2025-02-28
-- Descrição: Adiciona todos os campos necessários para armazenar dados completos de uma nota fiscal eletrônica (DANFE)

-- ============================================
-- DADOS DO EMITENTE (já existem via fornecedor_id, mas adicionar campos específicos)
-- ============================================

-- Inscrição Estadual do Emitente
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'emitente_inscricao_estadual'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN emitente_inscricao_estadual VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.emitente_inscricao_estadual IS 'Inscrição Estadual do emitente da nota fiscal';
    END IF;
END $$;

-- ============================================
-- DADOS DO DESTINATÁRIO (já existem via cliente_id, mas adicionar campos específicos)
-- ============================================

-- Inscrição Estadual do Destinatário
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'destinatario_inscricao_estadual'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN destinatario_inscricao_estadual VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.destinatario_inscricao_estadual IS 'Inscrição Estadual do destinatário (ISENTO ou número)';
    END IF;
END $$;

-- ============================================
-- DADOS DA NOTA FISCAL
-- ============================================

-- Natureza da Operação
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'natureza_operacao'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN natureza_operacao VARCHAR(255);
        
        COMMENT ON COLUMN notas_fiscais.natureza_operacao IS 'Natureza da operação (ex: Remessa de bem por conta de contrato de comodato)';
    END IF;
END $$;

-- Protocolo de Autorização
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'protocolo_autorizacao'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN protocolo_autorizacao VARCHAR(50);
        
        COMMENT ON COLUMN notas_fiscais.protocolo_autorizacao IS 'Protocolo de autorização de uso da NFe';
    END IF;
END $$;

-- Data e Hora de Saída
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'data_saida'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN data_saida DATE;
        
        COMMENT ON COLUMN notas_fiscais.data_saida IS 'Data de saída/entrada da mercadoria';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'hora_saida'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN hora_saida TIME;
        
        COMMENT ON COLUMN notas_fiscais.hora_saida IS 'Hora de saída/entrada da mercadoria';
    END IF;
END $$;

-- ============================================
-- CÁLCULO DO IMPOSTO
-- ============================================

-- Base de Cálculo do ICMS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'base_calculo_icms'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN base_calculo_icms DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.base_calculo_icms IS 'Base de cálculo do ICMS';
    END IF;
END $$;

-- Valor do ICMS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_icms'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_icms DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_icms IS 'Valor do ICMS';
    END IF;
END $$;

-- Base de Cálculo do ICMS Substituição Tributária
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'base_calculo_icms_st'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN base_calculo_icms_st DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.base_calculo_icms_st IS 'Base de cálculo do ICMS Substituição Tributária';
    END IF;
END $$;

-- Valor do ICMS Substituição Tributária
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_icms_st'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_icms_st DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_icms_st IS 'Valor do ICMS Substituição Tributária';
    END IF;
END $$;

-- Valor do FCP ST
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_fcp_st'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_fcp_st DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_fcp_st IS 'Valor do FCP (Fundo de Combate à Pobreza) ST';
    END IF;
END $$;

-- Valor do Frete
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_frete'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_frete DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_frete IS 'Valor do frete';
    END IF;
END $$;

-- Valor do Seguro
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_seguro'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_seguro DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_seguro IS 'Valor do seguro';
    END IF;
END $$;

-- Valor do Desconto
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_desconto'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_desconto DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_desconto IS 'Valor do desconto';
    END IF;
END $$;

-- Outras Despesas Acessórias
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'outras_despesas_acessorias'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN outras_despesas_acessorias DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.outras_despesas_acessorias IS 'Outras despesas acessórias';
    END IF;
END $$;

-- Valor do IPI
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_ipi'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_ipi DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_ipi IS 'Valor do IPI (Imposto sobre Produtos Industrializados)';
    END IF;
END $$;

-- ============================================
-- TRANSPORTADOR
-- ============================================

-- Tipo de Frete
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'tipo_frete'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN tipo_frete VARCHAR(50);
        
        COMMENT ON COLUMN notas_fiscais.tipo_frete IS 'Tipo de frete (0-CIF, 1-FOB, 2-Por conta de terceiros, 3-Sem frete)';
    END IF;
END $$;

-- ============================================
-- CÁLCULO DO ISSQN
-- ============================================

-- Inscrição Municipal
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'inscricao_municipal'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN inscricao_municipal VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.inscricao_municipal IS 'Inscrição Municipal para cálculo do ISSQN';
    END IF;
END $$;

-- Valor Total dos Serviços
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_total_servicos'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_total_servicos DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_total_servicos IS 'Valor total dos serviços para cálculo do ISSQN';
    END IF;
END $$;

-- Base de Cálculo do ISSQN
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'base_calculo_issqn'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN base_calculo_issqn DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.base_calculo_issqn IS 'Base de cálculo do ISSQN';
    END IF;
END $$;

-- Valor do ISSQN
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_issqn'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_issqn DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_issqn IS 'Valor do ISSQN';
    END IF;
END $$;

-- ============================================
-- DADOS ADICIONAIS
-- ============================================

-- Informações de Tributos (IBPT)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'info_tributos'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN info_tributos TEXT;
        
        COMMENT ON COLUMN notas_fiscais.info_tributos IS 'Informações sobre tributos aproximados (IBPT)';
    END IF;
END $$;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_natureza_operacao 
ON notas_fiscais(natureza_operacao);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_protocolo_autorizacao 
ON notas_fiscais(protocolo_autorizacao);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_saida 
ON notas_fiscais(data_saida);

