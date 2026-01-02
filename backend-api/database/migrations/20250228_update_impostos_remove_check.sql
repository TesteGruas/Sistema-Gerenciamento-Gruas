-- Remover restrição CHECK do campo tipo na tabela impostos_financeiros
-- para permitir tipos personalizados vindos da tabela tipos_impostos

-- Primeiro, remover a constraint existente
ALTER TABLE impostos_financeiros 
  DROP CONSTRAINT IF EXISTS impostos_financeiros_tipo_check;

-- Alterar o campo tipo para aceitar qualquer string (já que agora temos tipos personalizados)
ALTER TABLE impostos_financeiros 
  ALTER COLUMN tipo TYPE VARCHAR(100);

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_impostos_financeiros_tipo ON impostos_financeiros(tipo);

-- Comentário atualizado
COMMENT ON COLUMN impostos_financeiros.tipo IS 'Tipo de imposto (pode ser padrão ou personalizado da tabela tipos_impostos)';









