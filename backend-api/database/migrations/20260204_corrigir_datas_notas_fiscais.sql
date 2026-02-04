-- Migration: Corrigir datas de notas fiscais que foram salvas com 1 dia a menos
-- Data: 2026-02-04
-- Descrição: Corrige datas de emissão e vencimento que foram salvas incorretamente devido a problemas de timezone
-- 
-- Esta migration corrige datas que foram salvas antes da correção do código (antes de 2026-02-04 19:27:00)
-- e que têm uma diferença de 1 dia em relação à data de criação, indicando problema de timezone.

-- Corrigir data_emissao: adicionar 1 dia se a diferença entre DATE(created_at) e data_emissao for exatamente 1 dia
-- Isso indica que a data foi salva incorretamente (1 dia a menos)
UPDATE notas_fiscais
SET data_emissao = data_emissao + INTERVAL '1 day'
WHERE data_emissao IS NOT NULL
  AND created_at < '2026-02-04 19:27:00'::timestamp
  -- Apenas corrigir se a diferença for exatamente 1 dia (indicando problema de timezone)
  AND DATE(created_at) - data_emissao = 1;

-- Corrigir data_vencimento: adicionar 1 dia se houver data_emissao e a diferença entre elas
-- for exatamente 1 dia a menos do que deveria ser (ex: 29 dias em vez de 30)
-- Usar uma abordagem mais simples: verificar se a diferença em dias é 29
UPDATE notas_fiscais
SET data_vencimento = data_vencimento + INTERVAL '1 day'
WHERE data_vencimento IS NOT NULL
  AND created_at < '2026-02-04 19:27:00'::timestamp
  AND data_emissao IS NOT NULL
  -- Se a diferença entre data_vencimento e data_emissao for 29 dias (deveria ser 30)
  -- Converter a diferença DATE para INTEGER (número de dias)
  AND (data_vencimento - data_emissao)::integer = 29;

-- Comentário explicativo
COMMENT ON COLUMN notas_fiscais.data_emissao IS 'Data de emissão da nota fiscal (formato DATE, sem timezone)';
COMMENT ON COLUMN notas_fiscais.data_vencimento IS 'Data de vencimento da nota fiscal (formato DATE, sem timezone)';
