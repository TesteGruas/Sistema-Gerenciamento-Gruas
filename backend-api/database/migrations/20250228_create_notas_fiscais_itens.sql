-- Migration: Criar tabela de itens da nota fiscal
-- Data: 2025-02-28
-- Descrição: Cria tabela para armazenar os itens/produtos de uma nota fiscal

-- Criar tabela de itens da nota fiscal
CREATE TABLE IF NOT EXISTS notas_fiscais_itens (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INTEGER NOT NULL REFERENCES notas_fiscais(id) ON DELETE CASCADE,
    
    -- Dados do Item
    codigo_produto VARCHAR(100),
    descricao TEXT NOT NULL,
    ncm_sh VARCHAR(10),
    csosn VARCHAR(10),
    cfop VARCHAR(10),
    unidade VARCHAR(10),
    quantidade DECIMAL(10,3) NOT NULL,
    preco_unitario DECIMAL(12,2) NOT NULL,
    preco_total DECIMAL(12,2) NOT NULL,
    
    -- Impostos do Item
    base_calculo_icms DECIMAL(12,2) DEFAULT 0.00,
    valor_icms DECIMAL(12,2) DEFAULT 0.00,
    valor_ipi DECIMAL(12,2) DEFAULT 0.00,
    percentual_icms DECIMAL(5,4) DEFAULT 0.0000,
    percentual_ipi DECIMAL(5,2) DEFAULT 0.00,
    
    -- Ordem do item na nota
    ordem INTEGER DEFAULT 1,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comentários
COMMENT ON TABLE notas_fiscais_itens IS 'Itens/produtos de uma nota fiscal';
COMMENT ON COLUMN notas_fiscais_itens.codigo_produto IS 'Código do produto (pode ser CFOP ou código interno)';
COMMENT ON COLUMN notas_fiscais_itens.descricao IS 'Descrição do produto/serviço';
COMMENT ON COLUMN notas_fiscais_itens.ncm_sh IS 'NCM/SH do produto';
COMMENT ON COLUMN notas_fiscais_itens.csosn IS 'CSOSN (Código de Situação da Operação - Simples Nacional)';
COMMENT ON COLUMN notas_fiscais_itens.cfop IS 'CFOP (Código Fiscal de Operações e Prestações)';
COMMENT ON COLUMN notas_fiscais_itens.unidade IS 'Unidade de medida (UN, KG, M, etc)';
COMMENT ON COLUMN notas_fiscais_itens.quantidade IS 'Quantidade do item';
COMMENT ON COLUMN notas_fiscais_itens.preco_unitario IS 'Preço unitário do item';
COMMENT ON COLUMN notas_fiscais_itens.preco_total IS 'Preço total do item (quantidade × preço unitário)';
COMMENT ON COLUMN notas_fiscais_itens.base_calculo_icms IS 'Base de cálculo do ICMS do item';
COMMENT ON COLUMN notas_fiscais_itens.valor_icms IS 'Valor do ICMS do item';
COMMENT ON COLUMN notas_fiscais_itens.valor_ipi IS 'Valor do IPI do item';
COMMENT ON COLUMN notas_fiscais_itens.percentual_icms IS 'Percentual do ICMS do item';
COMMENT ON COLUMN notas_fiscais_itens.percentual_ipi IS 'Percentual do IPI do item';
COMMENT ON COLUMN notas_fiscais_itens.ordem IS 'Ordem do item na nota fiscal';

-- Índices
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_itens_nota_fiscal_id 
ON notas_fiscais_itens(nota_fiscal_id);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_itens_codigo_produto 
ON notas_fiscais_itens(codigo_produto);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_itens_ncm_sh 
ON notas_fiscais_itens(ncm_sh);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_itens_cfop 
ON notas_fiscais_itens(cfop);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notas_fiscais_itens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notas_fiscais_itens_updated_at
    BEFORE UPDATE ON notas_fiscais_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_notas_fiscais_itens_updated_at();

