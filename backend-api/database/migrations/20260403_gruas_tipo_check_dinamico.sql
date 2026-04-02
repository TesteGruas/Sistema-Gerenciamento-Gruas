-- Tipos de grua passaram a ser dinâmicos (catálogo tipos_grua + novos nomes).
-- Postgres costuma nomear CHECK como {tabela}_{coluna}_check → gruas_tipo_check
-- ou chk_gruas_tipo em scripts manuais.

ALTER TABLE gruas DROP CONSTRAINT IF EXISTS chk_gruas_tipo;
ALTER TABLE gruas DROP CONSTRAINT IF EXISTS gruas_tipo_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_gruas_tipo_tamanho'
  ) THEN
    ALTER TABLE gruas
      ADD CONSTRAINT chk_gruas_tipo_tamanho
      CHECK (
        tipo IS NULL
        OR (length(trim(tipo)) >= 1 AND length(tipo) <= 128)
      );
  END IF;
END $$;

COMMENT ON CONSTRAINT chk_gruas_tipo_tamanho ON gruas IS
  'Tipo é texto livre (catálogo tipos_grua); apenas limite de tamanho.';
