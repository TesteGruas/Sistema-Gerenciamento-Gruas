-- Velocidade de elevação pode ser descritiva (ex.: 0-25-062 m/min), não apenas DECIMAL.

ALTER TABLE gruas
  ALTER COLUMN velocidade_elevacao DROP DEFAULT;

ALTER TABLE gruas
  ALTER COLUMN velocidade_elevacao TYPE VARCHAR(64)
  USING COALESCE(TRIM(velocidade_elevacao::text), '');

ALTER TABLE gruas
  ALTER COLUMN velocidade_elevacao SET DEFAULT '';

COMMENT ON COLUMN gruas.velocidade_elevacao IS 'Velocidade de elevação (texto livre; geralmente m/min, pode incluir hífens)';

ALTER TABLE grua_obra
  ALTER COLUMN velocidade_elevacao TYPE VARCHAR(64)
  USING CASE WHEN velocidade_elevacao IS NULL THEN NULL ELSE TRIM(velocidade_elevacao::text) END;

COMMENT ON COLUMN grua_obra.velocidade_elevacao IS 'Velocidade de elevação (texto livre; geralmente m/min, pode incluir hífens)';
