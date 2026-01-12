-- Script para adicionar campos de classificação na tabela produtos
-- Execute este script no banco de dados PostgreSQL/Supabase

-- Adicionar campo classificacao_tipo na tabela produtos
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS classificacao_tipo VARCHAR(50) CHECK (classificacao_tipo IN ('componente', 'item', 'ativo', 'complemento'));

-- Adicionar campo subcategoria_ativo na tabela produtos (para ativos)
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS subcategoria_ativo VARCHAR(50) CHECK (
  subcategoria_ativo IN ('grua', 'equipamento_grua', 'ferramenta', 'ar_condicionado', 'camera', 'auto', 'pc') 
  OR subcategoria_ativo IS NULL
);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_produtos_classificacao_tipo ON produtos(classificacao_tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_subcategoria_ativo ON produtos(subcategoria_ativo);

-- Comentários
COMMENT ON COLUMN produtos.classificacao_tipo IS 'Classificação principal: componente (partes do ativo), item (consumíveis), ativo (imobilizados), complemento (peças que compõem ativos)';
COMMENT ON COLUMN produtos.subcategoria_ativo IS 'Subcategoria para ativos: grua, equipamento_grua, ferramenta, ar_condicionado, camera, auto, pc';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'produtos' 
AND column_name IN ('classificacao_tipo', 'subcategoria_ativo');

