-- Migration: Adicionar tipo e banco_origem_id na tabela boletos
-- Data: 2025-02-28
-- Descrição: Adiciona campo tipo (receber/pagar) e banco_origem_id para vincular boletos a contas bancárias

-- Adicionar coluna tipo (receber ou pagar)
ALTER TABLE boletos 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'receber' CHECK (tipo IN ('receber', 'pagar'));

-- Adicionar coluna banco_origem_id (referência à tabela contas_bancarias)
ALTER TABLE boletos 
ADD COLUMN IF NOT EXISTS banco_origem_id INTEGER REFERENCES contas_bancarias(id) ON DELETE SET NULL;

-- Criar índice para banco_origem_id
CREATE INDEX IF NOT EXISTS idx_boletos_banco_origem_id ON boletos(banco_origem_id);

-- Criar índice para tipo
CREATE INDEX IF NOT EXISTS idx_boletos_tipo ON boletos(tipo);

-- Comentários
COMMENT ON COLUMN boletos.tipo IS 'Tipo do boleto: receber (a receber) ou pagar (a pagar)';
COMMENT ON COLUMN boletos.banco_origem_id IS 'ID da conta bancária de origem do boleto';

