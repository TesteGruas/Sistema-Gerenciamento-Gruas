-- Migration: Criar tabela de contas recorrentes por aluguel
-- Objetivo: Permitir N contas mensais (luz, agua, energia etc.) com anexo PDF

CREATE TABLE IF NOT EXISTS aluguel_contas_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluguel_id UUID NOT NULL REFERENCES alugueis_residencias(id) ON DELETE CASCADE,
  nome_conta VARCHAR(150) NOT NULL,
  tipo_conta VARCHAR(30) NOT NULL DEFAULT 'outros'
    CHECK (tipo_conta IN ('luz', 'agua', 'energia', 'internet', 'gas', 'condominio', 'outros')),
  valor_mensal NUMERIC(12,2) NOT NULL CHECK (valor_mensal >= 0),
  dia_vencimento INTEGER CHECK (dia_vencimento BETWEEN 1 AND 31),
  arquivo_pdf VARCHAR(500),
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by INTEGER REFERENCES usuarios(id),
  updated_by INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_aluguel_contas_recorrentes_aluguel_id
  ON aluguel_contas_recorrentes(aluguel_id);

CREATE INDEX IF NOT EXISTS idx_aluguel_contas_recorrentes_ativo
  ON aluguel_contas_recorrentes(ativo);

COMMENT ON TABLE aluguel_contas_recorrentes IS 'Contas mensais recorrentes vinculadas ao aluguel (luz, agua, energia etc.)';
COMMENT ON COLUMN aluguel_contas_recorrentes.arquivo_pdf IS 'URL/caminho do arquivo PDF da conta';
