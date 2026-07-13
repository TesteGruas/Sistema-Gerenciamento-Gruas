-- Unicidade de CPF apenas para funcionários ativos (deleted_at IS NULL).
-- Soft-delete passa a liberar o CPF para novo cadastro.

-- Liberar CPFs já soft-deleted (evita conflito com UNIQUE legada)
UPDATE funcionarios
SET
  cpf = ('D' || lpad(id::text, 13, '0'))::varchar(14),
  updated_at = NOW()
WHERE deleted_at IS NOT NULL
  AND cpf IS NOT NULL
  AND cpf !~ '^D[0-9]+$';

-- Remover UNIQUE antiga (nome padrão do Postgres / variantes comuns)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_cpf_key;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_cpf_unique;

DROP INDEX IF EXISTS funcionarios_cpf_key;
DROP INDEX IF EXISTS funcionarios_cpf_unique;
DROP INDEX IF EXISTS idx_funcionarios_cpf_unique;

-- Índice único parcial: só ativos
CREATE UNIQUE INDEX IF NOT EXISTS idx_funcionarios_cpf_ativos_unique
ON funcionarios (cpf)
WHERE deleted_at IS NULL AND cpf IS NOT NULL AND btrim(cpf) <> '';
