-- Benefícios documentais mensais (Termo / Recibo VR): PDF + assinatura + competência
ALTER TABLE funcionario_beneficios
  ADD COLUMN IF NOT EXISTS mes_referencia VARCHAR(7),
  ADD COLUMN IF NOT EXISTS arquivo VARCHAR(500),
  ADD COLUMN IF NOT EXISTS assinatura_digital TEXT,
  ADD COLUMN IF NOT EXISTS assinado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assinado_por INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'funcionario_beneficios_mes_referencia_formato'
  ) THEN
    ALTER TABLE funcionario_beneficios
      ADD CONSTRAINT funcionario_beneficios_mes_referencia_formato
      CHECK (mes_referencia IS NULL OR mes_referencia ~ '^\d{4}-\d{2}$');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_mes_referencia
  ON funcionario_beneficios (mes_referencia);

CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_funcionario_mes
  ON funcionario_beneficios (funcionario_id, mes_referencia);

COMMENT ON COLUMN funcionario_beneficios.mes_referencia IS 'Competência YYYY-MM (benefícios documentais mensais)';
COMMENT ON COLUMN funcionario_beneficios.arquivo IS 'Path/URL do PDF no storage';
COMMENT ON COLUMN funcionario_beneficios.assinatura_digital IS 'Assinatura canvas (data URL) do colaborador';
