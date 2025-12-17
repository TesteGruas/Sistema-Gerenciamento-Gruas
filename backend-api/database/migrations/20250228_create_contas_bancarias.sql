-- Migration: Criar tabela de contas bancárias
-- Data: 2025-02-28
-- Descrição: Tabela para gerenciar contas bancárias do sistema

-- Criar tabela de contas bancárias
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(255),
    banco VARCHAR(100) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta VARCHAR(20) NOT NULL,
    tipo_conta VARCHAR(20) NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca', 'investimento')),
    saldo_atual DECIMAL(12,2) DEFAULT 0,
    saldo_inicial DECIMAL(12,2) DEFAULT 0,
    moeda VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'bloqueada')),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_banco ON contas_bancarias(banco);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_status ON contas_bancarias(status);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_tipo_conta ON contas_bancarias(tipo_conta);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_contas_bancarias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contas_bancarias_updated_at
    BEFORE UPDATE ON contas_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION update_contas_bancarias_updated_at();

-- Comentários
COMMENT ON TABLE contas_bancarias IS 'Tabela de contas bancárias do sistema';
COMMENT ON COLUMN contas_bancarias.tipo_conta IS 'Tipo da conta: corrente, poupanca ou investimento';
COMMENT ON COLUMN contas_bancarias.status IS 'Status da conta: ativa, inativa ou bloqueada';

