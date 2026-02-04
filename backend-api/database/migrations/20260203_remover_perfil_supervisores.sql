-- =========================================================
-- Migration: Remover Perfil Supervisores
-- Data: 2026-02-03
-- Objetivo: Remover o perfil "Supervisores" e migrar usuários para "Clientes"
-- =========================================================

-- Iniciar transação
BEGIN;

-- 1. Obter IDs dos perfis
DO $$
DECLARE
  supervisores_perfil_id INTEGER;
  clientes_perfil_id INTEGER;
  usuarios_afetados INTEGER;
BEGIN
  -- Obter ID do perfil Supervisores
  SELECT id INTO supervisores_perfil_id FROM perfis WHERE nome = 'Supervisores' LIMIT 1;
  
  -- Obter ID do perfil Clientes
  SELECT id INTO clientes_perfil_id FROM perfis WHERE nome = 'Clientes' LIMIT 1;
  
  -- Verificar se os perfis existem
  IF supervisores_perfil_id IS NULL THEN
    RAISE NOTICE 'Perfil "Supervisores" não encontrado. Nada a fazer.';
    RETURN;
  END IF;
  
  IF clientes_perfil_id IS NULL THEN
    RAISE EXCEPTION 'Perfil "Clientes" não encontrado. Não é possível migrar usuários.';
  END IF;
  
  -- Contar usuários que serão migrados
  SELECT COUNT(*) INTO usuarios_afetados
  FROM usuario_perfis
  WHERE perfil_id = supervisores_perfil_id
    AND status = 'Ativa';
  
  RAISE NOTICE 'Migrando % usuários do perfil "Supervisores" para "Clientes"', usuarios_afetados;
  
  -- 2. Migrar usuários do perfil Supervisores para Clientes
  -- Atualizar registros existentes
  UPDATE usuario_perfis
  SET perfil_id = clientes_perfil_id,
      updated_at = NOW()
  WHERE perfil_id = supervisores_perfil_id
    AND status = 'Ativa';
  
  RAISE NOTICE 'Usuários migrados com sucesso';
  
  -- 3. Desativar o perfil Supervisores (não deletar para manter histórico)
  UPDATE perfis
  SET status = 'Inativo',
      descricao = 'Perfil removido - Migrado para Clientes',
      updated_at = NOW()
  WHERE id = supervisores_perfil_id;
  
  RAISE NOTICE 'Perfil "Supervisores" desativado';
  
END $$;

-- 4. Atualizar campo is_supervisor em funcionarios_obras para false
-- (mantendo o campo para compatibilidade, mas removendo a funcionalidade)
DO $$
DECLARE
  registros_atualizados INTEGER;
BEGIN
  UPDATE funcionarios_obras
  SET is_supervisor = false,
      updated_at = NOW()
  WHERE is_supervisor = true;
  
  GET DIAGNOSTICS registros_atualizados = ROW_COUNT;
  RAISE NOTICE 'Campo is_supervisor atualizado em % registros de funcionarios_obras', registros_atualizados;
END $$;

-- 5. Atualizar cargo de funcionários que têm cargo 'Supervisor'
-- Migrar para um cargo padrão ou manter como está (dependendo da regra de negócio)
-- Por enquanto, apenas registramos a mudança sem alterar o cargo
-- (os funcionários podem ter outros cargos além de Supervisor)

-- 6. Remover permissões do perfil Supervisores (se houver tabela de permissões)
-- Nota: O sistema atual usa permissões hardcoded, então não há necessidade de remover da tabela

-- Finalizar transação
COMMIT;

-- =========================================================
-- Resumo da Migration
-- =========================================================
-- ✅ Usuários com perfil "Supervisores" migrados para "Clientes"
-- ✅ Perfil "Supervisores" desativado (mantido para histórico)
-- ✅ Campo is_supervisor em funcionarios_obras atualizado para false
-- ✅ Sistema agora utiliza apenas 4 roles: Admin, Gestores, Operários, Clientes
-- =========================================================
