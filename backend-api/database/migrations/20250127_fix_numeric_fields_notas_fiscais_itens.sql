-- Migration: Corrigir tipos de dados numéricos na tabela notas_fiscais_itens
-- Data: 2025-01-27
-- Descrição: Ajusta os tipos DECIMAL para suportar valores maiores e evitar overflow

-- Corrigir percentual_icms de DECIMAL(5,4) para DECIMAL(5,2) para permitir até 999.99%
ALTER TABLE notas_fiscais_itens
ALTER COLUMN percentual_icms TYPE DECIMAL(5,2) USING percentual_icms::numeric(5,2);

-- Corrigir percentual_ipi de DECIMAL(5,2) - já está correto, mas garantindo
-- Não precisa alterar, mas vamos garantir que está correto

-- Aumentar capacidade dos campos de valores para suportar valores maiores
-- DECIMAL(12,2) permite até 9.999.999.999,99 - pode ser insuficiente para alguns casos
-- Vamos aumentar para DECIMAL(15,2) que permite até 999.999.999.999.999,99

ALTER TABLE notas_fiscais_itens
ALTER COLUMN preco_unitario TYPE DECIMAL(15,2) USING preco_unitario::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN preco_total TYPE DECIMAL(15,2) USING preco_total::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN base_calculo_icms TYPE DECIMAL(15,2) USING base_calculo_icms::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN valor_icms TYPE DECIMAL(15,2) USING valor_icms::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN valor_ipi TYPE DECIMAL(15,2) USING valor_ipi::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN base_calculo_issqn TYPE DECIMAL(15,2) USING base_calculo_issqn::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN valor_issqn TYPE DECIMAL(15,2) USING valor_issqn::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN valor_inss TYPE DECIMAL(15,2) USING valor_inss::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN valor_cbs TYPE DECIMAL(15,2) USING valor_cbs::numeric(15,2);

ALTER TABLE notas_fiscais_itens
ALTER COLUMN valor_liquido TYPE DECIMAL(15,2) USING valor_liquido::numeric(15,2);

-- Comentários atualizados
COMMENT ON COLUMN notas_fiscais_itens.percentual_icms IS 'Percentual do ICMS do item (ex: 12.00 para 12%)';
COMMENT ON COLUMN notas_fiscais_itens.preco_unitario IS 'Preço unitário do item (suporta até 999 trilhões)';
COMMENT ON COLUMN notas_fiscais_itens.preco_total IS 'Preço total do item (suporta até 999 trilhões)';
