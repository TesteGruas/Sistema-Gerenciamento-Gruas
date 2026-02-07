-- Migration: Adicionar campo boleto_id na tabela cobrancas_aluguel
-- Data: 2026-02-07
-- Descrição: Permite vincular um boleto a uma cobrança de aluguel

-- Adicionar coluna boleto_id
ALTER TABLE cobrancas_aluguel
ADD COLUMN IF NOT EXISTS boleto_id INTEGER REFERENCES boletos(id) ON DELETE SET NULL;

-- Criar índice para boleto_id
CREATE INDEX IF NOT EXISTS idx_cobrancas_aluguel_boleto_id ON cobrancas_aluguel(boleto_id);

-- Comentário na coluna
COMMENT ON COLUMN cobrancas_aluguel.boleto_id IS 'Referência ao boleto vinculado a esta cobrança';
