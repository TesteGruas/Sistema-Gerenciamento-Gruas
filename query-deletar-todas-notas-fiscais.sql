-- Query para deletar todas as notas fiscais e dados relacionados
-- ATENÇÃO: Esta query irá deletar TODAS as notas fiscais, boletos vinculados e itens
-- Use com cuidado! Faça backup antes se necessário.

BEGIN;

-- 1. Deletar todos os boletos vinculados a notas fiscais
DELETE FROM boletos 
WHERE nota_fiscal_id IS NOT NULL;

-- 2. Deletar todos os itens das notas fiscais
DELETE FROM notas_fiscais_itens;

-- 3. Deletar todas as notas fiscais
DELETE FROM notas_fiscais;

-- Verificar se deletou tudo
SELECT 
    (SELECT COUNT(*) FROM notas_fiscais) as total_notas_fiscais,
    (SELECT COUNT(*) FROM boletos WHERE nota_fiscal_id IS NOT NULL) as total_boletos_vinculados,
    (SELECT COUNT(*) FROM notas_fiscais_itens) as total_itens;

COMMIT;

-- Se quiser deletar apenas notas fiscais de teste criadas hoje, use esta query alternativa:
/*
BEGIN;

-- Deletar boletos vinculados a notas fiscais criadas hoje
DELETE FROM boletos 
WHERE nota_fiscal_id IN (
    SELECT id FROM notas_fiscais 
    WHERE DATE(created_at) = CURRENT_DATE
);

-- Deletar itens de notas fiscais criadas hoje
DELETE FROM notas_fiscais_itens
WHERE nota_fiscal_id IN (
    SELECT id FROM notas_fiscais 
    WHERE DATE(created_at) = CURRENT_DATE
);

-- Deletar notas fiscais criadas hoje
DELETE FROM notas_fiscais
WHERE DATE(created_at) = CURRENT_DATE;

COMMIT;
*/
