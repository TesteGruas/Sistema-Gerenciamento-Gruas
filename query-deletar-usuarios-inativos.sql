-- Query para deletar usuários com status 'Inativo'
-- ⚠️ ATENÇÃO: Leia todas as opções antes de executar!
--
-- 💡 DICA: Se você quer apenas liberar os emails para reutilização
--    sem deletar os registros, veja: query-limpar-emails-usuarios-inativos.sql

-- ============================================================================
-- OPÇÃO 1: SOFT DELETE (RECOMENDADO) - Marca como deletado sem remover fisicamente
-- ============================================================================
-- Esta é a forma recomendada pois mantém a integridade referencial
-- e permite recuperação futura se necessário

UPDATE usuarios 
SET deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'Inativo'
  AND deleted_at IS NULL;  -- Apenas usuários ainda não deletados

-- Para ver quantos serão afetados ANTES de executar:
-- SELECT COUNT(*) as total_afetados
-- FROM usuarios
-- WHERE status = 'Inativo'
--   AND deleted_at IS NULL;

-- ============================================================================
-- OPÇÃO 2: HARD DELETE - Remove permanentemente do banco
-- ============================================================================
-- ⚠️ CUIDADO: Esta operação é IRREVERSÍVEL!
-- Use apenas se tiver certeza absoluta que quer remover permanentemente

-- CORRIGIDO: DELETE não usa *, apenas DELETE FROM tabela WHERE condição
DELETE FROM usuarios 
WHERE status = 'Inativo';

-- Para ver quantos serão deletados ANTES de executar:
-- SELECT COUNT(*) as total_serao_deletados
-- FROM usuarios
-- WHERE status = 'Inativo';

-- ============================================================================
-- OPÇÃO 3: Deletar apenas usuários inativos SEM funcionário vinculado
-- ============================================================================
-- Mais seguro: só deleta usuários que não têm funcionário vinculado

-- Soft delete:
UPDATE usuarios 
SET deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'Inativo'
  AND funcionario_id IS NULL
  AND deleted_at IS NULL;

-- Hard delete:
-- DELETE FROM usuarios 
-- WHERE status = 'Inativo'
--   AND funcionario_id IS NULL;

-- ============================================================================
-- OPÇÃO 4: Deletar usuários inativos E já marcados como deletados
-- ============================================================================
-- Remove permanentemente usuários que já estão com deleted_at

DELETE FROM usuarios 
WHERE status = 'Inativo' 
   OR deleted_at IS NOT NULL;

-- ============================================================================
-- QUERIES DE VERIFICAÇÃO (Execute ANTES de deletar)
-- ============================================================================

-- Ver todos os usuários inativos que serão afetados:
SELECT 
    id,
    nome,
    email,
    status,
    funcionario_id,
    cargo,
    created_at,
    deleted_at
FROM usuarios
WHERE status = 'Inativo'
ORDER BY nome;

-- Contar usuários inativos:
SELECT COUNT(*) as total_inativos
FROM usuarios
WHERE status = 'Inativo';

-- Ver usuários inativos com informações do funcionário vinculado:
SELECT 
    u.id,
    u.nome,
    u.email,
    u.status,
    u.funcionario_id,
    f.nome as funcionario_nome,
    f.status as funcionario_status
FROM usuarios u
LEFT JOIN funcionarios f ON u.funcionario_id = f.id
WHERE u.status = 'Inativo'
ORDER BY u.nome;

-- ============================================================================
-- QUERIES DE RECUPERAÇÃO (Se precisar reverter soft delete)
-- ============================================================================

-- Restaurar usuários deletados logicamente:
-- UPDATE usuarios 
-- SET deleted_at = NULL,
--     updated_at = CURRENT_TIMESTAMP
-- WHERE deleted_at IS NOT NULL
--   AND status = 'Inativo';  -- Opcional: apenas inativos
