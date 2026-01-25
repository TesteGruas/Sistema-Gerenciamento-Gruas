-- Migration: Adicionar campo nota_fiscal_id na tabela boletos
-- Data: 2025-01-25
-- Descrição: Adiciona relacionamento entre boletos e notas fiscais

-- Adicionar coluna nota_fiscal_id
ALTER TABLE boletos 
ADD COLUMN IF NOT EXISTS nota_fiscal_id INTEGER REFERENCES notas_fiscais(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_boletos_nota_fiscal_id ON boletos(nota_fiscal_id);

-- Comentário
COMMENT ON COLUMN boletos.nota_fiscal_id IS 'ID da nota fiscal vinculada ao boleto';
