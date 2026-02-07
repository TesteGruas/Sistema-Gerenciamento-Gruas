-- Query para deletar cobrança de aluguel e registros relacionados
-- ID da cobrança: 12cfd751-c945-408b-b638-129473d233fe

BEGIN;

-- 1. Deletar movimentação bancária relacionada (se existir)
DELETE FROM movimentacoes_bancarias 
WHERE id IN (
    SELECT movimentacao_bancaria_id 
    FROM cobrancas_aluguel 
    WHERE id = '12cfd751-c945-408b-b638-129473d233fe'
    AND movimentacao_bancaria_id IS NOT NULL
);

-- 2. Cancelar conta a pagar relacionada (se existir)
UPDATE contas_pagar
SET status = 'cancelado'
WHERE categoria = 'Aluguel'
AND observacoes ILIKE '%Cobrança de aluguel ID: 12cfd751-c945-408b-b638-129473d233fe%';

-- 3. Remover vinculação com boleto (se existir)
UPDATE cobrancas_aluguel
SET boleto_id = NULL
WHERE id = '12cfd751-c945-408b-b638-129473d233fe';

-- 4. Deletar a cobrança
DELETE FROM cobrancas_aluguel
WHERE id = '12cfd751-c945-408b-b638-129473d233fe';

COMMIT;

-- Verificar se foi deletada
SELECT * FROM cobrancas_aluguel WHERE id = '12cfd751-c945-408b-b638-129473d233fe';
