-- Migration: Reorganizar categorias de estoque
-- Data: 2025-02-28
-- Descrição: Adiciona campo de classificação detalhada para organizar estoque em: Componentes, Itens, Ativos, Complementos

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

-- Atualizar categorias existentes para usar a nova classificação
-- Componentes: itens que são partes de ativos
UPDATE produtos 
SET classificacao_tipo = 'componente' 
WHERE tipo_item = 'componente' OR categoria LIKE '%componente%';

-- Itens: consumíveis (assumindo que são produtos que não são componentes)
UPDATE produtos 
SET classificacao_tipo = 'item' 
WHERE classificacao_tipo IS NULL AND tipo_item = 'produto';

-- Ativos: Gruas e equipamentos principais (baseado em categorias existentes)
UPDATE produtos 
SET classificacao_tipo = 'ativo', subcategoria_ativo = 'grua'
WHERE categoria LIKE '%grua%' AND classificacao_tipo IS NULL;

UPDATE produtos 
SET classificacao_tipo = 'ativo', subcategoria_ativo = 'equipamento_grua'
WHERE categoria LIKE '%equipamento%' OR categoria LIKE '%complemento%' AND classificacao_tipo IS NULL;

-- Complementos: peças que compõem os ativos
UPDATE produtos 
SET classificacao_tipo = 'complemento'
WHERE categoria LIKE '%peça%' OR categoria LIKE '%acessório%' AND classificacao_tipo IS NULL;









