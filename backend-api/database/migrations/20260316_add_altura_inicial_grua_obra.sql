-- Garante o campo de altura inicial na configuração da grua por obra.
-- Segurança: usa IF NOT EXISTS para não falhar em bancos já atualizados.

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS altura_inicial DECIMAL(10,2);

COMMENT ON COLUMN grua_obra.altura_inicial IS 'Altura inicial da grua nesta obra em metros';

