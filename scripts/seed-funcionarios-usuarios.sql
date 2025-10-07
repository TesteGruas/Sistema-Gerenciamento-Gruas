-- Script de Seed para criar usuários para todos os funcionários existentes
-- Sistema de Gerenciamento de Gruas
-- Data: 2025-01-07

-- Função para gerar email único baseado no nome e ID do funcionário
-- Esta função será usada para funcionários que não têm email

-- Primeiro, vamos criar usuários para funcionários que já têm email
INSERT INTO usuarios (
  nome,
  email,
  cpf,
  telefone,
  cargo,
  turno,
  data_admissao,
  salario,
  status,
  funcionario_id,
  created_at,
  updated_at
)
SELECT 
  f.nome,
  f.email,
  f.cpf,
  f.telefone,
  f.cargo,
  f.turno,
  f.data_admissao,
  f.salario,
  f.status,
  f.id as funcionario_id,
  NOW() as created_at,
  NOW() as updated_at
FROM funcionarios f
LEFT JOIN usuarios u ON f.id = u.funcionario_id
WHERE f.email IS NOT NULL 
  AND f.email != ''
  AND u.id IS NULL  -- Apenas funcionários que ainda não têm usuário
  AND NOT EXISTS (
    SELECT 1 FROM usuarios u2 
    WHERE u2.email = f.email
  ); -- Evitar emails duplicados

-- Agora vamos criar usuários para funcionários sem email
-- Gerando emails únicos baseados no nome e ID
INSERT INTO usuarios (
  nome,
  email,
  cpf,
  telefone,
  cargo,
  turno,
  data_admissao,
  salario,
  status,
  funcionario_id,
  created_at,
  updated_at
)
SELECT 
  f.nome,
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(f.nome, '[^a-zA-Z0-9\s]', '', 'g'), -- Remove caracteres especiais
      '\s+', '.', 'g' -- Substitui espaços por pontos
    )
  ) || f.id || '@empresa.com' as email,
  f.cpf,
  f.telefone,
  f.cargo,
  f.turno,
  f.data_admissao,
  f.salario,
  f.status,
  f.id as funcionario_id,
  NOW() as created_at,
  NOW() as updated_at
FROM funcionarios f
LEFT JOIN usuarios u ON f.id = u.funcionario_id
WHERE (f.email IS NULL OR f.email = '')
  AND u.id IS NULL; -- Apenas funcionários que ainda não têm usuário

-- Agora vamos atribuir perfis aos usuários criados
-- Baseado no cargo do funcionário
INSERT INTO usuario_perfis (
  usuario_id,
  perfil_id,
  status,
  data_atribuicao,
  created_at,
  updated_at
)
SELECT 
  u.id as usuario_id,
  CASE 
    WHEN f.cargo = 'Supervisor' THEN 3  -- Perfil Supervisor
    WHEN f.cargo = 'Engenheiro' THEN 2  -- Perfil Gerente (para engenheiros)
    WHEN f.cargo = 'Chefe de Obras' THEN 2  -- Perfil Gerente (para chefes)
    ELSE 4  -- Perfil Operador (padrão para outros cargos)
  END as perfil_id,
  'Ativa' as status,
  NOW() as data_atribuicao,
  NOW() as created_at,
  NOW() as updated_at
FROM usuarios u
INNER JOIN funcionarios f ON u.funcionario_id = f.id
WHERE NOT EXISTS (
  SELECT 1 FROM usuario_perfis up 
  WHERE up.usuario_id = u.id
); -- Evitar duplicação de perfis

-- Verificar o resultado
SELECT 
  'Resumo da Execução' as tipo,
  COUNT(*) as total_funcionarios,
  COUNT(u.id) as funcionarios_com_usuario,
  COUNT(*) - COUNT(u.id) as funcionarios_sem_usuario
FROM funcionarios f
LEFT JOIN usuarios u ON f.id = u.funcionario_id

UNION ALL

SELECT 
  'Usuários Criados por Cargo' as tipo,
  f.cargo,
  COUNT(u.id) as total_usuarios,
  NULL as funcionarios_sem_usuario
FROM funcionarios f
INNER JOIN usuarios u ON f.id = u.funcionario_id
GROUP BY f.cargo
ORDER BY tipo, total_funcionarios DESC;
