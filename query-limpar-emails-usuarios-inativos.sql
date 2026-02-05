-- Query para limpar APENAS os emails de usuários inativos
-- Isso permite reutilizar os emails sem deletar os registros
-- ⚠️ ATENÇÃO: Isso pode afetar o login se o email for usado para autenticação

-- ============================================================================
-- OPÇÃO 1: Limpar email (colocar como NULL) - RECOMENDADO
-- ============================================================================
-- Se a coluna email permite NULL, use esta opção

UPDATE usuarios 
SET email = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'Inativo'
  AND email IS NOT NULL;  -- Apenas usuários que têm email

-- Para ver quantos serão afetados ANTES de executar:
-- SELECT COUNT(*) as total_afetados
-- FROM usuarios
-- WHERE status = 'Inativo'
--   AND email IS NOT NULL;

-- ============================================================================
-- OPÇÃO 2: Limpar email (colocar como string vazia)
-- ============================================================================
-- Use se a coluna email NÃO permite NULL

UPDATE usuarios 
SET email = '',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'Inativo'
  AND email IS NOT NULL
  AND email != '';  -- Apenas usuários que têm email não vazio

-- ============================================================================
-- OPÇÃO 3: Limpar email E fazer soft delete
-- ============================================================================
-- Limpa o email e marca como deletado (dupla proteção)

UPDATE usuarios 
SET email = NULL,
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'Inativo'
  AND email IS NOT NULL
  AND deleted_at IS NULL;  -- Apenas usuários ainda não deletados

-- ============================================================================
-- OPÇÃO 4: Limpar email de usuários inativos SEM funcionário vinculado
-- ============================================================================
-- Mais seguro: só limpa emails de usuários órfãos

UPDATE usuarios 
SET email = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'Inativo'
  AND funcionario_id IS NULL
  AND email IS NOT NULL;

-- ============================================================================
-- OPÇÃO 5: Limpar email e adicionar sufixo para backup
-- ============================================================================
-- Adiciona sufixo ao email ao invés de deletar (permite recuperação)

UPDATE usuarios 
SET email = email || '.inativo.' || id || '@backup',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'Inativo'
  AND email IS NOT NULL
  AND email NOT LIKE '%.inativo.%';  -- Evitar duplicar o sufixo

-- ============================================================================
-- QUERIES DE VERIFICAÇÃO (Execute ANTES de limpar)
-- ============================================================================

-- Ver todos os emails que serão limpos:
SELECT 
    id,
    nome,
    email,
    status,
    funcionario_id,
    created_at
FROM usuarios
WHERE status = 'Inativo'
  AND email IS NOT NULL
ORDER BY email;

-- Contar quantos emails serão limpos:
SELECT COUNT(*) as total_emails_serao_limpos
FROM usuarios
WHERE status = 'Inativo'
  AND email IS NOT NULL;

-- Ver lista completa com informações do funcionário:
SELECT 
    u.id,
    u.nome,
    u.email,
    u.status,
    u.funcionario_id,
    f.nome as funcionario_nome,
    f.email as funcionario_email
FROM usuarios u
LEFT JOIN funcionarios f ON u.funcionario_id = f.id
WHERE u.status = 'Inativo'
  AND u.email IS NOT NULL
ORDER BY u.email;

-- Verificar se há emails duplicados (antes de limpar):
SELECT 
    email,
    COUNT(*) as total_usuarios
FROM usuarios
WHERE status = 'Inativo'
  AND email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY total_usuarios DESC;

-- ============================================================================
-- QUERIES DE RECUPERAÇÃO (Se precisar restaurar emails)
-- ============================================================================

-- Se você usou a OPÇÃO 5 (sufixo), pode restaurar assim:
-- UPDATE usuarios 
-- SET email = REPLACE(email, '.inativo.' || id || '@backup', ''),
--     updated_at = CURRENT_TIMESTAMP
-- WHERE email LIKE '%.inativo.%@backup'
--   AND status = 'Inativo';

-- ============================================================================
-- QUERY COMPLETA: Limpar emails + Soft Delete (RECOMENDADO)
-- ============================================================================
-- Esta é a melhor opção: limpa o email E marca como deletado

BEGIN;

-- 1. Ver quantos serão afetados
SELECT COUNT(*) as total_afetados
FROM usuarios
WHERE status = 'Inativo'
  AND email IS NOT NULL
  AND deleted_at IS NULL;

-- 2. Limpar emails e fazer soft delete
UPDATE usuarios 
SET email = NULL,
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'Inativo'
  AND email IS NOT NULL
  AND deleted_at IS NULL;

-- 3. Verificar resultado
SELECT COUNT(*) as total_processados
FROM usuarios
WHERE status = 'Inativo'
  AND email IS NULL
  AND deleted_at IS NOT NULL;

-- Se estiver tudo certo, execute COMMIT. Se não, execute ROLLBACK
-- COMMIT;
-- ROLLBACK;
