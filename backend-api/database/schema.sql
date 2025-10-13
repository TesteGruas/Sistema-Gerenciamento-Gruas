-- Schema completo do banco de dados
-- Sistema de Gerenciamento de Gruas

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de funcionários
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20),
    data_nascimento DATE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    cargo VARCHAR(100),
    salario DECIMAL(10,2),
    data_admissao DATE,
    status VARCHAR(20) DEFAULT 'ativo',
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    contato_responsavel VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de obras
CREATE TABLE obras (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    cliente_id INTEGER REFERENCES clientes(id),
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'ativa',
    valor_total DECIMAL(12,2),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de gruas
CREATE TABLE gruas (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(255) NOT NULL,
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    capacidade DECIMAL(8,2),
    altura_maxima DECIMAL(8,2),
    alcance_maximo DECIMAL(8,2),
    status VARCHAR(20) DEFAULT 'disponivel',
    obra_atual_id INTEGER REFERENCES obras(id),
    data_ultima_manutencao DATE,
    proxima_manutencao DATE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de ponto eletrônico
CREATE TABLE registros_ponto (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    funcionario_id INTEGER REFERENCES funcionarios(id),
    data DATE NOT NULL,
    entrada TIME,
    saida_almoco TIME,
    volta_almoco TIME,
    saida TIME,
    horas_trabalhadas DECIMAL(4,2),
    horas_extras DECIMAL(4,2),
    localizacao VARCHAR(255),
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de justificativas
CREATE TABLE justificativas (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    funcionario_id INTEGER REFERENCES funcionarios(id),
    data DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    motivo TEXT NOT NULL,
    anexos TEXT[],
    status VARCHAR(20) DEFAULT 'pendente',
    aprovado_por INTEGER REFERENCES funcionarios(id),
    data_aprovacao TIMESTAMP,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de estoque
CREATE TABLE estoque (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    quantidade INTEGER DEFAULT 0,
    quantidade_minima INTEGER DEFAULT 0,
    preco_unitario DECIMAL(10,2),
    fornecedor VARCHAR(255),
    localizacao VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de movimentações de estoque
CREATE TABLE movimentacoes_estoque (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    item_id INTEGER REFERENCES estoque(id),
    tipo VARCHAR(20) NOT NULL, -- entrada, saida, ajuste
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(255),
    funcionario_id INTEGER REFERENCES funcionarios(id),
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT
);

-- Tabela financeira - contas a receber
CREATE TABLE contas_receber (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    cliente_id INTEGER REFERENCES clientes(id),
    obra_id INTEGER REFERENCES obras(id),
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente',
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela financeira - contas a pagar
CREATE TABLE contas_pagar (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    fornecedor VARCHAR(255),
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente',
    forma_pagamento VARCHAR(50),
    categoria VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de transferências bancárias
CREATE TABLE transferencias_bancarias (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    data DATE NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- entrada, saida
    descricao TEXT NOT NULL,
    banco_origem VARCHAR(100),
    banco_destino VARCHAR(100),
    documento_comprobatório VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de notificações
CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    destinatario_id INTEGER REFERENCES funcionarios(id),
    lida BOOLEAN DEFAULT false,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_leitura TIMESTAMP,
    prioridade VARCHAR(20) DEFAULT 'normal',
    categoria VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de assinaturas digitais
CREATE TABLE assinaturas_digitais (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    funcionario_id INTEGER REFERENCES funcionarios(id),
    documento_tipo VARCHAR(100) NOT NULL,
    documento_id INTEGER NOT NULL,
    assinatura_base64 TEXT NOT NULL,
    data_assinatura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relatórios
CREATE TABLE relatorios (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    parametros JSONB,
    gerado_por INTEGER REFERENCES funcionarios(id),
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    arquivo_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'processando',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações do sistema
CREATE TABLE configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX idx_funcionarios_status ON funcionarios(status);
CREATE INDEX idx_clientes_cnpj ON clientes(cnpj);
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_obras_cliente ON obras(cliente_id);
CREATE INDEX idx_obras_status ON obras(status);
CREATE INDEX idx_gruas_status ON gruas(status);
CREATE INDEX idx_gruas_obra ON gruas(obra_atual_id);
CREATE INDEX idx_registros_ponto_funcionario ON registros_ponto(funcionario_id);
CREATE INDEX idx_registros_ponto_data ON registros_ponto(data);
CREATE INDEX idx_contas_receber_vencimento ON contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_status ON contas_receber(status);
CREATE INDEX idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX idx_notificacoes_destinatario ON notificacoes(destinatario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON funcionarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON obras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gruas_updated_at BEFORE UPDATE ON gruas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON contas_receber FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON contas_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transferencias_updated_at BEFORE UPDATE ON transferencias_bancarias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('sistema_nome', 'Sistema de Gerenciamento de Gruas', 'Nome do sistema', 'string'),
('sistema_versao', '1.0.0', 'Versão do sistema', 'string'),
('jornada_padrao', '8', 'Jornada padrão em horas', 'number'),
('tolerancia_atraso', '15', 'Tolerância para atraso em minutos', 'number'),
('notificacoes_ativas', 'true', 'Notificações ativas', 'boolean'),
('backup_automatico', 'true', 'Backup automático ativo', 'boolean');

-- Inserir usuário admin padrão
INSERT INTO users (name, email, password_hash, role) VALUES
('Administrador', 'admin@sistema.com', crypt('admin123', gen_salt('bf')), 'admin');

-- Inserir funcionário admin
INSERT INTO funcionarios (nome, cpf, email, cargo, salario, data_admissao, user_id) VALUES
('Administrador do Sistema', '000.000.000-00', 'admin@sistema.com', 'Administrador', 0.00, CURRENT_DATE, 1);
