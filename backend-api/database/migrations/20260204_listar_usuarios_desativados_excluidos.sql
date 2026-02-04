-- Migration: Listar usuários desativados/excluídos
-- Data: 2026-02-04
-- Descrição: Gera uma lista de todos os usuários que estão desativados (status = 'Inativo') 
--            ou excluídos logicamente (deleted_at IS NOT NULL)
--            Esta migration apenas lista os usuários, não realiza nenhuma exclusão

BEGIN;

-- Log inicial e listagem
DO $$
DECLARE
    total_desativados INTEGER;
    total_excluidos INTEGER;
    total_geral INTEGER;
    usuario_record RECORD;
BEGIN
    -- Contar usuários desativados (status = 'Inativo' mas deleted_at IS NULL)
    SELECT COUNT(*) INTO total_desativados
    FROM usuarios
    WHERE status = 'Inativo' 
      AND deleted_at IS NULL;
    
    -- Contar usuários excluídos logicamente (deleted_at IS NOT NULL)
    SELECT COUNT(*) INTO total_excluidos
    FROM usuarios
    WHERE deleted_at IS NOT NULL;
    
    -- Contar total geral (desativados + excluídos)
    SELECT COUNT(*) INTO total_geral
    FROM usuarios
    WHERE status = 'Inativo' OR deleted_at IS NOT NULL;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📋 LISTAGEM DE USUÁRIOS DESATIVADOS/EXCLUÍDOS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 Estatísticas:';
    RAISE NOTICE '   - Usuários desativados (status = Inativo): %', total_desativados;
    RAISE NOTICE '   - Usuários excluídos logicamente (deleted_at): %', total_excluidos;
    RAISE NOTICE '   - Total geral: %', total_geral;
    RAISE NOTICE '';
    
    -- Listar usuários desativados
    IF total_desativados > 0 THEN
        RAISE NOTICE '📋 USUÁRIOS DESATIVADOS (status = Inativo):';
        RAISE NOTICE '─────────────────────────────────────────────────────────';
        FOR usuario_record IN 
            SELECT 
                id,
                nome,
                email,
                status,
                deleted_at,
                funcionario_id,
                created_at,
                updated_at
            FROM usuarios
            WHERE status = 'Inativo' 
              AND deleted_at IS NULL
            ORDER BY id
        LOOP
            RAISE NOTICE '   ID: %, Nome: %, Email: %, Funcionário ID: %, Criado em: %', 
                usuario_record.id, 
                usuario_record.nome, 
                usuario_record.email,
                COALESCE(usuario_record.funcionario_id::text, 'N/A'),
                usuario_record.created_at;
        END LOOP;
        RAISE NOTICE '';
    END IF;
    
    -- Listar usuários excluídos logicamente
    IF total_excluidos > 0 THEN
        RAISE NOTICE '🗑️  USUÁRIOS EXCLUÍDOS LOGICAMENTE (deleted_at IS NOT NULL):';
        RAISE NOTICE '─────────────────────────────────────────────────────────';
        FOR usuario_record IN 
            SELECT 
                id,
                nome,
                email,
                status,
                deleted_at,
                funcionario_id,
                created_at,
                updated_at
            FROM usuarios
            WHERE deleted_at IS NOT NULL
            ORDER BY deleted_at DESC, id
        LOOP
            RAISE NOTICE '   ID: %, Nome: %, Email: %, Status: %, Excluído em: %, Funcionário ID: %', 
                usuario_record.id, 
                usuario_record.nome, 
                usuario_record.email,
                usuario_record.status,
                usuario_record.deleted_at,
                COALESCE(usuario_record.funcionario_id::text, 'N/A');
        END LOOP;
        RAISE NOTICE '';
    END IF;
    
    -- Criar tabela temporária com a lista completa para consulta posterior
    CREATE TEMP TABLE IF NOT EXISTS usuarios_para_exclusao AS
    SELECT 
        id,
        nome,
        email,
        status,
        deleted_at,
        funcionario_id,
        created_at,
        updated_at,
        CASE 
            WHEN deleted_at IS NOT NULL THEN 'Excluído logicamente'
            WHEN status = 'Inativo' THEN 'Desativado'
            ELSE 'Outro'
        END as motivo_exclusao
    FROM usuarios
    WHERE status = 'Inativo' OR deleted_at IS NOT NULL
    ORDER BY deleted_at DESC NULLS LAST, id;
    
    RAISE NOTICE '✅ Tabela temporária criada: usuarios_para_exclusao';
    RAISE NOTICE '   Você pode consultar com: SELECT * FROM usuarios_para_exclusao;';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '⚠️  ATENÇÃO: Esta migration apenas LISTA os usuários.';
    RAISE NOTICE '   Para excluir permanentemente, execute a migration:';
    RAISE NOTICE '   20260204_excluir_usuarios_desativados_excluidos.sql';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Query para visualização (comentada - descomente para executar)
-- SELECT 
--     id,
--     nome,
--     email,
--     status,
--     deleted_at,
--     funcionario_id,
--     created_at,
--     updated_at,
--     CASE 
--         WHEN deleted_at IS NOT NULL THEN 'Excluído logicamente'
--         WHEN status = 'Inativo' THEN 'Desativado'
--         ELSE 'Outro'
--     END as motivo_exclusao
-- FROM usuarios
-- WHERE status = 'Inativo' OR deleted_at IS NOT NULL
-- ORDER BY deleted_at DESC NULLS LAST, id;

COMMIT;
