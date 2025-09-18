-- Script para criar tabelas para funcionalidades avançadas
-- Sistema de Gerenciamento de Gruas

-- =====================================================
-- TABELA DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('manutencao', 'vencimento_contrato', 'transferencia', 'alerta_geral')),
    titulo VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    prioridade VARCHAR(20) NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
    destinatarios JSONB,
    agendamento TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviada', 'falhou', 'cancelada')),
    enviada_em TIMESTAMP WITH TIME ZONE,
    criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_prioridade ON notificacoes(prioridade);
CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON notificacoes(status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_agendamento ON notificacoes(agendamento);

-- =====================================================
-- TABELA DE LOGS DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS logs_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    entidade_id VARCHAR(50) NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario_id ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_acao ON logs_auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_entidade ON logs_auditoria(entidade);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_entidade_id ON logs_auditoria(entidade_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_timestamp ON logs_auditoria(timestamp);

-- =====================================================
-- TABELA DE WEBHOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    eventos JSONB NOT NULL,
    ativo BOOLEAN DEFAULT true,
    secret VARCHAR(100) NOT NULL,
    ultima_execucao TIMESTAMP WITH TIME ZONE,
    total_execucoes INTEGER DEFAULT 0,
    total_falhas INTEGER DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_ativo ON webhooks(ativo);
CREATE INDEX IF NOT EXISTS idx_webhooks_ultima_execucao ON webhooks(ultima_execucao);

-- =====================================================
-- TABELA DE BACKUPS
-- =====================================================

CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('completo', 'incremental', 'especifico')),
    tamanho_bytes BIGINT,
    localizacao TEXT,
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'falhou', 'expirado')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    concluido_em TIMESTAMP WITH TIME ZONE,
    expira_em TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Índices para backups
CREATE INDEX IF NOT EXISTS idx_backups_tipo ON backups(tipo);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_criado_em ON backups(criado_em);

-- =====================================================
-- TABELA DE CONFIGURAÇÕES DO SISTEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    descricao TEXT,
    categoria VARCHAR(50) DEFAULT 'geral',
    editavel BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO configuracoes_sistema (chave, valor, tipo, descricao, categoria) VALUES
('notificacoes_manutencao_antecedencia', '7', 'number', 'Dias de antecedência para notificações de manutenção', 'notificacoes'),
('notificacoes_contrato_antecedencia', '15', 'number', 'Dias de antecedência para notificações de vencimento de contrato', 'notificacoes'),
('backup_retencao_dias', '30', 'number', 'Dias para manter backups', 'backup'),
('auditoria_retencao_dias', '365', 'number', 'Dias para manter logs de auditoria', 'auditoria'),
('taxa_utilizacao_alerta', '50', 'number', 'Taxa de utilização mínima para alertas', 'alertas'),
('webhook_timeout_segundos', '30', 'number', 'Timeout para webhooks em segundos', 'webhooks')
ON CONFLICT (chave) DO NOTHING;

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para notificações
CREATE OR REPLACE FUNCTION update_notificacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notificacoes_updated_at 
    BEFORE UPDATE ON notificacoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_notificacoes_updated_at();

-- Trigger para webhooks
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_webhooks_updated_at 
    BEFORE UPDATE ON webhooks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_webhooks_updated_at();

-- Trigger para configurações
CREATE OR REPLACE FUNCTION update_configuracoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracoes_updated_at 
    BEFORE UPDATE ON configuracoes_sistema 
    FOR EACH ROW 
    EXECUTE FUNCTION update_configuracoes_updated_at();

-- =====================================================
-- COMENTÁRIOS NAS TABELAS E COLUNAS
-- =====================================================

COMMENT ON TABLE notificacoes IS 'Sistema de notificações automáticas e manuais';
COMMENT ON COLUMN notificacoes.tipo IS 'Tipo de notificação';
COMMENT ON COLUMN notificacoes.prioridade IS 'Prioridade da notificação';
COMMENT ON COLUMN notificacoes.destinatarios IS 'Lista de emails dos destinatários (JSON)';
COMMENT ON COLUMN notificacoes.agendamento IS 'Data/hora para envio agendado';

COMMENT ON TABLE logs_auditoria IS 'Logs de auditoria de todas as operações do sistema';
COMMENT ON COLUMN logs_auditoria.acao IS 'Ação realizada (criar, atualizar, deletar, etc.)';
COMMENT ON COLUMN logs_auditoria.entidade IS 'Entidade afetada (grua, obra, cliente, etc.)';
COMMENT ON COLUMN logs_auditoria.entidade_id IS 'ID da entidade afetada';
COMMENT ON COLUMN logs_auditoria.dados_anteriores IS 'Estado anterior dos dados (JSON)';
COMMENT ON COLUMN logs_auditoria.dados_novos IS 'Novo estado dos dados (JSON)';

COMMENT ON TABLE webhooks IS 'Configurações de webhooks para integrações externas';
COMMENT ON COLUMN webhooks.eventos IS 'Lista de eventos que disparam o webhook (JSON)';
COMMENT ON COLUMN webhooks.secret IS 'Chave secreta para validação do webhook';
COMMENT ON COLUMN webhooks.total_execucoes IS 'Total de execuções bem-sucedidas';
COMMENT ON COLUMN webhooks.total_falhas IS 'Total de falhas na execução';

COMMENT ON TABLE backups IS 'Registro de backups realizados';
COMMENT ON COLUMN backups.tipo IS 'Tipo de backup (completo, incremental, específico)';
COMMENT ON COLUMN backups.localizacao IS 'Local onde o backup foi armazenado';
COMMENT ON COLUMN backups.metadata IS 'Metadados do backup (JSON)';

COMMENT ON TABLE configuracoes_sistema IS 'Configurações gerais do sistema';
COMMENT ON COLUMN configuracoes_sistema.chave IS 'Chave única da configuração';
COMMENT ON COLUMN configuracoes_sistema.valor IS 'Valor da configuração';
COMMENT ON COLUMN configuracoes_sistema.tipo IS 'Tipo de dados do valor';
COMMENT ON COLUMN configuracoes_sistema.categoria IS 'Categoria da configuração';
COMMENT ON COLUMN configuracoes_sistema.editavel IS 'Se a configuração pode ser editada via interface';

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para estatísticas de notificações
CREATE OR REPLACE VIEW view_estatisticas_notificacoes AS
SELECT 
    tipo,
    prioridade,
    status,
    COUNT(*) as total,
    COUNT(CASE WHEN enviada_em IS NOT NULL THEN 1 END) as enviadas,
    COUNT(CASE WHEN status = 'falhou' THEN 1 END) as falharam
FROM notificacoes
GROUP BY tipo, prioridade, status;

-- View para estatísticas de auditoria
CREATE OR REPLACE VIEW view_estatisticas_auditoria AS
SELECT 
    entidade,
    acao,
    DATE(timestamp) as data,
    COUNT(*) as total_operacoes,
    COUNT(DISTINCT usuario_id) as usuarios_unicos
FROM logs_auditoria
GROUP BY entidade, acao, DATE(timestamp);

-- View para status dos webhooks
CREATE OR REPLACE VIEW view_status_webhooks AS
SELECT 
    id,
    url,
    ativo,
    total_execucoes,
    total_falhas,
    CASE 
        WHEN total_execucoes = 0 THEN 0
        ELSE ROUND((total_execucoes::DECIMAL / (total_execucoes + total_falhas)) * 100, 2)
    END as taxa_sucesso,
    ultima_execucao,
    criado_em
FROM webhooks;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION limpar_logs_antigos(dias_retencao INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    registros_removidos INTEGER;
BEGIN
    DELETE FROM logs_auditoria 
    WHERE timestamp < NOW() - INTERVAL '1 day' * dias_retencao;
    
    GET DIAGNOSTICS registros_removidos = ROW_COUNT;
    
    RETURN registros_removidos;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar backups expirados
CREATE OR REPLACE FUNCTION limpar_backups_expirados()
RETURNS INTEGER AS $$
DECLARE
    registros_removidos INTEGER;
BEGIN
    DELETE FROM backups 
    WHERE expira_em < NOW() AND status = 'concluido';
    
    GET DIAGNOSTICS registros_removidos = ROW_COUNT;
    
    RETURN registros_removidos;
END;
$$ LANGUAGE plpgsql;

-- Função para obter configuração do sistema
CREATE OR REPLACE FUNCTION obter_configuracao(chave_config VARCHAR)
RETURNS TEXT AS $$
DECLARE
    valor_config TEXT;
BEGIN
    SELECT valor INTO valor_config 
    FROM configuracoes_sistema 
    WHERE chave = chave_config;
    
    RETURN valor_config;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - REMOVER EM PRODUÇÃO)
-- =====================================================

-- Inserir notificação de exemplo
INSERT INTO notificacoes (tipo, titulo, mensagem, prioridade, status, enviada_em) VALUES
('alerta_geral', 'Sistema Iniciado', 'Sistema de gestão de gruas foi iniciado com sucesso', 'baixa', 'enviada', NOW())
ON CONFLICT DO NOTHING;

-- Inserir log de auditoria de exemplo
INSERT INTO logs_auditoria (acao, entidade, entidade_id, dados_novos) VALUES
('sistema_iniciado', 'sistema', '1', jsonb_build_object('versao', '1.0.0', 'timestamp', NOW()))
ON CONFLICT DO NOTHING;
