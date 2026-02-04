-- Migration: Criar tabela de movimentações bancárias
-- Data: 2026-02-04
-- Descrição: Tabela para gerenciar entradas e saídas de contas bancárias

-- Criar tabela de movimentações bancárias
CREATE TABLE IF NOT EXISTS movimentacoes_bancarias (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    conta_bancaria_id INTEGER NOT NULL REFERENCES contas_bancarias(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(12,2) NOT NULL CHECK (valor > 0),
    descricao VARCHAR(255) NOT NULL,
    referencia VARCHAR(255),
    data DATE NOT NULL,
    categoria VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bancarias_conta_id ON movimentacoes_bancarias(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bancarias_tipo ON movimentacoes_bancarias(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bancarias_data ON movimentacoes_bancarias(data);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bancarias_categoria ON movimentacoes_bancarias(categoria);

-- Trigger para atualizar saldo da conta bancária ao criar movimentação
CREATE OR REPLACE FUNCTION atualizar_saldo_conta_bancaria()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo = 'entrada' THEN
        UPDATE contas_bancarias 
        SET saldo_atual = saldo_atual + NEW.valor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conta_bancaria_id;
    ELSIF NEW.tipo = 'saida' THEN
        UPDATE contas_bancarias 
        SET saldo_atual = saldo_atual - NEW.valor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conta_bancaria_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_saldo_movimentacao
    AFTER INSERT ON movimentacoes_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_saldo_conta_bancaria();

-- Trigger para atualizar saldo ao atualizar movimentação
CREATE OR REPLACE FUNCTION atualizar_saldo_conta_bancaria_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Reverter o saldo antigo
    IF OLD.tipo = 'entrada' THEN
        UPDATE contas_bancarias 
        SET saldo_atual = saldo_atual - OLD.valor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.conta_bancaria_id;
    ELSIF OLD.tipo = 'saida' THEN
        UPDATE contas_bancarias 
        SET saldo_atual = saldo_atual + OLD.valor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.conta_bancaria_id;
    END IF;
    
    -- Aplicar o novo saldo
    IF NEW.tipo = 'entrada' THEN
        UPDATE contas_bancarias 
        SET saldo_atual = saldo_atual + NEW.valor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conta_bancaria_id;
    ELSIF NEW.tipo = 'saida' THEN
        UPDATE contas_bancarias 
        SET saldo_atual = saldo_atual - NEW.valor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conta_bancaria_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_saldo_movimentacao_update
    AFTER UPDATE ON movimentacoes_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_saldo_conta_bancaria_update();

-- Trigger para atualizar saldo ao deletar movimentação
CREATE OR REPLACE FUNCTION atualizar_saldo_conta_bancaria_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.tipo = 'entrada' THEN
        UPDATE contas_bancarias 
        SET saldo_atual = saldo_atual - OLD.valor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.conta_bancaria_id;
    ELSIF OLD.tipo = 'saida' THEN
        UPDATE contas_bancarias 
        SET saldo_atual = saldo_atual + OLD.valor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.conta_bancaria_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_saldo_movimentacao_delete
    AFTER DELETE ON movimentacoes_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_saldo_conta_bancaria_delete();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_movimentacoes_bancarias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_movimentacoes_bancarias_updated_at
    BEFORE UPDATE ON movimentacoes_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION update_movimentacoes_bancarias_updated_at();

-- Comentários
COMMENT ON TABLE movimentacoes_bancarias IS 'Tabela de movimentações bancárias (entradas e saídas)';
COMMENT ON COLUMN movimentacoes_bancarias.tipo IS 'Tipo da movimentação: entrada ou saida';
COMMENT ON COLUMN movimentacoes_bancarias.valor IS 'Valor da movimentação (sempre positivo)';
COMMENT ON COLUMN movimentacoes_bancarias.data IS 'Data da movimentação';
COMMENT ON COLUMN movimentacoes_bancarias.categoria IS 'Categoria da movimentação (ex: recebimento, pagamento, transferência, etc)';
