-- Operador da obra também é funcionário da obra.
-- Quem já está em obra_operadores entra em funcionarios_obras e passa a ter obra atual.

INSERT INTO funcionarios_obras (
  funcionario_id,
  obra_id,
  data_inicio,
  status,
  horas_trabalhadas,
  is_supervisor,
  observacoes
)
SELECT
  oo.funcionario_id,
  oo.obra_id,
  CURRENT_DATE,
  'ativo',
  0,
  false,
  'Alocado automaticamente como operador da obra'
FROM obra_operadores oo
WHERE NOT EXISTS (
  SELECT 1
  FROM funcionarios_obras fo
  WHERE fo.funcionario_id = oo.funcionario_id
    AND fo.obra_id = oo.obra_id
    AND fo.status = 'ativo'
);

UPDATE funcionarios f
SET obra_atual_id = sub.obra_id
FROM (
  SELECT DISTINCT ON (oo.funcionario_id)
    oo.funcionario_id,
    oo.obra_id
  FROM obra_operadores oo
  INNER JOIN funcionarios_obras fo
    ON fo.funcionario_id = oo.funcionario_id
   AND fo.obra_id = oo.obra_id
   AND fo.status = 'ativo'
  ORDER BY oo.funcionario_id, oo.created_at ASC
) sub
WHERE f.id = sub.funcionario_id
  AND f.obra_atual_id IS NULL;
