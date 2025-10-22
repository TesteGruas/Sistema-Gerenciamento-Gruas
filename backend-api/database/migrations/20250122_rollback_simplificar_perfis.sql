-- =========================================================
-- Rollback Migration: Reverter Simplificação de Perfis
-- Data: 2025-01-22
-- Objetivo: Restaurar sistema de perfis anterior caso necessário
-- =========================================================

-- ATENÇÃO: Este script restaura o estado anterior da migration
-- Execute apenas se houver problemas após a migração

BEGIN;

-- 1. Verificar se existem tabelas de backup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'perfis_backup') THEN
    RAISE EXCEPTION 'ERRO: Tabela perfis_backup não encontrada. Impossível fazer rollback.';
  END IF;
END $$;

-- 2. Restaurar dados das tabelas de backup
TRUNCATE perfis CASCADE;
INSERT INTO perfis SELECT * FROM perfis_backup;

TRUNCATE usuario_perfis CASCADE;
INSERT INTO usuario_perfis SELECT * FROM usuario_perfis_backup;

TRUNCATE perfil_permissoes CASCADE;
INSERT INTO perfil_permissoes SELECT * FROM perfil_permissoes_backup;

-- 3. Atualizar versão do sistema
UPDATE configuracoes_sistema 
SET valor = '1.0', updated_at = NOW()
WHERE chave = 'sistema_permissoes_versao';

-- 4. Remover comentários adicionados
COMMENT ON TABLE perfil_permissoes IS 'Tabela de relacionamento N:N entre perfis e permissões';

COMMIT;

RAISE NOTICE 'Rollback concluído com sucesso. Sistema de permissões restaurado para versão 1.0';

-- Exibir estado após rollback
SELECT 
  nome,
  nivel_acesso,
  status,
  (SELECT COUNT(*) FROM usuario_perfis WHERE perfil_id = perfis.id) as total_usuarios
FROM perfis 
ORDER BY nivel_acesso DESC;


