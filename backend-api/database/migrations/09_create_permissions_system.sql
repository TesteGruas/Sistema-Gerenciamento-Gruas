-- =====================================================
-- SISTEMA DE PERMISSÕES COMPLETO
-- Migração: 09_create_permissions_system.sql
-- Data: 2025-01-20
-- Descrição: Criação do sistema completo de permissões
-- =====================================================

-- 1. CRIAR TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS perfis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  nivel_acesso INTEGER NOT NULL CHECK (nivel_acesso BETWEEN 1 AND 10),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CRIAR TABELA DE PERMISSÕES
CREATE TABLE IF NOT EXISTS permissoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(50) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  recurso VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(modulo, acao, recurso)
);

-- 3. CRIAR TABELA DE RELACIONAMENTO PERFIL-PERMISSÕES
CREATE TABLE IF NOT EXISTS perfil_permissoes (
  id SERIAL PRIMARY KEY,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  permissao_id INTEGER NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP DEFAULT NOW(),
  atribuido_por INTEGER,
  status VARCHAR(20) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(perfil_id, permissao_id)
);

-- 4. CRIAR TABELA DE RELACIONAMENTO USUÁRIO-PERFIL
CREATE TABLE IF NOT EXISTS usuario_perfis (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  data_atribuicao TIMESTAMP DEFAULT NOW(),
  atribuido_por INTEGER,
  status VARCHAR(20) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, perfil_id)
);

-- 5. INSERIR PERFIS PADRÃO
INSERT INTO perfis (nome, descricao, nivel_acesso, status) VALUES
('Admin', 'Administrador do sistema com acesso total', 10, 'Ativo'),
('Gerente', 'Gerente com acesso gerencial e operacional', 8, 'Ativo'),
('Supervisor', 'Supervisor com acesso operacional', 6, 'Ativo'),
('Engenheiro', 'Engenheiro com acesso técnico', 5, 'Ativo'),
('Mestre de Obra', 'Mestre de obra com acesso de campo', 4, 'Ativo'),
('Operador', 'Operador com acesso básico', 3, 'Ativo'),
('Cliente', 'Cliente com acesso limitado', 2, 'Ativo');

-- 6. INSERIR PERMISSÕES POR MÓDULO

-- DASHBOARD
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Dashboard', 'Visualizar página principal do dashboard', 'dashboard', 'visualizar', 'dashboard', 'Ativa'),
('Personalizar Dashboard', 'Personalizar widgets e layout do dashboard', 'dashboard', 'personalizar', 'dashboard', 'Ativa'),
('Exportar Dashboard', 'Exportar dados do dashboard', 'dashboard', 'exportar', 'dashboard', 'Ativa');

-- USUÁRIOS
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Usuários', 'Visualizar lista de usuários', 'usuarios', 'visualizar', 'usuarios', 'Ativa'),
('Criar Usuários', 'Criar novos usuários', 'usuarios', 'criar', 'usuarios', 'Ativa'),
('Editar Usuários', 'Editar dados de usuários', 'usuarios', 'editar', 'usuarios', 'Ativa'),
('Excluir Usuários', 'Excluir usuários do sistema', 'usuarios', 'excluir', 'usuarios', 'Ativa'),
('Gerenciar Permissões', 'Gerenciar permissões de usuários', 'usuarios', 'gerenciar_permissoes', 'usuarios', 'Ativa');

-- CLIENTES
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Clientes', 'Visualizar lista de clientes', 'clientes', 'visualizar', 'clientes', 'Ativa'),
('Criar Clientes', 'Criar novos clientes', 'clientes', 'criar', 'clientes', 'Ativa'),
('Editar Clientes', 'Editar dados de clientes', 'clientes', 'editar', 'clientes', 'Ativa'),
('Excluir Clientes', 'Excluir clientes', 'clientes', 'excluir', 'clientes', 'Ativa');

-- OBRAS
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Obras', 'Visualizar lista de obras', 'obras', 'visualizar', 'obras', 'Ativa'),
('Criar Obras', 'Criar novas obras', 'obras', 'criar', 'obras', 'Ativa'),
('Editar Obras', 'Editar dados de obras', 'obras', 'editar', 'obras', 'Ativa'),
('Excluir Obras', 'Excluir obras', 'obras', 'excluir', 'obras', 'Ativa'),
('Aprovar Obras', 'Aprovar obras', 'obras', 'aprovar', 'obras', 'Ativa');

-- GRUAS
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Gruas', 'Visualizar lista de gruas', 'gruas', 'visualizar', 'gruas', 'Ativa'),
('Criar Gruas', 'Criar novas gruas', 'gruas', 'criar', 'gruas', 'Ativa'),
('Editar Gruas', 'Editar dados de gruas', 'gruas', 'editar', 'gruas', 'Ativa'),
('Excluir Gruas', 'Excluir gruas', 'gruas', 'excluir', 'gruas', 'Ativa'),
('Operar Gruas', 'Operar gruas', 'gruas', 'operar', 'gruas', 'Ativa');

-- LIVROS DE GRUAS
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Livros', 'Visualizar livros de gruas', 'livros_gruas', 'visualizar', 'livros_gruas', 'Ativa'),
('Criar Livros', 'Criar novos livros de gruas', 'livros_gruas', 'criar', 'livros_gruas', 'Ativa'),
('Editar Livros', 'Editar livros de gruas', 'livros_gruas', 'editar', 'livros_gruas', 'Ativa'),
('Excluir Livros', 'Excluir livros de gruas', 'livros_gruas', 'excluir', 'livros_gruas', 'Ativa');

-- ESTOQUE
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Estoque', 'Visualizar estoque', 'estoque', 'visualizar', 'estoque', 'Ativa'),
('Criar Estoque', 'Criar itens de estoque', 'estoque', 'criar', 'estoque', 'Ativa'),
('Editar Estoque', 'Editar itens de estoque', 'estoque', 'editar', 'estoque', 'Ativa'),
('Excluir Estoque', 'Excluir itens de estoque', 'estoque', 'excluir', 'estoque', 'Ativa');

-- PONTO ELETRÔNICO
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Ponto', 'Visualizar registros de ponto', 'ponto_eletronico', 'visualizar', 'ponto_eletronico', 'Ativa'),
('Registrar Ponto', 'Registrar ponto eletrônico', 'ponto_eletronico', 'registrar', 'ponto_eletronico', 'Ativa'),
('Aprovar Ponto', 'Aprovar horas extras', 'ponto_eletronico', 'aprovar', 'ponto_eletronico', 'Ativa'),
('Relatórios Ponto', 'Acessar relatórios de ponto', 'ponto_eletronico', 'relatorios', 'ponto_eletronico', 'Ativa');

-- RH
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar RH', 'Visualizar dados de RH', 'rh', 'visualizar', 'rh', 'Ativa'),
('Criar RH', 'Criar registros de RH', 'rh', 'criar', 'rh', 'Ativa'),
('Editar RH', 'Editar dados de RH', 'rh', 'editar', 'rh', 'Ativa'),
('Excluir RH', 'Excluir registros de RH', 'rh', 'excluir', 'rh', 'Ativa');

-- FINANCEIRO
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Financeiro', 'Visualizar dados financeiros', 'financeiro', 'visualizar', 'financeiro', 'Ativa'),
('Criar Financeiro', 'Criar registros financeiros', 'financeiro', 'criar', 'financeiro', 'Ativa'),
('Editar Financeiro', 'Editar dados financeiros', 'financeiro', 'editar', 'financeiro', 'Ativa'),
('Aprovar Financeiro', 'Aprovar transações financeiras', 'financeiro', 'aprovar', 'financeiro', 'Ativa'),
('Relatórios Financeiro', 'Acessar relatórios financeiros', 'financeiro', 'relatorios', 'financeiro', 'Ativa');

-- RELATÓRIOS
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Relatórios', 'Visualizar relatórios', 'relatorios', 'visualizar', 'relatorios', 'Ativa'),
('Criar Relatórios', 'Criar relatórios', 'relatorios', 'criar', 'relatorios', 'Ativa'),
('Exportar Relatórios', 'Exportar relatórios', 'relatorios', 'exportar', 'relatorios', 'Ativa');

-- HISTÓRICO
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Histórico', 'Visualizar histórico', 'historico', 'visualizar', 'historico', 'Ativa'),
('Exportar Histórico', 'Exportar histórico', 'historico', 'exportar', 'historico', 'Ativa');

-- ASSINATURA DIGITAL
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Assinaturas', 'Visualizar assinaturas digitais', 'assinatura_digital', 'visualizar', 'assinatura_digital', 'Ativa'),
('Assinar Documentos', 'Assinar documentos digitalmente', 'assinatura_digital', 'assinar', 'assinatura_digital', 'Ativa'),
('Gerenciar Assinaturas', 'Gerenciar assinaturas digitais', 'assinatura_digital', 'gerenciar', 'assinatura_digital', 'Ativa');

-- NOTIFICAÇÕES
INSERT INTO permissoes (nome, descricao, modulo, acao, recurso, status) VALUES
('Visualizar Notificações', 'Visualizar notificações', 'notificacoes', 'visualizar', 'notificacoes', 'Ativa'),
('Criar Notificações', 'Criar notificações', 'notificacoes', 'criar', 'notificacoes', 'Ativa'),
('Gerenciar Notificações', 'Gerenciar notificações', 'notificacoes', 'gerenciar', 'notificacoes', 'Ativa');

-- 7. ATRIBUIR PERMISSÕES AOS PERFIS

-- ADMIN - Todas as permissões
INSERT INTO perfil_permissoes (perfil_id, permissao_id, status)
SELECT p.id, perm.id, 'Ativa'
FROM perfis p
CROSS JOIN permissoes perm
WHERE p.nome = 'Admin';

-- GERENTE - Permissões gerenciais
INSERT INTO perfil_permissoes (perfil_id, permissao_id, status)
SELECT p.id, perm.id, 'Ativa'
FROM perfis p
CROSS JOIN permissoes perm
WHERE p.nome = 'Gerente'
AND perm.modulo IN ('dashboard', 'clientes', 'obras', 'gruas', 'livros_gruas', 'estoque', 'ponto_eletronico', 'rh', 'financeiro', 'relatorios', 'historico', 'assinatura_digital', 'notificacoes')
AND perm.acao IN ('visualizar', 'criar', 'editar', 'aprovar', 'relatorios', 'exportar', 'assinar');

-- SUPERVISOR - Permissões operacionais
INSERT INTO perfil_permissoes (perfil_id, permissao_id, status)
SELECT p.id, perm.id, 'Ativa'
FROM perfis p
CROSS JOIN permissoes perm
WHERE p.nome = 'Supervisor'
AND perm.modulo IN ('dashboard', 'obras', 'gruas', 'livros_gruas', 'estoque', 'ponto_eletronico', 'rh', 'relatorios', 'historico', 'assinatura_digital', 'notificacoes')
AND perm.acao IN ('visualizar', 'editar', 'aprovar', 'relatorios', 'assinar');

-- ENGENHEIRO - Permissões técnicas
INSERT INTO perfil_permissoes (perfil_id, permissao_id, status)
SELECT p.id, perm.id, 'Ativa'
FROM perfis p
CROSS JOIN permissoes perm
WHERE p.nome = 'Engenheiro'
AND perm.modulo IN ('dashboard', 'obras', 'gruas', 'livros_gruas', 'estoque', 'ponto_eletronico', 'relatorios', 'historico', 'assinatura_digital', 'notificacoes')
AND perm.acao IN ('visualizar', 'editar', 'assinar');

-- MESTRE DE OBRA - Permissões de campo
INSERT INTO perfil_permissoes (perfil_id, permissao_id, status)
SELECT p.id, perm.id, 'Ativa'
FROM perfis p
CROSS JOIN permissoes perm
WHERE p.nome = 'Mestre de Obra'
AND perm.modulo IN ('dashboard', 'obras', 'gruas', 'livros_gruas', 'estoque', 'ponto_eletronico', 'rh', 'relatorios', 'historico', 'assinatura_digital', 'notificacoes')
AND perm.acao IN ('visualizar', 'editar', 'aprovar', 'relatorios', 'assinar');

-- OPERADOR - Permissões básicas
INSERT INTO perfil_permissoes (perfil_id, permissao_id, status)
SELECT p.id, perm.id, 'Ativa'
FROM perfis p
CROSS JOIN permissoes perm
WHERE p.nome = 'Operador'
AND perm.modulo IN ('dashboard', 'obras', 'gruas', 'livros_gruas', 'estoque', 'ponto_eletronico', 'assinatura_digital', 'notificacoes')
AND perm.acao IN ('visualizar', 'registrar', 'operar', 'assinar');

-- CLIENTE - Permissões limitadas
INSERT INTO perfil_permissoes (perfil_id, permissao_id, status)
SELECT p.id, perm.id, 'Ativa'
FROM perfis p
CROSS JOIN permissoes perm
WHERE p.nome = 'Cliente'
AND perm.modulo IN ('dashboard', 'obras', 'gruas', 'relatorios', 'assinatura_digital', 'notificacoes')
AND perm.acao IN ('visualizar', 'assinar');

-- 8. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_perfil_id ON perfil_permissoes(perfil_id);
CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_permissao_id ON perfil_permissoes(permissao_id);
CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_status ON perfil_permissoes(status);
CREATE INDEX IF NOT EXISTS idx_usuario_perfis_usuario_id ON usuario_perfis(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_perfis_perfil_id ON usuario_perfis(perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuario_perfis_status ON usuario_perfis(status);
CREATE INDEX IF NOT EXISTS idx_permissoes_modulo_acao ON permissoes(modulo, acao);

-- 9. CRIAR TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_perfis_updated_at BEFORE UPDATE ON perfis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissoes_updated_at BEFORE UPDATE ON permissoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perfil_permissoes_updated_at BEFORE UPDATE ON perfil_permissoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuario_perfis_updated_at BEFORE UPDATE ON usuario_perfis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. COMENTÁRIOS NAS TABELAS
COMMENT ON TABLE perfis IS 'Perfis de usuário com diferentes níveis de acesso';
COMMENT ON TABLE permissoes IS 'Permissões específicas por módulo e ação';
COMMENT ON TABLE perfil_permissoes IS 'Relacionamento entre perfis e permissões';
COMMENT ON TABLE usuario_perfis IS 'Relacionamento entre usuários e perfis';

-- 11. VERIFICAÇÃO FINAL
DO $$
BEGIN
    RAISE NOTICE 'Sistema de permissões criado com sucesso!';
    RAISE NOTICE 'Perfis criados: %', (SELECT COUNT(*) FROM perfis);
    RAISE NOTICE 'Permissões criadas: %', (SELECT COUNT(*) FROM permissoes);
    RAISE NOTICE 'Atribuições de permissões: %', (SELECT COUNT(*) FROM perfil_permissoes);
END $$;
