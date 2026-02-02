-- Migration: Remover duplicatas de sinaleiros
-- Data: 2025-02-02
-- Descrição: Remove registros duplicados de sinaleiros baseado em obra_id + nome + rg_cpf
-- Mantém apenas o registro mais antigo (menor created_at) para cada combinação única

BEGIN;

-- Log inicial
DO $$
DECLARE
    total_duplicatas INTEGER;
BEGIN
    -- Contar duplicatas antes da limpeza
    SELECT COUNT(*) INTO total_duplicatas
    FROM (
        SELECT obra_id, nome, rg_cpf, COUNT(*) as cnt
        FROM sinaleiros_obra
        GROUP BY obra_id, nome, rg_cpf
        HAVING COUNT(*) > 1
    ) duplicatas;
    
    RAISE NOTICE 'Total de grupos com duplicatas encontrados: %', total_duplicatas;
END $$;

-- Remover duplicatas mantendo apenas o registro mais antigo
-- Usa CTE para identificar quais registros devem ser mantidos (os mais antigos)
WITH sinaleiros_para_manter AS (
    SELECT DISTINCT ON (obra_id, nome, rg_cpf)
        id,
        obra_id,
        nome,
        rg_cpf,
        created_at
    FROM sinaleiros_obra
    ORDER BY obra_id, nome, rg_cpf, created_at ASC
),
sinaleiros_para_remover AS (
    SELECT so.id
    FROM sinaleiros_obra so
    WHERE NOT EXISTS (
        SELECT 1
        FROM sinaleiros_para_manter spm
        WHERE spm.id = so.id
    )
)
DELETE FROM sinaleiros_obra
WHERE id IN (SELECT id FROM sinaleiros_para_remover);

-- Log final
DO $$
DECLARE
    total_restantes INTEGER;
    grupos_unicos INTEGER;
BEGIN
    -- Contar registros restantes
    SELECT COUNT(*) INTO total_restantes FROM sinaleiros_obra;
    
    -- Contar grupos únicos
    SELECT COUNT(*) INTO grupos_unicos
    FROM (
        SELECT DISTINCT obra_id, nome, rg_cpf
        FROM sinaleiros_obra
    ) grupos;
    
    RAISE NOTICE 'Limpeza concluída!';
    RAISE NOTICE 'Total de registros restantes: %', total_restantes;
    RAISE NOTICE 'Total de grupos únicos (obra_id + nome + rg_cpf): %', grupos_unicos;
END $$;

-- Verificar se ainda há duplicatas (não deveria haver)
DO $$
DECLARE
    ainda_tem_duplicatas INTEGER;
BEGIN
    SELECT COUNT(*) INTO ainda_tem_duplicatas
    FROM (
        SELECT obra_id, nome, rg_cpf, COUNT(*) as cnt
        FROM sinaleiros_obra
        GROUP BY obra_id, nome, rg_cpf
        HAVING COUNT(*) > 1
    ) duplicatas;
    
    IF ainda_tem_duplicatas > 0 THEN
        RAISE WARNING 'ATENÇÃO: Ainda existem % grupos com duplicatas após a limpeza!', ainda_tem_duplicatas;
    ELSE
        RAISE NOTICE 'Verificação: Nenhuma duplicata encontrada após a limpeza.';
    END IF;
END $$;

COMMIT;
