-- Script para remover TODOS os sinaleiros de teste da obra 91
-- Data: 2025-02-02
-- Descrição: Remove todos os sinaleiros da obra 91 (dados de teste)
-- ATENÇÃO: Este script remove TODOS os sinaleiros da obra 91!

BEGIN;

-- Verificar sinaleiros antes da remoção
DO $$
DECLARE
    total_sinaleiros INTEGER;
    sinaleiros_info TEXT;
BEGIN
    SELECT COUNT(*) INTO total_sinaleiros
    FROM sinaleiros_obra
    WHERE obra_id = 91;
    
    SELECT string_agg(
        format('- %s (%s) - Tipo: %s', nome, rg_cpf, tipo),
        E'\n'
        ORDER BY created_at
    ) INTO sinaleiros_info
    FROM sinaleiros_obra
    WHERE obra_id = 91;
    
    RAISE NOTICE 'Total de sinaleiros na obra 91: %', total_sinaleiros;
    
    IF sinaleiros_info IS NOT NULL THEN
        RAISE NOTICE 'Sinaleiros que serão removidos:%', E'\n' || sinaleiros_info;
    END IF;
END $$;

-- Verificar se há documentos vinculados aos sinaleiros
DO $$
DECLARE
    total_documentos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_documentos
    FROM documentos_sinaleiro ds
    INNER JOIN sinaleiros_obra so ON ds.sinaleiro_id = so.id
    WHERE so.obra_id = 91;
    
    IF total_documentos > 0 THEN
        RAISE WARNING 'ATENÇÃO: Existem % documentos vinculados aos sinaleiros da obra 91!', total_documentos;
        RAISE WARNING 'Os documentos serão removidos automaticamente devido ao CASCADE.';
    ELSE
        RAISE NOTICE 'Nenhum documento encontrado vinculado aos sinaleiros da obra 91.';
    END IF;
END $$;

-- Remover todos os sinaleiros da obra 91
-- Os documentos serão removidos automaticamente devido ao CASCADE
DELETE FROM sinaleiros_obra
WHERE obra_id = 91;

-- Verificar resultado após remoção
DO $$
DECLARE
    total_restantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_restantes 
    FROM sinaleiros_obra 
    WHERE obra_id = 91;
    
    IF total_restantes = 0 THEN
        RAISE NOTICE '✅ Todos os sinaleiros da obra 91 foram removidos com sucesso!';
    ELSE
        RAISE WARNING 'ATENÇÃO: Ainda existem % sinaleiros na obra 91 após a remoção!', total_restantes;
    END IF;
END $$;

COMMIT;
