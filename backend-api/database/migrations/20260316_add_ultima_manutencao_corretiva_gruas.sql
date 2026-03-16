-- Campo para histórico de manutenção corretiva no cadastro de gruas
ALTER TABLE gruas
ADD COLUMN IF NOT EXISTS ultima_manutencao_corretiva DATE;

COMMENT ON COLUMN gruas.ultima_manutencao_corretiva IS 'Data da última manutenção corretiva da grua';

