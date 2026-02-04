-- Migration: Remover sinaleiros mockados de teste
-- Data: 2026-02-03
-- Descrição: Remove sinaleiros com dados de teste (Pedro Oliveira e Maria Santos) que foram criados pela função de preencher dados de teste

BEGIN;

-- Verificar sinaleiros mockados antes da remoção
DO $$
DECLARE
    total_sinaleiros_mockados INTEGER;
    sinaleiros_info TEXT;
BEGIN
    -- Buscar sinaleiros com dados de teste conhecidos
    SELECT COUNT(*) INTO total_sinaleiros_mockados
    FROM sinaleiros_obra
    WHERE (nome = 'Pedro Oliveira' AND rg_cpf = '98765432100')
       OR (nome = 'Maria Santos' AND rg_cpf = '11122233344')
       OR (email = 'pedro.oliveira@empresa.com.br')
       OR (email = 'maria.santos@cliente.com.br');
    
    SELECT string_agg(
        format('- %s (%s) - Tipo: %s - Obra ID: %s', nome, rg_cpf, tipo, obra_id),
        E'\n'
        ORDER BY created_at
    ) INTO sinaleiros_info
    FROM sinaleiros_obra
    WHERE (nome = 'Pedro Oliveira' AND rg_cpf = '98765432100')
       OR (nome = 'Maria Santos' AND rg_cpf = '11122233344')
       OR (email = 'pedro.oliveira@empresa.com.br')
       OR (email = 'maria.santos@cliente.com.br');
    
    RAISE NOTICE 'Total de sinaleiros mockados encontrados: %', total_sinaleiros_mockados;
    
    IF sinaleiros_info IS NOT NULL THEN
        RAISE NOTICE 'Sinaleiros mockados que serão removidos:%', E'\n' || sinaleiros_info;
    ELSE
        RAISE NOTICE 'Nenhum sinaleiro mockado encontrado.';
    END IF;
END $$;

-- Verificar se há documentos vinculados aos sinaleiros mockados
DO $$
DECLARE
    total_documentos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_documentos
    FROM documentos_sinaleiro ds
    INNER JOIN sinaleiros_obra so ON ds.sinaleiro_id = so.id
    WHERE (so.nome = 'Pedro Oliveira' AND so.rg_cpf = '98765432100')
       OR (so.nome = 'Maria Santos' AND so.rg_cpf = '11122233344')
       OR (so.email = 'pedro.oliveira@empresa.com.br')
       OR (so.email = 'maria.santos@cliente.com.br');
    
    IF total_documentos > 0 THEN
        RAISE WARNING 'ATENÇÃO: Existem % documentos vinculados aos sinaleiros mockados!', total_documentos;
        RAISE WARNING 'Os documentos serão removidos automaticamente devido ao CASCADE.';
    ELSE
        RAISE NOTICE 'Nenhum documento encontrado vinculado aos sinaleiros mockados.';
    END IF;
END $$;

-- Remover sinaleiros mockados
-- Os documentos serão removidos automaticamente devido ao CASCADE
DELETE FROM sinaleiros_obra
WHERE (nome = 'Pedro Oliveira' AND rg_cpf = '98765432100')
   OR (nome = 'Maria Santos' AND rg_cpf = '11122233344')
   OR (email = 'pedro.oliveira@empresa.com.br')
   OR (email = 'maria.santos@cliente.com.br');

-- Verificar resultado após remoção
DO $$
DECLARE
    total_restantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_restantes 
    FROM sinaleiros_obra
    WHERE (nome = 'Pedro Oliveira' AND rg_cpf = '98765432100')
       OR (nome = 'Maria Santos' AND rg_cpf = '11122233344')
       OR (email = 'pedro.oliveira@empresa.com.br')
       OR (email = 'maria.santos@cliente.com.br');
    
    IF total_restantes = 0 THEN
        RAISE NOTICE '✅ Todos os sinaleiros mockados foram removidos com sucesso!';
    ELSE
        RAISE WARNING 'ATENÇÃO: Ainda existem % sinaleiros mockados após a remoção!', total_restantes;
    END IF;
END $$;

COMMIT;
