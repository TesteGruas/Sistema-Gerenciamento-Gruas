-- Migration: Atualizar comentário de impostos dinâmicos para incluir tipo_calculo e valor_fixo
-- Data: 2025-01-27
-- Descrição: Atualiza o comentário da coluna impostos_dinamicos para documentar os novos campos tipo_calculo e valor_fixo

-- Atualizar comentário da coluna para refletir os novos campos
COMMENT ON COLUMN notas_fiscais_itens.impostos_dinamicos IS 'Array JSON de impostos personalizados. Cada imposto contém: id (string), nome (string), tipo (string, opcional), tipo_calculo (porcentagem|valor_fixo), base_calculo (number, opcional), aliquota (number, opcional), valor_fixo (number, opcional), valor_calculado (number)';
