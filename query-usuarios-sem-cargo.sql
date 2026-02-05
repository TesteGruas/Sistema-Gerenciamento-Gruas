-- Query para buscar usuários SEM cargo (NULL ou vazio)
-- Execute esta query no Supabase SQL Editor ou no seu cliente PostgreSQL

-- Opção 1: Usuários com cargo NULL ou vazio (string vazia)
SELECT 
    u.id,
    u.nome,
    u.email,
    u.telefone,
    u.cpf,
    u.cargo,
    u.turno,
    u.status,
    u.funcionario_id,
    u.created_at,
    u.updated_at
FROM usuarios u
WHERE (u.cargo IS NULL OR u.cargo = '')  -- Cargo NULL ou string vazia
  AND u.deleted_at IS NULL               -- Apenas usuários não deletados (soft delete)
ORDER BY u.nome;

-- Opção 2: Apenas usuários com cargo NULL (mais restritivo)
SELECT 
    u.id,
    u.nome,
    u.email,
    u.telefone,
    u.cpf,
    u.cargo,
    u.turno,
    u.status,
    u.funcionario_id,
    u.created_at,
    u.updated_at
FROM usuarios u
WHERE u.cargo IS NULL                    -- Apenas cargo NULL
  AND u.deleted_at IS NULL               -- Apenas usuários não deletados
ORDER BY u.nome;

-- Opção 3: Usuários sem cargo com JOIN em funcionarios (mais informações)
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.telefone as usuario_telefone,
    u.cpf as usuario_cpf,
    u.cargo as usuario_cargo,
    u.status as usuario_status,
    f.id as funcionario_id,
    f.nome as funcionario_nome,
    f.cargo as funcionario_cargo,
    f.status as funcionario_status,
    f.data_admissao,
    f.salario
FROM usuarios u
LEFT JOIN funcionarios f ON u.funcionario_id = f.id
WHERE (u.cargo IS NULL OR u.cargo = '')  -- Cargo NULL ou vazio
  AND u.deleted_at IS NULL               -- Apenas usuários não deletados
ORDER BY u.nome;

-- Opção 4: Usuários sem cargo E sem funcionario_id vinculado
SELECT 
    u.id,
    u.nome,
    u.email,
    u.telefone,
    u.cpf,
    u.cargo,
    u.funcionario_id,
    u.status,
    u.created_at,
    u.updated_at
FROM usuarios u
WHERE (u.cargo IS NULL OR u.cargo = '')  -- Sem cargo
  AND u.funcionario_id IS NULL           -- Sem funcionário vinculado
  AND u.deleted_at IS NULL               -- Não deletado
ORDER BY u.nome;

-- Para contar quantos usuários não têm cargo:
-- SELECT COUNT(*) as total_sem_cargo
-- FROM usuarios
-- WHERE (cargo IS NULL OR cargo = '')
--   AND deleted_at IS NULL;

-- Para ver estatísticas de usuários por cargo (incluindo NULL):
-- SELECT 
--     COALESCE(cargo, 'SEM CARGO') as cargo,
--     COUNT(*) as total
-- FROM usuarios
-- WHERE deleted_at IS NULL
-- GROUP BY cargo
-- ORDER BY total DESC;
