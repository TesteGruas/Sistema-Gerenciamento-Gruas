-- Corrige recalcular_valores_medicao para:
-- 1) Somar custos mensais usando valor_mensal * quantidade_meses quando valor_total é 0 (evita zerar o bruto).
-- 2) Preservar valores do cabeçalho da medição quando não há linhas correspondentes nas tabelas filhas
--    (medições por obra/grua sem tabela medicao_aditivos, só valores no POST).
-- 3) Tratar aditivos e descontos separadamente (só sobrescreve a coluna se existir linha daquele tipo).

CREATE OR REPLACE FUNCTION recalcular_valores_medicao(p_medicao_id INTEGER)
RETURNS VOID AS $$
DECLARE
  v_valor_mensal_bruto DECIMAL(12,2);
  v_valor_custos_extras DECIMAL(12,2);
  v_valor_aditivos DECIMAL(12,2);
  v_valor_descontos DECIMAL(12,2);
  v_existing_bruto DECIMAL(12,2);
  v_existing_custos_extras DECIMAL(12,2);
  v_existing_aditivos DECIMAL(12,2);
  v_existing_descontos DECIMAL(12,2);
BEGIN
  SELECT
    COALESCE(valor_mensal_bruto, 0),
    COALESCE(valor_custos_extras, 0),
    COALESCE(valor_aditivos, 0),
    COALESCE(valor_descontos, 0)
  INTO v_existing_bruto, v_existing_custos_extras, v_existing_aditivos, v_existing_descontos
  FROM medicoes_mensais
  WHERE id = p_medicao_id;

  IF EXISTS (SELECT 1 FROM medicao_custos_mensais WHERE medicao_id = p_medicao_id) THEN
    SELECT COALESCE(SUM(
      COALESCE(
        NULLIF(valor_total, 0),
        COALESCE(valor_mensal, 0) * COALESCE(quantidade_meses, 1)
      )
    ), 0) INTO v_valor_mensal_bruto
    FROM medicao_custos_mensais
    WHERE medicao_id = p_medicao_id;
  ELSE
    v_valor_mensal_bruto := v_existing_bruto;
  END IF;

  IF EXISTS (SELECT 1 FROM medicao_horas_extras WHERE medicao_id = p_medicao_id)
     OR EXISTS (SELECT 1 FROM medicao_servicos_adicionais WHERE medicao_id = p_medicao_id) THEN
    SELECT COALESCE(SUM(valor_total), 0) INTO v_valor_custos_extras
    FROM (
      SELECT valor_total FROM medicao_horas_extras WHERE medicao_id = p_medicao_id
      UNION ALL
      SELECT valor_total FROM medicao_servicos_adicionais WHERE medicao_id = p_medicao_id
    ) AS extras;
  ELSE
    v_valor_custos_extras := v_existing_custos_extras;
  END IF;

  IF EXISTS (SELECT 1 FROM medicao_aditivos WHERE medicao_id = p_medicao_id AND tipo = 'adicional') THEN
    SELECT COALESCE(SUM(valor), 0) INTO v_valor_aditivos
    FROM medicao_aditivos
    WHERE medicao_id = p_medicao_id AND tipo = 'adicional';
  ELSE
    v_valor_aditivos := v_existing_aditivos;
  END IF;

  IF EXISTS (SELECT 1 FROM medicao_aditivos WHERE medicao_id = p_medicao_id AND tipo = 'desconto') THEN
    SELECT COALESCE(SUM(ABS(valor)), 0) INTO v_valor_descontos
    FROM medicao_aditivos
    WHERE medicao_id = p_medicao_id AND tipo = 'desconto';
  ELSE
    v_valor_descontos := v_existing_descontos;
  END IF;

  UPDATE medicoes_mensais
  SET
    valor_mensal_bruto = v_valor_mensal_bruto,
    valor_custos_extras = v_valor_custos_extras,
    valor_aditivos = v_valor_aditivos,
    valor_descontos = v_valor_descontos,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_medicao_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalcular_valores_medicao(INTEGER) IS
  'Recalcula valores da medição a partir dos itens; preserva cabeçalho quando não há linhas na tabela filha correspondente.';
