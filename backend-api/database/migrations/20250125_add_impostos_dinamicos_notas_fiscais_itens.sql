-- Migration: Adicionar campo para impostos dinâmicos na tabela notas_fiscais_itens
-- Data: 2025-01-25
-- Descrição: Adiciona campo JSON para armazenar impostos personalizados/dinâmicos

-- Adicionar campo JSON para impostos dinâmicos
ALTER TABLE notas_fiscais_itens
ADD COLUMN IF NOT EXISTS impostos_dinamicos JSONB DEFAULT '[]'::jsonb;

-- Comentário
COMMENT ON COLUMN notas_fiscais_itens.impostos_dinamicos IS 'Array JSON de impostos personalizados. Cada imposto contém: nome, tipo, base_calculo, aliquota, valor_calculado';

-- Criar índice GIN para melhor performance em consultas JSONB
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_itens_impostos_dinamicos 
ON notas_fiscais_itens USING GIN (impostos_dinamicos);
