-- Migration: Excluir permanentemente usuários desativados/excluídos
-- Data: 2026-02-04
-- Descrição: Exclui permanentemente todos os usuários que estão desativados (status = 'Inativo') 
--            ou excluídos logicamente (deleted_at IS NOT NULL)
--            ATENÇÃO: Esta migration realiza exclusão PERMANENTE. Execute com cuidado!
--            Recomenda-se executar primeiro a migration 20260204_listar_usuarios_desativados_excluidos.sql
--            para revisar quais usuários serão excluídos

BEGIN;

-- Log inicial
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
    RAISE NOTICE '🗑️  EXCLUSÃO PERMANENTE DE USUÁRIOS DESATIVADOS/EXCLUÍDOS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 Usuários que serão excluídos permanentemente:';
    RAISE NOTICE '   - Usuários desativados (status = Inativo): %', total_desativados;
    RAISE NOTICE '   - Usuários excluídos logicamente (deleted_at): %', total_excluidos;
    RAISE NOTICE '   - Total geral: %', total_geral;
    RAISE NOTICE '';
    
    IF total_geral = 0 THEN
        RAISE NOTICE '✅ Nenhum usuário encontrado para exclusão.';
        RAISE NOTICE '═══════════════════════════════════════════════════════════';
        RETURN;
    END IF;
    
    -- Listar usuários que serão excluídos
    RAISE NOTICE '📋 Usuários que serão excluídos:';
    RAISE NOTICE '─────────────────────────────────────────────────────────';
    FOR usuario_record IN 
        SELECT 
            id,
            nome,
            email,
            status,
            deleted_at,
            funcionario_id
        FROM usuarios
        WHERE status = 'Inativo' OR deleted_at IS NOT NULL
        ORDER BY deleted_at DESC NULLS LAST, id
        LIMIT 50  -- Limitar a 50 para não sobrecarregar o log
    LOOP
        RAISE NOTICE '   ID: %, Nome: %, Email: %, Status: %, Funcionário ID: %', 
            usuario_record.id, 
            usuario_record.nome, 
            usuario_record.email,
            usuario_record.status,
            COALESCE(usuario_record.funcionario_id::text, 'N/A');
    END LOOP;
    
    IF total_geral > 50 THEN
        RAISE NOTICE '   ... e mais % usuário(s)', total_geral - 50;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Verificar se há relacionamentos que podem causar problemas
DO $$
DECLARE
    usuarios_com_relacionamentos INTEGER;
BEGIN
    -- Verificar usuários que têm relacionamentos ativos
    SELECT COUNT(DISTINCT u.id) INTO usuarios_com_relacionamentos
    FROM usuarios u
    WHERE (u.status = 'Inativo' OR u.deleted_at IS NOT NULL)
      AND (
          -- Verificar se tem perfil ativo
          EXISTS (
              SELECT 1 FROM usuario_perfis up 
              WHERE up.usuario_id = u.id AND up.status = 'Ativa'
          )
          -- Adicione aqui outras verificações de relacionamentos se necessário
      );
    
    IF usuarios_com_relacionamentos > 0 THEN
        RAISE WARNING '⚠️  Encontrados % usuário(s) com relacionamentos ativos que serão excluídos!', usuarios_com_relacionamentos;
        RAISE WARNING '   Verifique manualmente antes de continuar.';
    END IF;
END $$;

-- Excluir relacionamentos primeiro (usuario_perfis)
DO $$
DECLARE
    perfis_excluidos INTEGER;
BEGIN
    -- Excluir perfis de usuários que serão deletados
    DELETE FROM usuario_perfis
    WHERE usuario_id IN (
        SELECT id FROM usuarios
        WHERE status = 'Inativo' OR deleted_at IS NOT NULL
    );
    
    GET DIAGNOSTICS perfis_excluidos = ROW_COUNT;
    
    RAISE NOTICE '🗑️  Relacionamentos excluídos:';
    RAISE NOTICE '   - Perfis de usuário excluídos: %', perfis_excluidos;
END $$;

-- Excluir permanentemente os usuários
DO $$
DECLARE
    usuarios_excluidos INTEGER;
BEGIN
    -- Excluir usuários desativados ou excluídos logicamente
    DELETE FROM usuarios
    WHERE status = 'Inativo' OR deleted_at IS NOT NULL;
    
    GET DIAGNOSTICS usuarios_excluidos = ROW_COUNT;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ EXCLUSÃO CONCLUÍDA';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 Usuários excluídos permanentemente: %', usuarios_excluidos;
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Verificação final
DO $$
DECLARE
    usuarios_restantes INTEGER;
BEGIN
    -- Verificar se ainda há usuários desativados/excluídos
    SELECT COUNT(*) INTO usuarios_restantes
    FROM usuarios
    WHERE status = 'Inativo' OR deleted_at IS NOT NULL;
    
    IF usuarios_restantes > 0 THEN
        RAISE WARNING '⚠️  ATENÇÃO: Ainda existem % usuário(s) desativados/excluídos!', usuarios_restantes;
        RAISE WARNING '   Verifique manualmente se há algum problema.';
    ELSE
        RAISE NOTICE '✅ Todos os usuários desativados/excluídos foram removidos permanentemente!';
    END IF;
END $$;

COMMIT;

-- Verificação final (opcional - descomente para executar)
-- SELECT COUNT(*) as usuarios_desativados_excluidos_restantes
-- FROM usuarios
-- WHERE status = 'Inativo' OR deleted_at IS NOT NULL;
