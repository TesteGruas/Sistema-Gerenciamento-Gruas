-- Adiciona campo opcional de valor customizado por funcionário
-- (compatível com ambientes onde a coluna ainda não existe)
ALTER TABLE funcionario_beneficios
ADD COLUMN IF NOT EXISTS valor NUMERIC(10,2);

COMMENT ON COLUMN funcionario_beneficios.valor IS
'Valor customizado do benefício para o funcionário (opcional). Se nulo, usar valor padrão de beneficios_tipo.';
