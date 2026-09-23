-- Vários operadores de grua por obra.
-- A coluna obras.operador_obra_funcionario_id continua como o primeiro da lista.

CREATE TABLE IF NOT EXISTS obra_operadores (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (obra_id, funcionario_id)
);

CREATE INDEX IF NOT EXISTS idx_obra_operadores_obra_id ON obra_operadores (obra_id);
CREATE INDEX IF NOT EXISTS idx_obra_operadores_funcionario_id ON obra_operadores (funcionario_id);

INSERT INTO obra_operadores (obra_id, funcionario_id)
SELECT o.id, o.operador_obra_funcionario_id
FROM obras o
WHERE o.operador_obra_funcionario_id IS NOT NULL
ON CONFLICT (obra_id, funcionario_id) DO NOTHING;
