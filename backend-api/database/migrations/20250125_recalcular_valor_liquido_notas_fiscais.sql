-- Migration: Recalcular valor líquido das notas fiscais existentes
-- Data: 2025-01-25
-- Descrição: Recalcula o valor_liquido das notas fiscais baseado na soma dos valores líquidos dos itens

-- Função para recalcular valor líquido de uma nota fiscal
CREATE OR REPLACE FUNCTION recalcular_valor_liquido_nota_fiscal()
RETURNS void AS $$
DECLARE
    nota_record RECORD;
    valor_liquido_calculado DECIMAL(12,2);
BEGIN
    -- Para cada nota fiscal
    FOR nota_record IN SELECT id FROM notas_fiscais LOOP
        -- Calcular valor líquido somando os valores líquidos dos itens
        SELECT COALESCE(SUM(valor_liquido), 0)
        INTO valor_liquido_calculado
        FROM notas_fiscais_itens
        WHERE nota_fiscal_id = nota_record.id;
        
        -- Atualizar a nota fiscal
        UPDATE notas_fiscais
        SET valor_liquido = valor_liquido_calculado
        WHERE id = nota_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função
SELECT recalcular_valor_liquido_nota_fiscal();

-- Remover a função após uso
DROP FUNCTION IF EXISTS recalcular_valor_liquido_nota_fiscal();
