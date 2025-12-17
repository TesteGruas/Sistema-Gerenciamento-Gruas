-- Migration: Adicionar campos completos de NFS-e (Nota Fiscal de Serviço Eletrônica)
-- Data: 2025-02-28
-- Descrição: Adiciona todos os campos necessários para armazenar dados completos de uma NFS-e

-- ============================================
-- DADOS DO PRESTADOR DE SERVIÇO
-- ============================================

-- Inscrição Municipal do Prestador
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'prestador_inscricao_municipal'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN prestador_inscricao_municipal VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.prestador_inscricao_municipal IS 'Inscrição Municipal do prestador de serviço';
    END IF;
END $$;

-- Email do Prestador
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'prestador_email'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN prestador_email VARCHAR(255);
        
        COMMENT ON COLUMN notas_fiscais.prestador_email IS 'Email do prestador de serviço';
    END IF;
END $$;

-- Telefone do Prestador
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'prestador_telefone'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN prestador_telefone VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.prestador_telefone IS 'Telefone do prestador de serviço';
    END IF;
END $$;

-- ============================================
-- DADOS DO TOMADOR DE SERVIÇO
-- ============================================

-- Inscrição Municipal do Tomador
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'tomador_inscricao_municipal'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN tomador_inscricao_municipal VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.tomador_inscricao_municipal IS 'Inscrição Municipal do tomador de serviço';
    END IF;
END $$;

-- NIF do Tomador (Número de Identificação Fiscal)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'tomador_nif'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN tomador_nif VARCHAR(50);
        
        COMMENT ON COLUMN notas_fiscais.tomador_nif IS 'NIF (Número de Identificação Fiscal) do tomador';
    END IF;
END $$;

-- Email do Tomador
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'tomador_email'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN tomador_email VARCHAR(255);
        
        COMMENT ON COLUMN notas_fiscais.tomador_email IS 'Email do tomador de serviço';
    END IF;
END $$;

-- Telefone do Tomador
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'tomador_telefone'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN tomador_telefone VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.tomador_telefone IS 'Telefone do tomador de serviço';
    END IF;
END $$;

-- ============================================
-- DADOS DA NFS-e
-- ============================================

-- Código de Verificação da NFS-e
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'codigo_verificacao'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN codigo_verificacao VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.codigo_verificacao IS 'Código de verificação da NFS-e';
    END IF;
END $$;

-- RPS (Recibo Provisório de Serviços)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'rps_numero'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN rps_numero VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.rps_numero IS 'Número do RPS (Recibo Provisório de Serviços)';
    END IF;
END $$;

-- Série do RPS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'rps_serie'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN rps_serie VARCHAR(10);
        
        COMMENT ON COLUMN notas_fiscais.rps_serie IS 'Série do RPS';
    END IF;
END $$;

-- Tipo do RPS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'rps_tipo'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN rps_tipo VARCHAR(10);
        
        COMMENT ON COLUMN notas_fiscais.rps_tipo IS 'Tipo do RPS';
    END IF;
END $$;

-- NFS-e Substituída
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'nfse_substituida'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN nfse_substituida VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.nfse_substituida IS 'Número da NFS-e substituída (se houver)';
    END IF;
END $$;

-- ============================================
-- ATIVIDADE ECONÔMICA
-- ============================================

-- Código da Atividade Econômica
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'atividade_economica_codigo'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN atividade_economica_codigo VARCHAR(20);
        
        COMMENT ON COLUMN notas_fiscais.atividade_economica_codigo IS 'Código da atividade econômica (ex: 7.02 / 439910400)';
    END IF;
END $$;

-- Descrição da Atividade Econômica
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'atividade_economica_descricao'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN atividade_economica_descricao TEXT;
        
        COMMENT ON COLUMN notas_fiscais.atividade_economica_descricao IS 'Descrição da atividade econômica';
    END IF;
END $$;

-- ============================================
-- DISCRIMINAÇÃO DO SERVIÇO
-- ============================================

-- Discriminação do Serviço
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'discriminacao_servico'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN discriminacao_servico TEXT;
        
        COMMENT ON COLUMN notas_fiscais.discriminacao_servico IS 'Discriminação detalhada do serviço prestado';
    END IF;
END $$;

-- Código da Obra (CNO)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'codigo_obra'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN codigo_obra VARCHAR(50);
        
        COMMENT ON COLUMN notas_fiscais.codigo_obra IS 'Código da Obra (CNO)';
    END IF;
END $$;

-- Endereço da Obra
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'obra_endereco'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN obra_endereco TEXT;
        
        COMMENT ON COLUMN notas_fiscais.obra_endereco IS 'Endereço completo da obra onde o serviço foi prestado';
    END IF;
END $$;

-- ============================================
-- TRIBUTOS FEDERAIS
-- ============================================

-- Valor do PIS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_pis'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_pis DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_pis IS 'Valor do PIS (Programa de Integração Social)';
    END IF;
END $$;

-- Valor do COFINS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_cofins'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_cofins DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_cofins IS 'Valor do COFINS (Contribuição para o Financiamento da Seguridade Social)';
    END IF;
END $$;

-- Valor do INSS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_inss'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_inss DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_inss IS 'Valor do INSS (Instituto Nacional do Seguro Social)';
    END IF;
END $$;

-- Valor do IR (Imposto de Renda)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_ir'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_ir DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_ir IS 'Valor do IR (Imposto de Renda)';
    END IF;
END $$;

-- Valor do CSLL
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_csll'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_csll DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_csll IS 'Valor do CSLL (Contribuição Social sobre o Lucro Líquido)';
    END IF;
END $$;

-- Percentual Tributos Federais
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'percentual_tributos_federais'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN percentual_tributos_federais DECIMAL(5,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.percentual_tributos_federais IS 'Percentual aproximado de tributos federais';
    END IF;
END $$;

-- Percentual Tributos Estaduais
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'percentual_tributos_estaduais'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN percentual_tributos_estaduais DECIMAL(5,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.percentual_tributos_estaduais IS 'Percentual aproximado de tributos estaduais';
    END IF;
END $$;

-- Percentual Tributos Municipais
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'percentual_tributos_municipais'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN percentual_tributos_municipais DECIMAL(5,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.percentual_tributos_municipais IS 'Percentual aproximado de tributos municipais';
    END IF;
END $$;

-- ============================================
-- IDENTIFICAÇÃO PRESTAÇÃO DE SERVIÇOS
-- ============================================

-- Código A.R.T. (Anotação de Responsabilidade Técnica)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'codigo_art'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN codigo_art VARCHAR(50);
        
        COMMENT ON COLUMN notas_fiscais.codigo_art IS 'Código A.R.T. (Anotação de Responsabilidade Técnica)';
    END IF;
END $$;

-- Exigibilidade ISSQN
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'exigibilidade_issqn'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN exigibilidade_issqn VARCHAR(50);
        
        COMMENT ON COLUMN notas_fiscais.exigibilidade_issqn IS 'Exigibilidade ISSQN (ex: 1-Exigível)';
    END IF;
END $$;

-- Regime Especial de Tributação
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'regime_especial_tributacao'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN regime_especial_tributacao VARCHAR(50);
        
        COMMENT ON COLUMN notas_fiscais.regime_especial_tributacao IS 'Regime Especial de Tributação (ex: 0-Nenhum)';
    END IF;
END $$;

-- Simples Nacional
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'simples_nacional'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN simples_nacional BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN notas_fiscais.simples_nacional IS 'Indica se o prestador está no Simples Nacional';
    END IF;
END $$;

-- Incentivador Fiscal
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'incentivador_fiscal'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN incentivador_fiscal BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN notas_fiscais.incentivador_fiscal IS 'Indica se é incentivador fiscal';
    END IF;
END $$;

-- Competência
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'competencia'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN competencia VARCHAR(7);
        
        COMMENT ON COLUMN notas_fiscais.competencia IS 'Competência da NFS-e (formato MM/AAAA)';
    END IF;
END $$;

-- Município de Prestação
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'municipio_prestacao'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN municipio_prestacao VARCHAR(255);
        
        COMMENT ON COLUMN notas_fiscais.municipio_prestacao IS 'Município onde o serviço foi prestado';
    END IF;
END $$;

-- Município de Incidência
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'municipio_incidencia'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN municipio_incidencia VARCHAR(255);
        
        COMMENT ON COLUMN notas_fiscais.municipio_incidencia IS 'Município de incidência do ISSQN';
    END IF;
END $$;

-- ISSQN a Reter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'issqn_reter'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN issqn_reter BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN notas_fiscais.issqn_reter IS 'Indica se há ISSQN a reter';
    END IF;
END $$;

-- ============================================
-- DETALHAMENTO DE VALORES
-- ============================================

-- Valor do Serviço
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_servico'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_servico DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_servico IS 'Valor do serviço prestado';
    END IF;
END $$;

-- Desconto Incondicionado
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'desconto_incondicionado'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN desconto_incondicionado DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.desconto_incondicionado IS 'Desconto incondicionado';
    END IF;
END $$;

-- Desconto Condicionado
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'desconto_condicionado'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN desconto_condicionado DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.desconto_condicionado IS 'Desconto condicionado';
    END IF;
END $$;

-- Retenções Federais
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'retencoes_federais'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN retencoes_federais DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.retencoes_federais IS 'Valor total das retenções federais (PIS, COFINS, INSS, IR, CSLL)';
    END IF;
END $$;

-- Outras Retenções
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'outras_retencoes'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN outras_retencoes DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.outras_retencoes IS 'Outras retenções além das federais';
    END IF;
END $$;

-- Deduções Previstas em Lei
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'deducoes_previstas_lei'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN deducoes_previstas_lei DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.deducoes_previstas_lei IS 'Deduções previstas em lei';
    END IF;
END $$;

-- Alíquota ISSQN
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'aliquota_issqn'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN aliquota_issqn DECIMAL(5,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.aliquota_issqn IS 'Alíquota do ISSQN (percentual)';
    END IF;
END $$;

-- Valor Líquido
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'valor_liquido'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN valor_liquido DECIMAL(12,2) DEFAULT 0.00;
        
        COMMENT ON COLUMN notas_fiscais.valor_liquido IS 'Valor líquido após descontos e retenções';
    END IF;
END $$;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_codigo_verificacao 
ON notas_fiscais(codigo_verificacao);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_rps_numero 
ON notas_fiscais(rps_numero);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_codigo_obra 
ON notas_fiscais(codigo_obra);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_competencia 
ON notas_fiscais(competencia);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_municipio_prestacao 
ON notas_fiscais(municipio_prestacao);

