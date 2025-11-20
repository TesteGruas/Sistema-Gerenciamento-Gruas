-- Migration: Corrigir constraint produto_id na tabela estoque
-- Data: 2025-02-21
-- Descrição: Permite produto_id ser NULL quando tipo_item = 'componente'

-- Nota: A coluna produto_id já existe como VARCHAR, não precisamos adicioná-la
-- Apenas vamos torná-la nullable e criar a constraint CHECK

-- Se a coluna já existir com NOT NULL, precisamos alterá-la para nullable
-- PostgreSQL não permite ALTER COLUMN ... DROP NOT NULL diretamente se houver constraint
-- Então vamos tentar remover qualquer constraint NOT NULL primeiro
DO $$
BEGIN
  -- Tentar alterar a coluna para permitir NULL
  -- Se já for nullable, não fará nada
  ALTER TABLE estoque ALTER COLUMN produto_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Se não houver constraint NOT NULL ou coluna não existir, apenas continuar
    RAISE NOTICE 'Coluna produto_id já é nullable ou não existe: %', SQLERRM;
END $$;

-- Criar constraint que valida a lógica de negócio:
-- - Quando tipo_item = 'componente', produto_id deve ser NULL
-- - Quando tipo_item = 'produto', produto_id deve ser NOT NULL
DO $$
BEGIN
  -- Remover constraint check antiga se existir
  ALTER TABLE estoque DROP CONSTRAINT IF EXISTS check_produto_id_tipo_item;
  
  -- Criar nova constraint
  ALTER TABLE estoque 
  ADD CONSTRAINT check_produto_id_tipo_item 
  CHECK (
    -- Componente: produto_id deve ser NULL
    (tipo_item = 'componente' AND produto_id IS NULL) OR
    -- Produto: produto_id deve ser NOT NULL
    (tipo_item = 'produto' AND produto_id IS NOT NULL) OR
    -- Compatibilidade: se tipo_item for NULL (registros antigos), permitir qualquer coisa
    (tipo_item IS NULL)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar constraint: %', SQLERRM;
END $$;

-- Adicionar índice para produto_id se não existir
CREATE INDEX IF NOT EXISTS idx_estoque_produto_id ON estoque(produto_id);

-- Comentário
COMMENT ON COLUMN estoque.produto_id IS 'ID do produto quando tipo_item = produto. NULL quando tipo_item = componente';

