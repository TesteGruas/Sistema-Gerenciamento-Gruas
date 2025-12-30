-- Migration: Adicionar suporte a almoço automático e trabalho corrido
-- Data: 2025-03-02
-- Descrição: Adiciona tabelas para gerenciar notificações de almoço e confirmação de trabalho corrido

-- Tabela para armazenar notificações de almoço enviadas
-- Nota: registro_ponto.id é VARCHAR (gerado por gerarIdRegistro), não INTEGER
CREATE TABLE IF NOT EXISTS notificacoes_almoco (
    id SERIAL PRIMARY KEY,
    registro_ponto_id VARCHAR(50) REFERENCES registros_ponto(id) ON DELETE CASCADE,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora_notificacao TIME NOT NULL,
    telefone_destino VARCHAR(20) NOT NULL,
    mensagem_enviada TEXT,
    status VARCHAR(50) DEFAULT 'enviada' CHECK (status IN ('enviada', 'respondida', 'expirada')),
    resposta VARCHAR(50) CHECK (resposta IN ('pausa', 'trabalho_corrido', 'nao_respondido')),
    resposta_recebida_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_notificacoes_almoco_registro ON notificacoes_almoco(registro_ponto_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_almoco_funcionario ON notificacoes_almoco(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_almoco_data ON notificacoes_almoco(data);
CREATE INDEX IF NOT EXISTS idx_notificacoes_almoco_status ON notificacoes_almoco(status);

-- Tabela para confirmação de trabalho corrido pelo encarregado
-- Nota: registro_ponto.id é VARCHAR (gerado por gerarIdRegistro), não INTEGER
CREATE TABLE IF NOT EXISTS confirmacoes_trabalho_corrido (
    id SERIAL PRIMARY KEY,
    registro_ponto_id VARCHAR(50) NOT NULL REFERENCES registros_ponto(id) ON DELETE CASCADE,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    encarregado_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    confirmado BOOLEAN DEFAULT false,
    observacoes TEXT,
    confirmado_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(registro_ponto_id)
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_confirmacoes_trabalho_registro ON confirmacoes_trabalho_corrido(registro_ponto_id);
CREATE INDEX IF NOT EXISTS idx_confirmacoes_trabalho_funcionario ON confirmacoes_trabalho_corrido(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_confirmacoes_trabalho_encarregado ON confirmacoes_trabalho_corrido(encarregado_id);
CREATE INDEX IF NOT EXISTS idx_confirmacoes_trabalho_data ON confirmacoes_trabalho_corrido(data);

-- Adicionar campo para indicar trabalho corrido no registro de ponto
ALTER TABLE registros_ponto 
ADD COLUMN IF NOT EXISTS trabalho_corrido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trabalho_corrido_confirmado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trabalho_corrido_confirmado_por INTEGER REFERENCES funcionarios(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS trabalho_corrido_confirmado_em TIMESTAMP;

-- Comentários nas colunas
COMMENT ON COLUMN registros_ponto.trabalho_corrido IS 'Indica se o funcionário optou por trabalho corrido (sem pausa para almoço)';
COMMENT ON COLUMN registros_ponto.trabalho_corrido_confirmado IS 'Indica se o encarregado confirmou o trabalho corrido';
COMMENT ON COLUMN registros_ponto.trabalho_corrido_confirmado_por IS 'ID do encarregado que confirmou o trabalho corrido';
COMMENT ON COLUMN registros_ponto.trabalho_corrido_confirmado_em IS 'Data/hora da confirmação do trabalho corrido';

-- Comentários nas tabelas
COMMENT ON TABLE notificacoes_almoco IS 'Registra notificações de almoço enviadas via WhatsApp';
COMMENT ON TABLE confirmacoes_trabalho_corrido IS 'Registra confirmações de trabalho corrido feitas pelos encarregados';

