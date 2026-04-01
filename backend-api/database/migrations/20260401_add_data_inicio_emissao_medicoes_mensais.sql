-- Início do período de emissão (alinhado ao formulário de criação). data_medicao continua representando o fim.
ALTER TABLE medicoes_mensais
  ADD COLUMN IF NOT EXISTS data_inicio_emissao DATE;

COMMENT ON COLUMN medicoes_mensais.data_inicio_emissao IS 'Data início do período de emissão; data_medicao é o fim do período.';
