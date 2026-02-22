-- Migration: Adicionar colunas de dupla assinatura em registros_ponto
-- Data: 2026-02-21

ALTER TABLE registros_ponto
  ADD COLUMN IF NOT EXISTS assinatura_responsavel_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS assinatura_responsavel_por INTEGER REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS data_assinatura_responsavel TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS assinatura_funcionario_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS data_assinatura_funcionario TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_registros_ponto_assinatura_responsavel
  ON registros_ponto(assinatura_responsavel_por);

CREATE INDEX IF NOT EXISTS idx_registros_ponto_status_assinatura
  ON registros_ponto(status)
  WHERE status IN ('Pendente Assinatura', 'Pendente Assinatura Funcionário');
