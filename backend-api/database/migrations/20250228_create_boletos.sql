-- Migration: Criar tabela de boletos
-- Data: 2025-02-28
-- Descrição: Tabela para gerenciar boletos (vinculados a medições ou independentes)

-- Criar tabela de boletos
CREATE TABLE IF NOT EXISTS boletos (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    numero_boleto VARCHAR(100) UNIQUE,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    obra_id INTEGER REFERENCES obras(id) ON DELETE SET NULL,
    medicao_id INTEGER REFERENCES medicoes_mensais(id) ON DELETE SET NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
    forma_pagamento VARCHAR(50),
    codigo_barras VARCHAR(200),
    linha_digitavel VARCHAR(200),
    nosso_numero VARCHAR(100),
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(20),
    arquivo_boleto VARCHAR(500),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_boletos_cliente_id ON boletos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_boletos_obra_id ON boletos(obra_id);
CREATE INDEX IF NOT EXISTS idx_boletos_medicao_id ON boletos(medicao_id);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_boletos_data_vencimento ON boletos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_boletos_numero_boleto ON boletos(numero_boleto);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_boletos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_boletos_updated_at
    BEFORE UPDATE ON boletos
    FOR EACH ROW
    EXECUTE FUNCTION update_boletos_updated_at();

-- Comentários
COMMENT ON TABLE boletos IS 'Tabela de boletos a receber (vinculados a medições ou independentes)';
COMMENT ON COLUMN boletos.medicao_id IS 'ID da medição vinculada (opcional - boletos podem ser independentes)';
COMMENT ON COLUMN boletos.cliente_id IS 'ID do cliente (obrigatório se não houver obra_id)';
COMMENT ON COLUMN boletos.obra_id IS 'ID da obra (opcional)';

