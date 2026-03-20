-- Corrige telefone incompleto (10 dígitos) → celular BR com DDD 81 (PE).
-- Só altera se ainda estiver com o valor errado conhecido (evita sobrescrever edições manuais).
UPDATE responsaveis_obra
SET telefone = '81987440990',
    updated_at = now()
WHERE id = 20
  AND obra_id = 137
  AND telefone IN ('9187440990', '8198744099', '987440990');
