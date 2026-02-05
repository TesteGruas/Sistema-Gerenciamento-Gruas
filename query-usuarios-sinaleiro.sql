-- Query para buscar usuários com cargo 'Sinaleiro'
-- CORRIGIDO: Use = (igual simples) em SQL, não ==

-- Opção 1: Buscar diretamente na tabela usuarios
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
WHERE u.cargo = 'Sinaleiro'  -- ✅ CORRETO: Use = em SQL
  AND u.deleted_at IS NULL   -- Apenas usuários não deletados (soft delete)
ORDER BY u.nome;

-- Opção 2: Buscar na tabela funcionarios e fazer JOIN com usuarios
-- (Útil se você quiser informações adicionais do funcionário)
SELECT 
    f.id as funcionario_id,
    f.nome,
    f.email,
    f.telefone,
    f.cpf,
    f.cargo,
    f.turno,
    f.status as funcionario_status,
    f.data_admissao,
    f.salario,
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.status as usuario_status,
    -- Informações do cargo (se usar cargo_id)
    c.nome as cargo_nome,
    c.nivel as cargo_nivel
FROM funcionarios f
LEFT JOIN usuarios u ON f.id = u.funcionario_id
LEFT JOIN cargos c ON f.cargo_id = c.id
WHERE f.cargo = 'Sinaleiro'  -- ✅ CORRETO: Use = em SQL
  AND f.deleted_at IS NULL   -- Apenas funcionários não deletados
ORDER BY f.nome;

-- Para contar quantos sinaleiros existem:
-- SELECT COUNT(*) as total_sinaleiros
-- FROM usuarios
-- WHERE cargo = 'Sinaleiro'
--   AND deleted_at IS NULL;

-- Para buscar outros cargos, substitua 'Sinaleiro' por:
-- 'Operador', 'Técnico Manutenção', 'Supervisor', 'Mecânico', 'Engenheiro', 'Chefe de Obras', etc.
