-- ============================================
-- QUERIES DE DIAGNÓSTICO - Funcionário ID
-- ============================================

-- 1. Verificar se o funcionário 108 existe na tabela funcionarios
SELECT 
    id,
    nome,
    email,
    cpf,
    cargo,
    status,
    created_at
FROM funcionarios
WHERE id = 108;

-- 2. Verificar qual funcionário está vinculado ao usuário 119 (tabela usuarios)
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.funcionario_id,
    f.id as funcionario_id_tabela,
    f.nome as funcionario_nome,
    f.email as funcionario_email,
    f.cargo,
    f.status as funcionario_status
FROM usuarios u
LEFT JOIN funcionarios f ON u.funcionario_id = f.id
WHERE u.id = 119;

-- 3. Verificar todos os funcionários vinculados ao email do usuário
SELECT 
    f.id,
    f.nome,
    f.email,
    f.cpf,
    f.cargo,
    f.status,
    u.id as usuario_id,
    u.email as usuario_email,
    u.funcionario_id
FROM funcionarios f
LEFT JOIN usuarios u ON f.email = u.email OR u.funcionario_id = f.id
WHERE f.email = 'samuellinkon+operador@gmail.com'
   OR u.email = 'samuellinkon+operador@gmail.com';

-- 4. Verificar todos os funcionários que têm o email do usuário
SELECT 
    id,
    nome,
    email,
    cpf,
    cargo,
    status,
    created_at
FROM funcionarios
WHERE email = 'samuellinkon+operador@gmail.com'
   OR email LIKE '%samuellinkon%';

-- 5. Verificar o usuário 119 completo
SELECT 
    id,
    nome,
    email,
    cpf,
    telefone,
    cargo,
    funcionario_id,
    status,
    created_at,
    updated_at
FROM usuarios
WHERE id = 119;

-- 6. Verificar se existe algum funcionário com o mesmo nome do usuário
SELECT 
    f.id as funcionario_id,
    f.nome as funcionario_nome,
    f.email as funcionario_email,
    f.cpf as funcionario_cpf,
    f.cargo,
    f.status,
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.funcionario_id as usuario_funcionario_id
FROM funcionarios f
LEFT JOIN usuarios u ON u.funcionario_id = f.id
WHERE f.nome ILIKE '%SAMUEL LINKON%'
   OR u.nome ILIKE '%SAMUEL LINKON%';

-- 7. Verificar todos os funcionários ativos
SELECT 
    id,
    nome,
    email,
    cpf,
    cargo,
    status,
    created_at
FROM funcionarios
WHERE status = 'Ativo'
ORDER BY id DESC
LIMIT 20;

-- 8. Verificar a relação entre usuarios e funcionarios (todos os vínculos)
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.funcionario_id as usuario_funcionario_id,
    f.id as funcionario_id,
    f.nome as funcionario_nome,
    f.email as funcionario_email,
    f.cargo,
    CASE 
        WHEN u.funcionario_id = f.id THEN 'VINCULADO CORRETAMENTE'
        WHEN u.funcionario_id IS NULL THEN 'SEM VÍNCULO'
        WHEN f.id IS NULL THEN 'FUNCIONÁRIO NÃO EXISTE'
        ELSE 'VÍNCULO INCORRETO'
    END as status_vinculo
FROM usuarios u
LEFT JOIN funcionarios f ON u.funcionario_id = f.id
WHERE u.email = 'samuellinkon+operador@gmail.com';

-- 9. Criar funcionário se não existir (usar com cuidado!)
-- Descomente apenas se quiser criar o funcionário 108
/*
INSERT INTO funcionarios (
    id,
    nome,
    email,
    cargo,
    status,
    created_at,
    updated_at
)
VALUES (
    108,
    'SAMUEL LINKON GUEDES FIGUEIREDO',
    'samuellinkon+operador@gmail.com',
    'Sinaleiro',
    'Ativo',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
*/

-- 10. Buscar funcionário pelo email ou nome (para encontrar o ID correto)
SELECT 
    id,
    nome,
    email,
    cpf,
    cargo,
    status,
    created_at
FROM funcionarios
WHERE email = 'samuellinkon+operador@gmail.com'
   OR nome ILIKE '%SAMUEL LINKON%'
ORDER BY id DESC
LIMIT 5;

-- 11. Criar funcionário se não existir (baseado nos dados do usuário 119)
-- Execute esta query se não encontrar nenhum funcionário com a query 10
INSERT INTO funcionarios (
    nome,
    email,
    cargo,
    status,
    created_at,
    updated_at
)
SELECT 
    u.nome,
    u.email,
    COALESCE(u.cargo, 'Sinaleiro') as cargo,
    'Ativo' as status,
    NOW() as created_at,
    NOW() as updated_at
FROM usuarios u
WHERE u.id = 119
  AND NOT EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.email = u.email OR f.nome = u.nome
  )
RETURNING id, nome, email, cargo, status;

-- 12. Atualizar funcionario_id do usuário 119 para o funcionário encontrado/criado
-- Primeiro execute a query 10 ou 11 para encontrar/criar o funcionário
-- Depois, substitua [ID_DO_FUNCIONARIO] pelo ID retornado e execute:
/*
UPDATE usuarios
SET funcionario_id = [ID_DO_FUNCIONARIO]
WHERE id = 119;
*/

-- 13. Solução completa: Criar funcionário e vincular ao usuário em uma transação
-- Execute esta query para criar o funcionário e vincular automaticamente
DO $$
DECLARE
    v_funcionario_id INTEGER;
BEGIN
    -- Verificar se já existe funcionário com esse email
    SELECT id INTO v_funcionario_id
    FROM funcionarios
    WHERE email = 'samuellinkon+operador@gmail.com'
    LIMIT 1;
    
    -- Se não existe, criar
    IF v_funcionario_id IS NULL THEN
        INSERT INTO funcionarios (
            nome,
            email,
            cargo,
            status,
            created_at,
            updated_at
        )
        SELECT 
            nome,
            email,
            COALESCE(cargo, 'Sinaleiro'),
            'Ativo',
            NOW(),
            NOW()
        FROM usuarios
        WHERE id = 119
        RETURNING id INTO v_funcionario_id;
        
        RAISE NOTICE 'Funcionário criado com ID: %', v_funcionario_id;
    ELSE
        RAISE NOTICE 'Funcionário já existe com ID: %', v_funcionario_id;
    END IF;
    
    -- Vincular ao usuário
    UPDATE usuarios
    SET funcionario_id = v_funcionario_id
    WHERE id = 119;
    
    RAISE NOTICE 'Usuário 119 vinculado ao funcionário %', v_funcionario_id;
END $$;

-- 14. Verificar o resultado após executar a query 13
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.funcionario_id,
    f.id as funcionario_id,
    f.nome as funcionario_nome,
    f.email as funcionario_email,
    f.cargo,
    f.status
FROM usuarios u
LEFT JOIN funcionarios f ON u.funcionario_id = f.id
WHERE u.id = 119;

