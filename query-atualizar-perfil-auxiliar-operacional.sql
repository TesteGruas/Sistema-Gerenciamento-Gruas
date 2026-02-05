-- =========================================================
-- Query: Atualizar perfil_id do cargo "Auxiliar Operacional"
-- Data: 2026-02-05
-- Objetivo: Definir perfil_id = 4 (Operador) para o cargo "Auxiliar Operacional"
-- =========================================================

-- Verificar o perfil_id atual do cargo "Auxiliar Operacional"
SELECT 
    c.id,
    c.nome,
    c.perfil_id,
    c.nivel
FROM cargos c
WHERE c.nome = 'Auxiliar Operacional';

-- Atualizar o perfil_id do cargo "Auxiliar Operacional" para 4 (Operador)
UPDATE cargos
SET 
    perfil_id = 4,
    updated_at = NOW()
WHERE nome = 'Auxiliar Operacional'
  AND (perfil_id IS NULL OR perfil_id != 4);

-- Verificar se a atualização foi bem-sucedida
SELECT 
    c.id,
    c.nome,
    c.perfil_id,
    c.nivel,
    p.nome as perfil_nome,
    p.nivel_acesso
FROM cargos c
LEFT JOIN perfis p ON c.perfil_id = p.id
WHERE c.nome = 'Auxiliar Operacional';

-- Verificar funcionários que têm este cargo e seus perfis atuais
SELECT 
    f.id as funcionario_id,
    f.nome as funcionario_nome,
    f.cargo_id,
    c.nome as cargo_nome,
    c.perfil_id as cargo_perfil_id,
    u.id as usuario_id,
    u.email,
    up.perfil_id as usuario_perfil_id,
    p.nome as perfil_nome,
    p.nivel_acesso
FROM funcionarios f
LEFT JOIN cargos c ON f.cargo_id = c.id
LEFT JOIN usuarios u ON u.funcionario_id = f.id
LEFT JOIN usuario_perfis up ON up.usuario_id = u.id AND up.status = 'Ativa'
LEFT JOIN perfis p ON up.perfil_id = p.id
WHERE c.nome = 'Auxiliar Operacional'
ORDER BY f.id;

-- =========================================================
-- IMPORTANTE: Após atualizar o perfil_id do cargo,
-- os funcionários existentes com este cargo NÃO terão
-- seus perfis atualizados automaticamente.
-- 
-- Para atualizar os perfis dos funcionários existentes,
-- execute a query abaixo:
-- =========================================================

-- Atualizar perfis dos usuários vinculados a funcionários com cargo "Auxiliar Operacional"
-- que não têm o perfil correto (perfil_id = 4)
DO $$
DECLARE
    v_funcionario_record RECORD;
    v_usuario_id INTEGER;
    v_perfil_operador_id INTEGER := 4;
BEGIN
    -- Obter ID do perfil Operador
    SELECT id INTO v_perfil_operador_id
    FROM perfis
    WHERE id = 4 OR nome = 'Operador' OR nome = 'Operários'
    LIMIT 1;
    
    -- Para cada funcionário com cargo "Auxiliar Operacional"
    FOR v_funcionario_record IN 
        SELECT f.id as funcionario_id, u.id as usuario_id
        FROM funcionarios f
        INNER JOIN cargos c ON f.cargo_id = c.id
        LEFT JOIN usuarios u ON u.funcionario_id = f.id
        WHERE c.nome = 'Auxiliar Operacional'
          AND u.id IS NOT NULL
    LOOP
        v_usuario_id := v_funcionario_record.usuario_id;
        
        -- Desativar perfil atual do usuário
        UPDATE usuario_perfis
        SET 
            status = 'Inativa',
            updated_at = NOW()
        WHERE usuario_id = v_usuario_id
          AND status = 'Ativa';
        
        -- Verificar se já existe associação com perfil Operador
        IF NOT EXISTS (
            SELECT 1 FROM usuario_perfis
            WHERE usuario_id = v_usuario_id
              AND perfil_id = v_perfil_operador_id
        ) THEN
            -- Criar nova associação com perfil Operador
            INSERT INTO usuario_perfis (
                usuario_id,
                perfil_id,
                status,
                data_atribuicao,
                created_at,
                updated_at
            ) VALUES (
                v_usuario_id,
                v_perfil_operador_id,
                'Ativa',
                NOW(),
                NOW(),
                NOW()
            );
        ELSE
            -- Ativar associação existente
            UPDATE usuario_perfis
            SET 
                status = 'Ativa',
                data_atribuicao = NOW(),
                updated_at = NOW()
            WHERE usuario_id = v_usuario_id
              AND perfil_id = v_perfil_operador_id;
        END IF;
        
        RAISE NOTICE 'Perfil atualizado para usuário % (funcionário %)', v_usuario_id, v_funcionario_record.funcionario_id;
    END LOOP;
END $$;

-- Verificar resultado final
SELECT 
    f.id as funcionario_id,
    f.nome as funcionario_nome,
    c.nome as cargo_nome,
    c.perfil_id as cargo_perfil_id,
    u.id as usuario_id,
    u.email,
    p.nome as perfil_nome,
    p.nivel_acesso
FROM funcionarios f
LEFT JOIN cargos c ON f.cargo_id = c.id
LEFT JOIN usuarios u ON u.funcionario_id = f.id
LEFT JOIN usuario_perfis up ON up.usuario_id = u.id AND up.status = 'Ativa'
LEFT JOIN perfis p ON up.perfil_id = p.id
WHERE c.nome = 'Auxiliar Operacional'
ORDER BY f.id;
