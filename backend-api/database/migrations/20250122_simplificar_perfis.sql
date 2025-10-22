-- =========================================================
-- Migration: Simplificar Sistema de Perfis
-- Data: 2025-01-22
-- Objetivo: Atualizar perfis para os 5 roles principais
-- =========================================================

-- Iniciar transação
BEGIN;

-- 1. Backup dos dados atuais (criar tabelas de backup)
CREATE TABLE IF NOT EXISTS perfis_backup AS SELECT * FROM perfis;
CREATE TABLE IF NOT EXISTS usuario_perfis_backup AS SELECT * FROM usuario_perfis;
CREATE TABLE IF NOT EXISTS perfil_permissoes_backup AS SELECT * FROM perfil_permissoes;

-- 2. Atualizar nomes dos perfis existentes
UPDATE perfis SET 
  nome = 'Admin',
  nivel_acesso = 10,
  descricao = 'Acesso completo ao sistema',
  updated_at = NOW()
WHERE nome = 'Administrador';

UPDATE perfis SET 
  nome = 'Gestores',
  nivel_acesso = 9,
  descricao = 'Acesso gerencial completo',
  updated_at = NOW()
WHERE nome = 'Gerente';

UPDATE perfis SET 
  nome = 'Supervisores',
  nivel_acesso = 6,
  descricao = 'Supervisão operacional - Gruas, Obras, Ponto, Documentos, Livro Grua, Estoque',
  updated_at = NOW()
WHERE nome = 'Supervisor';

UPDATE perfis SET 
  nome = 'Operários',
  nivel_acesso = 4,
  descricao = 'Operação diária via APP - Ponto e Documentos',
  updated_at = NOW()
WHERE nome = 'Operador';

UPDATE perfis SET 
  nome = 'Clientes',
  nivel_acesso = 1,
  descricao = 'Acesso limitado - Visualização e assinatura de documentos',
  updated_at = NOW()
WHERE nome = 'Cliente';

-- 3. Migrar usuários com perfil "Visualizador" para "Operários"
-- Primeiro, obter o ID do perfil "Visualizador"
DO $$
DECLARE
  visualizador_id INTEGER;
  operarios_id INTEGER;
BEGIN
  SELECT id INTO visualizador_id FROM perfis WHERE nome = 'Visualizador' LIMIT 1;
  SELECT id INTO operarios_id FROM perfis WHERE nome = 'Operários' LIMIT 1;
  
  IF visualizador_id IS NOT NULL AND operarios_id IS NOT NULL THEN
    -- Atualizar associações de usuários
    UPDATE usuario_perfis 
    SET perfil_id = operarios_id,
        updated_at = NOW()
    WHERE perfil_id = visualizador_id;
    
    -- Marcar perfil "Visualizador" como inativo
    UPDATE perfis 
    SET status = 'Inativo',
        updated_at = NOW()
    WHERE id = visualizador_id;
  END IF;
END $$;

-- 4. Adicionar comentários nas tabelas
COMMENT ON TABLE perfis IS 'Sistema simplificado com 5 roles principais: Admin, Gestores, Supervisores, Operários, Clientes';
COMMENT ON TABLE perfil_permissoes IS 'ARQUIVADA - Permissões agora são hardcoded no código. Tabela mantida apenas para rollback';

-- 5. Criar índices para melhor performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_usuario_perfis_perfil_id ON usuario_perfis(perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuario_perfis_usuario_id ON usuario_perfis(usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfis_nome ON perfis(nome);
CREATE INDEX IF NOT EXISTS idx_perfis_nivel_acesso ON perfis(nivel_acesso);

-- 6. Registrar a migração
INSERT INTO configuracoes_sistema (chave, valor, tipo, descricao, categoria, editavel, criado_em, updated_at)
VALUES (
  'sistema_permissoes_versao',
  '2.0',
  'string',
  'Versão do sistema de permissões (2.0 = simplificado com 5 roles)',
  'sistema',
  false,
  NOW(),
  NOW()
) ON CONFLICT (chave) DO UPDATE 
  SET valor = '2.0', updated_at = NOW();

-- Commit da transação
COMMIT;

-- =========================================================
-- Validações pós-migração
-- =========================================================

-- Verificar se todos os perfis foram atualizados corretamente
DO $$
DECLARE
  perfis_count INTEGER;
  perfis_ativos_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO perfis_count FROM perfis WHERE nome IN ('Admin', 'Gestores', 'Supervisores', 'Operários', 'Clientes');
  SELECT COUNT(*) INTO perfis_ativos_count FROM perfis WHERE nome IN ('Admin', 'Gestores', 'Supervisores', 'Operários', 'Clientes') AND status = 'Ativo';
  
  IF perfis_count < 5 THEN
    RAISE EXCEPTION 'ERRO: Migração incompleta. Apenas % perfis encontrados (esperado: 5)', perfis_count;
  END IF;
  
  IF perfis_ativos_count < 5 THEN
    RAISE WARNING 'ATENÇÃO: Apenas % perfis ativos (esperado: 5)', perfis_ativos_count;
  END IF;
  
  RAISE NOTICE 'Migração concluída com sucesso. % perfis principais criados/atualizados', perfis_count;
END $$;

-- Exibir resumo da migração
SELECT 
  nome,
  nivel_acesso,
  descricao,
  status,
  (SELECT COUNT(*) FROM usuario_perfis WHERE perfil_id = perfis.id AND status = 'Ativa') as usuarios_ativos
FROM perfis 
WHERE nome IN ('Admin', 'Gestores', 'Supervisores', 'Operários', 'Clientes')
ORDER BY nivel_acesso DESC;


