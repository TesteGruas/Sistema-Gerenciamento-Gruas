-- Script de limpeza específico para obra 91
-- Data: 2025-02-02
-- Descrição: Remove duplicatas de sinaleiros da obra 91, mantendo apenas o registro mais antigo

BEGIN;

-- Verificar duplicatas antes da limpeza
DO $$
DECLARE
    duplicatas_info TEXT;
BEGIN
    SELECT string_agg(
        format('Obra %s: %s (%s) - %s registros', 
            obra_id, nome, rg_cpf, cnt::text),
        E'\n'
    ) INTO duplicatas_info
    FROM (
        SELECT obra_id, nome, rg_cpf, COUNT(*) as cnt
        FROM sinaleiros_obra
        WHERE obra_id = 91
        GROUP BY obra_id, nome, rg_cpf
        HAVING COUNT(*) > 1
    ) duplicatas;
    
    IF duplicatas_info IS NOT NULL THEN
        RAISE NOTICE 'Duplicatas encontradas na obra 91:%', E'\n' || duplicatas_info;
    ELSE
        RAISE NOTICE 'Nenhuma duplicata encontrada na obra 91.';
    END IF;
END $$;

-- Remover duplicatas da obra 91, mantendo apenas o registro mais antigo
WITH sinaleiros_para_manter AS (
    SELECT DISTINCT ON (obra_id, nome, rg_cpf)
        id,
        obra_id,
        nome,
        rg_cpf,
        created_at
    FROM sinaleiros_obra
    WHERE obra_id = 91
    ORDER BY obra_id, nome, rg_cpf, created_at ASC
),
sinaleiros_para_remover AS (
    SELECT so.id
    FROM sinaleiros_obra so
    WHERE so.obra_id = 91
      AND NOT EXISTS (
        SELECT 1
        FROM sinaleiros_para_manter spm
        WHERE spm.id = so.id
    )
)
DELETE FROM sinaleiros_obra
WHERE id IN (SELECT id FROM sinaleiros_para_remover);

-- Verificar resultado após limpeza
DO $$
DECLARE
    total_restantes INTEGER;
    grupos_unicos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_restantes 
    FROM sinaleiros_obra 
    WHERE obra_id = 91;
    
    SELECT COUNT(*) INTO grupos_unicos
    FROM (
        SELECT DISTINCT nome, rg_cpf
        FROM sinaleiros_obra
        WHERE obra_id = 91
    ) grupos;
    
    RAISE NOTICE 'Limpeza concluída para obra 91!';
    RAISE NOTICE 'Total de registros restantes: %', total_restantes;
    RAISE NOTICE 'Total de grupos únicos (nome + rg_cpf): %', grupos_unicos;
    
    -- Verificar se ainda há duplicatas
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT nome, rg_cpf, COUNT(*) as cnt
            FROM sinaleiros_obra
            WHERE obra_id = 91
            GROUP BY nome, rg_cpf
            HAVING COUNT(*) > 1
        ) duplicatas
    ) THEN
        RAISE WARNING 'ATENÇÃO: Ainda existem duplicatas na obra 91 após a limpeza!';
    ELSE
        RAISE NOTICE 'Verificação: Nenhuma duplicata encontrada após a limpeza.';
    END IF;
END $$;

COMMIT;
