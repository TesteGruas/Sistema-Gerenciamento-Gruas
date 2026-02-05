-- Query para ver todos os funcionários do sistema
-- Execute esta query no Supabase SQL Editor ou no seu cliente PostgreSQL

SELECT 
    f.id,
    f.nome,
    f.email,
    f.telefone,
    f.cpf,
    f.cargo,
    f.turno,
    f.status,
    f.data_admissao,
    f.salario,
    f.created_at,
    f.updated_at,
    -- Informações do cargo
    c.nome as cargo_nome,
    c.nivel as cargo_nivel,
    -- Informações do usuário vinculado
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.status as usuario_status
FROM funcionarios f
LEFT JOIN cargos c ON f.cargo_id = c.id
LEFT JOIN usuarios u ON f.id = u.funcionario_id
WHERE f.deleted_at IS NULL  -- Apenas funcionários não deletados (soft delete)
ORDER BY f.created_at DESC;

-- Para contar o total de funcionários:
-- SELECT COUNT(*) as total_funcionarios 
-- FROM funcionarios 
-- WHERE deleted_at IS NULL;

-- Para ver apenas funcionários ativos:
-- SELECT * FROM funcionarios 
-- WHERE deleted_at IS NULL AND status = 'Ativo'
-- ORDER BY nome;

-- Para buscar usuários com cargo específico (ex: Sinaleiro):
-- CORRIGIDO: Use = em vez de ==
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
WHERE u.cargo = 'Sinaleiro'  -- Use = (igual simples) em SQL, não ==
  AND u.deleted_at IS NULL   -- Apenas usuários não deletados
ORDER BY u.nome;

-- Alternativa: Buscar na tabela funcionarios e fazer JOIN com usuarios
-- SELECT 
--     f.id as funcionario_id,
--     f.nome,
--     f.email,
--     f.telefone,
--     f.cpf,
--     f.cargo,
--     f.turno,
--     f.status,
--     u.id as usuario_id,
--     u.nome as usuario_nome,
--     u.email as usuario_email
-- FROM funcionarios f
-- LEFT JOIN usuarios u ON f.id = u.funcionario_id
-- WHERE f.cargo = 'Sinaleiro'
--   AND f.deleted_at IS NULL
-- ORDER BY f.nome;

-- Para buscar usuários SEM cargo (NULL ou vazio):
-- Veja o arquivo: query-usuarios-sem-cargo.sql
-- Ou use esta query rápida:
-- SELECT * FROM usuarios 
-- WHERE (cargo IS NULL OR cargo = '')
--   AND deleted_at IS NULL
-- ORDER BY nome;
