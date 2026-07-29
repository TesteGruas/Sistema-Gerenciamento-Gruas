-- Taxonomias editáveis do estoque: classificações e subcategorias de ativo.
-- Remove CHECKs rígidos em produtos para permitir novos códigos cadastrados pelo usuário.

CREATE TABLE IF NOT EXISTS estoque_classificacoes (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  exige_subcategoria BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque_subcategorias_ativo (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estoque_classificacoes_status ON estoque_classificacoes(status);
CREATE INDEX IF NOT EXISTS idx_estoque_subcategorias_ativo_status ON estoque_subcategorias_ativo(status);

INSERT INTO estoque_classificacoes (codigo, nome, descricao, status, exige_subcategoria)
VALUES
  ('componente', 'Componente', 'Partes do ativo', 'Ativa', false),
  ('item', 'Item', 'Consumíveis', 'Ativa', false),
  ('ativo', 'Ativo', 'Imobilizados', 'Ativa', true),
  ('complemento', 'Complemento', 'Peças que compõem ativos', 'Ativa', false)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO estoque_subcategorias_ativo (codigo, nome, descricao, status)
VALUES
  ('grua', 'Grua', NULL, 'Ativa'),
  ('equipamento_grua', 'Equipamento (Complemento de Grua)', NULL, 'Ativa'),
  ('ferramenta', 'Ferramenta', NULL, 'Ativa'),
  ('ar_condicionado', 'Ar Condicionado', NULL, 'Ativa'),
  ('camera', 'Câmera', NULL, 'Ativa'),
  ('auto', 'Auto', NULL, 'Ativa'),
  ('pc', 'PC', NULL, 'Ativa')
ON CONFLICT (codigo) DO NOTHING;

-- Remover CHECKs antigos (nomes padrão do Postgres para ADD COLUMN ... CHECK)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'produtos'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%classificacao_tipo%'
  LOOP
    EXECUTE format('ALTER TABLE produtos DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'produtos'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%subcategoria_ativo%'
  LOOP
    EXECUTE format('ALTER TABLE produtos DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

COMMENT ON TABLE estoque_classificacoes IS 'Classificações de produto do estoque (editáveis no dashboard)';
COMMENT ON TABLE estoque_subcategorias_ativo IS 'Subcategorias usadas quando a classificação exige subcategoria (ex.: ativo)';
