-- Tipos de grua cadastráveis (listagem dinâmica no frontend)
CREATE TABLE IF NOT EXISTS tipos_grua (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(128) NOT NULL UNIQUE,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tipos_grua_ordem_nome ON tipos_grua (ordem, nome);

INSERT INTO tipos_grua (nome, ordem) VALUES
  ('Grua Torre', 10),
  ('Grua Torre Auto Estável', 20),
  ('Grua Móvel', 30),
  ('Guincho', 40),
  ('Outros', 50)
ON CONFLICT (nome) DO NOTHING;

COMMENT ON TABLE tipos_grua IS 'Catálogo de tipos de grua para selects e filtros';
COMMENT ON COLUMN tipos_grua.nome IS 'Rótulo exibido e gravado em gruas.tipo';
