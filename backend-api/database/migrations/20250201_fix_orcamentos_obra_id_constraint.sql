-- Migration: Corrigir constraint de obra_id na tabela orcamentos
-- Data: 2025-02-01
-- Descrição: Altera a constraint para permitir SET NULL quando uma obra for excluída,
--            permitindo que os orçamentos sejam mantidos mesmo após a exclusão da obra

-- Remover a constraint antiga se existir (usando múltiplas tentativas com nomes comuns)
DO $$ 
BEGIN
  -- Tentar remover com o nome padrão do PostgreSQL
  ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_obra_id_fkey;
EXCEPTION
  WHEN undefined_object THEN
    -- Se não existir, tentar encontrar e remover qualquer constraint FK em obra_id
    NULL;
END $$;

-- Remover qualquer outra constraint FK relacionada a obra_id usando uma busca dinâmica
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'orcamentos'
      AND a.attname = 'obra_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Recriar a constraint com ON DELETE SET NULL
ALTER TABLE orcamentos
ADD CONSTRAINT orcamentos_obra_id_fkey 
FOREIGN KEY (obra_id) 
REFERENCES obras(id) 
ON DELETE SET NULL;

-- Comentário na coluna
COMMENT ON COLUMN orcamentos.obra_id IS 'ID da obra vinculada. Pode ser NULL se a obra foi excluída.';
