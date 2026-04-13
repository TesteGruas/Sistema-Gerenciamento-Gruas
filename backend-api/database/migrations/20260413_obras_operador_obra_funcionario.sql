-- Operador de obra: funcionário da empresa (cadastro em funcionarios) vinculado à obra.
-- Usado no Livro da Grua e na aba Funcionários.

ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS operador_obra_funcionario_id INTEGER REFERENCES funcionarios (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_obras_operador_obra_funcionario_id ON obras (operador_obra_funcionario_id);
