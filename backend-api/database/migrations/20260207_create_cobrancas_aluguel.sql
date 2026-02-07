-- Migration: Criar tabela de cobranças de aluguel
-- Data: 2026-02-07
-- Descrição: Tabela para gerenciar cobranças mensais de aluguéis com custos adicionais

-- Criar tabela de cobranças de aluguel
CREATE TABLE IF NOT EXISTS cobrancas_aluguel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluguel_id UUID NOT NULL REFERENCES alugueis_residencias(id) ON DELETE CASCADE,
    mes VARCHAR(7) NOT NULL, -- formato YYYY-MM
    conta_bancaria_id INTEGER NOT NULL REFERENCES contas_bancarias(id) ON DELETE RESTRICT,
    valor_aluguel DECIMAL(10,2) NOT NULL CHECK (valor_aluguel >= 0),
    valor_custos DECIMAL(10,2) DEFAULT 0 CHECK (valor_custos >= 0), -- custos adicionais (luz, água, etc.)
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    movimentacao_bancaria_id INTEGER REFERENCES movimentacoes_bancarias(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluguel_aluguel_id ON cobrancas_aluguel(aluguel_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluguel_mes ON cobrancas_aluguel(mes);
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluguel_status ON cobrancas_aluguel(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluguel_conta_bancaria ON cobrancas_aluguel(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluguel_data_vencimento ON cobrancas_aluguel(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluguel_movimentacao ON cobrancas_aluguel(movimentacao_bancaria_id);

-- Índice único para evitar cobranças duplicadas no mesmo mês
CREATE UNIQUE INDEX IF NOT EXISTS idx_cobrancas_aluguel_unique ON cobrancas_aluguel(aluguel_id, mes) WHERE status != 'cancelado';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_cobrancas_aluguel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cobrancas_aluguel_updated_at
    BEFORE UPDATE ON cobrancas_aluguel
    FOR EACH ROW
    EXECUTE FUNCTION update_cobrancas_aluguel_updated_at();

-- Trigger para atualizar status automaticamente baseado na data
CREATE OR REPLACE FUNCTION atualizar_status_cobranca_aluguel()
RETURNS TRIGGER AS $$
BEGIN
    -- Se tem data de pagamento, status é pago
    IF NEW.data_pagamento IS NOT NULL THEN
        NEW.status = 'pago';
    -- Se não tem data de pagamento e a data de vencimento passou, status é atrasado
    ELSIF NEW.data_vencimento < CURRENT_DATE THEN
        NEW.status = 'atrasado';
    -- Caso contrário, status é pendente
    ELSE
        NEW.status = 'pendente';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_status_cobranca_aluguel
    BEFORE INSERT OR UPDATE ON cobrancas_aluguel
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_status_cobranca_aluguel();

-- Comentários nas colunas
COMMENT ON TABLE cobrancas_aluguel IS 'Tabela para gerenciar cobranças mensais de aluguéis';
COMMENT ON COLUMN cobrancas_aluguel.mes IS 'Competência da cobrança no formato YYYY-MM';
COMMENT ON COLUMN cobrancas_aluguel.valor_custos IS 'Custos adicionais como conta de luz, água, condomínio, etc.';
COMMENT ON COLUMN cobrancas_aluguel.movimentacao_bancaria_id IS 'Referência à movimentação bancária criada automaticamente';
