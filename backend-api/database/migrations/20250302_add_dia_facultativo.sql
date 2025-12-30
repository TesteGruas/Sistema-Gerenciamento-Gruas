-- Migration: Adicionar suporte a dias facultativos
-- Data: 2025-03-02
-- Descrição: Adiciona campo is_facultativo para diferenciar dias facultativos de feriados

-- Adicionar campo is_facultativo na tabela feriados_nacionais
ALTER TABLE feriados_nacionais 
ADD COLUMN IF NOT EXISTS is_facultativo BOOLEAN DEFAULT false;

-- Criar índice para busca rápida por dias facultativos
CREATE INDEX IF NOT EXISTS idx_feriados_facultativo ON feriados_nacionais(is_facultativo) WHERE is_facultativo = true;

-- Comentário na coluna
COMMENT ON COLUMN feriados_nacionais.is_facultativo IS 'Indica se é um dia facultativo (não é feriado oficial)';

-- Adicionar campo is_facultativo na tabela registros_ponto
ALTER TABLE registros_ponto 
ADD COLUMN IF NOT EXISTS is_facultativo BOOLEAN DEFAULT false;

-- Criar índice para busca por dias facultativos
CREATE INDEX IF NOT EXISTS idx_registros_ponto_facultativo ON registros_ponto(is_facultativo) WHERE is_facultativo = true;

-- Comentário na coluna
COMMENT ON COLUMN registros_ponto.is_facultativo IS 'Indica se o dia é facultativo (não é feriado oficial)';

-- Atualizar função determinar_tipo_dia para considerar dias facultativos
CREATE OR REPLACE FUNCTION determinar_tipo_dia(data_registro DATE, estado_funcionario CHAR(2) DEFAULT NULL)
RETURNS VARCHAR(50) AS $$
DECLARE
    dia_semana INTEGER;
    feriado_record RECORD;
    tipo_dia_result VARCHAR(50);
BEGIN
    -- Obter dia da semana (0 = domingo, 6 = sábado)
    dia_semana := EXTRACT(DOW FROM data_registro);
    
    -- Verificar se é domingo
    IF dia_semana = 0 THEN
        RETURN 'domingo';
    END IF;
    
    -- Verificar se é sábado
    IF dia_semana = 6 THEN
        RETURN 'sabado';
    END IF;
    
    -- Verificar se é feriado nacional (não facultativo)
    SELECT * INTO feriado_record
    FROM feriados_nacionais
    WHERE data = data_registro
    AND ativo = true
    AND tipo = 'nacional'
    AND (is_facultativo = false OR is_facultativo IS NULL)
    LIMIT 1;
    
    IF feriado_record IS NOT NULL THEN
        RETURN 'feriado_nacional';
    END IF;
    
    -- Verificar se é feriado estadual (se estado foi informado, não facultativo)
    IF estado_funcionario IS NOT NULL THEN
        SELECT * INTO feriado_record
        FROM feriados_nacionais
        WHERE data = data_registro
        AND ativo = true
        AND tipo = 'estadual'
        AND estado = estado_funcionario
        AND (is_facultativo = false OR is_facultativo IS NULL)
        LIMIT 1;
        
        IF feriado_record IS NOT NULL THEN
            RETURN 'feriado_estadual';
        END IF;
    END IF;
    
    -- Verificar se é feriado local (se estado foi informado, não facultativo)
    IF estado_funcionario IS NOT NULL THEN
        SELECT * INTO feriado_record
        FROM feriados_nacionais
        WHERE data = data_registro
        AND ativo = true
        AND tipo = 'local'
        AND estado = estado_funcionario
        AND (is_facultativo = false OR is_facultativo IS NULL)
        LIMIT 1;
        
        IF feriado_record IS NOT NULL THEN
            RETURN 'feriado_local';
        END IF;
    END IF;
    
    -- Dia normal
    RETURN 'normal';
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION determinar_tipo_dia IS 'Determina automaticamente o tipo de dia (normal, sabado, domingo, feriado) baseado na data e estado. Ignora dias facultativos.';

