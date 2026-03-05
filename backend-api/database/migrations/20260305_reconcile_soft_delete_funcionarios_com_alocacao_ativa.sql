-- Migration: Reconciliar soft delete indevido de funcionarios com alocacao ativa
-- Data: 2026-03-05
-- Descricao:
--   Reativa funcionarios e usuarios vinculados quando houver alocacao ativa
--   em funcionarios_obras. Isso corrige casos em que o colaborador foi marcado
--   como Inativo/deletado, mas continua alocado e usando o PWA de ponto.

BEGIN;

-- 1) Reativar funcionarios com alocacao ativa
WITH funcionarios_para_reativar AS (
  SELECT DISTINCT f.id
  FROM funcionarios f
  INNER JOIN funcionarios_obras fo ON fo.funcionario_id = f.id
  WHERE COALESCE(fo.status, '') = 'ativo'
    AND (fo.data_fim IS NULL OR fo.data_fim >= CURRENT_DATE)
    AND (
      COALESCE(f.status, '') <> 'Ativo'
      OR f.deleted_at IS NOT NULL
    )
)
UPDATE funcionarios f
SET
  status = 'Ativo',
  deleted_at = NULL,
  updated_at = NOW()
FROM funcionarios_para_reativar x
WHERE f.id = x.id;

-- 2) Reativar usuarios vinculados aos funcionarios reativados
WITH usuarios_para_reativar AS (
  SELECT u.id
  FROM usuarios u
  INNER JOIN funcionarios f ON f.id = u.funcionario_id
  INNER JOIN funcionarios_obras fo ON fo.funcionario_id = f.id
  WHERE COALESCE(fo.status, '') = 'ativo'
    AND (fo.data_fim IS NULL OR fo.data_fim >= CURRENT_DATE)
    AND (
      COALESCE(u.status, '') <> 'Ativo'
      OR u.deleted_at IS NOT NULL
    )
)
UPDATE usuarios u
SET
  status = 'Ativo',
  deleted_at = NULL,
  updated_at = NOW()
FROM usuarios_para_reativar x
WHERE u.id = x.id;

COMMIT;
