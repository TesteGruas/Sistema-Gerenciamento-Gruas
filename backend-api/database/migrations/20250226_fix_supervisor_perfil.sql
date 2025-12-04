-- Script para verificar e corrigir perfil de supervisor
-- Email: samuellinkon+validacaosupervisor@gmail.com

-- 1. Verificar se o usuário existe
SELECT 
    id,
    email,
    nome,
    status,
    created_at
FROM usuarios
WHERE email = 'samuellinkon+validacaosupervisor@gmail.com';

-- 2. Verificar se o perfil "Supervisores" existe
SELECT 
    id,
    nome,
    nivel_acesso,
    descricao,
    status
FROM perfis
WHERE nome = 'Supervisores' OR nome = 'Supervisor';

-- 3. Verificar perfil atual do usuário
SELECT 
    up.id,
    up.usuario_id,
    up.perfil_id,
    up.status as status_atribuicao,
    p.nome as perfil_nome,
    p.nivel_acesso,
    u.email,
    u.nome as usuario_nome
FROM usuario_perfis up
INNER JOIN perfis p ON up.perfil_id = p.id
INNER JOIN usuarios u ON up.usuario_id = u.id
WHERE u.email = 'samuellinkon+validacaosupervisor@gmail.com';

-- 4. CORRIGIR: Desativar perfis antigos e atribuir perfil "Supervisores"
-- Primeiro, encontrar o ID do perfil "Supervisores"
DO $$
DECLARE
    v_usuario_id INTEGER;
    v_perfil_supervisores_id INTEGER;
    v_perfil_supervisor_id INTEGER;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO v_usuario_id
    FROM usuarios
    WHERE email = 'samuellinkon+validacaosupervisor@gmail.com';
    
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado: samuellinkon+validacaosupervisor@gmail.com';
    END IF;
    
    -- Buscar ID do perfil "Supervisores" (nome correto)
    SELECT id INTO v_perfil_supervisores_id
    FROM perfis
    WHERE nome = 'Supervisores' AND status = 'Ativo';
    
    -- Se não encontrar "Supervisores", buscar "Supervisor" (nome antigo)
    IF v_perfil_supervisores_id IS NULL THEN
        SELECT id INTO v_perfil_supervisor_id
        FROM perfis
        WHERE nome = 'Supervisor' AND status = 'Ativo';
        
        IF v_perfil_supervisor_id IS NOT NULL THEN
            -- Criar perfil "Supervisores" se não existir
            INSERT INTO perfis (nome, descricao, nivel_acesso, status)
            VALUES ('Supervisores', 'Supervisão operacional - Gruas, Obras, Clientes, Contratos, Funcionários, Documentos, Livro Grua, Estoque', 6, 'Ativo')
            ON CONFLICT DO NOTHING
            RETURNING id INTO v_perfil_supervisores_id;
            
            -- Se ainda não foi criado, buscar novamente
            IF v_perfil_supervisores_id IS NULL THEN
                SELECT id INTO v_perfil_supervisores_id
                FROM perfis
                WHERE nome = 'Supervisores' AND status = 'Ativo';
            END IF;
        END IF;
    END IF;
    
    IF v_perfil_supervisores_id IS NULL THEN
        RAISE EXCEPTION 'Perfil "Supervisores" não encontrado. Crie o perfil primeiro.';
    END IF;
    
    -- Desativar todos os perfis ativos do usuário
    UPDATE usuario_perfis
    SET status = 'Inativa',
        updated_at = NOW()
    WHERE usuario_id = v_usuario_id
      AND status = 'Ativa';
    
    -- Verificar se já existe atribuição para este perfil
    IF EXISTS (
        SELECT 1 FROM usuario_perfis
        WHERE usuario_id = v_usuario_id
          AND perfil_id = v_perfil_supervisores_id
    ) THEN
        -- Ativar a atribuição existente
        UPDATE usuario_perfis
        SET status = 'Ativa',
            data_atribuicao = NOW(),
            updated_at = NOW()
        WHERE usuario_id = v_usuario_id
          AND perfil_id = v_perfil_supervisores_id;
    ELSE
        -- Criar nova atribuição
        INSERT INTO usuario_perfis (
            usuario_id,
            perfil_id,
            data_atribuicao,
            status,
            created_at,
            updated_at
        )
        VALUES (
            v_usuario_id,
            v_perfil_supervisores_id,
            NOW(),
            'Ativa',
            NOW(),
            NOW()
        );
    END IF;
    
    RAISE NOTICE 'Perfil "Supervisores" atribuído com sucesso ao usuário %', v_usuario_id;
END $$;

-- 5. VERIFICAR RESULTADO FINAL
SELECT 
    up.id,
    up.usuario_id,
    up.perfil_id,
    up.status as status_atribuicao,
    up.data_atribuicao,
    p.nome as perfil_nome,
    p.nivel_acesso,
    u.email,
    u.nome as usuario_nome
FROM usuario_perfis up
INNER JOIN perfis p ON up.perfil_id = p.id
INNER JOIN usuarios u ON up.usuario_id = u.id
WHERE u.email = 'samuellinkon+validacaosupervisor@gmail.com'
  AND up.status = 'Ativa';

