-- Query SIMPLES para cancelar a cobrança diretamente no banco
-- Execute esta query no Supabase SQL Editor

UPDATE cobrancas_aluguel
SET status = 'cancelado',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '12cfd751-c945-408b-b638-129473d233fe';

-- Verificar se foi atualizado
SELECT id, status, updated_at 
FROM cobrancas_aluguel 
WHERE id = '12cfd751-c945-408b-b638-129473d233fe';
