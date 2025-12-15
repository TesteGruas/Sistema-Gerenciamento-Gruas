-- Migration: Adicionar suporte a feriados e tipo de dia no ponto eletrônico
-- Data: 2025-02-28
-- Descrição: Adiciona tabela de feriados nacionais e campos para identificar tipo de dia nos registros de ponto

-- Criar tabela de feriados nacionais
CREATE TABLE IF NOT EXISTS feriados_nacionais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL DEFAULT 'nacional' CHECK (tipo IN ('nacional', 'estadual', 'local')),
    estado CHAR(2), -- NULL para nacional, código do estado para estadual/local
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para busca rápida por data
CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados_nacionais(data);
CREATE INDEX IF NOT EXISTS idx_feriados_tipo ON feriados_nacionais(tipo);
CREATE INDEX IF NOT EXISTS idx_feriados_estado ON feriados_nacionais(estado);

-- Inserir feriados nacionais fixos do Brasil (2025)
INSERT INTO feriados_nacionais (nome, data, tipo, estado, ativo) VALUES
    ('Confraternização Universal', '2025-01-01', 'nacional', NULL, true),
    ('Carnaval', '2025-03-04', 'nacional', NULL, true),
    ('Carnaval', '2025-03-05', 'nacional', NULL, true),
    ('Paixão de Cristo', '2025-04-18', 'nacional', NULL, true),
    ('Tiradentes', '2025-04-21', 'nacional', NULL, true),
    ('Dia do Trabalhador', '2025-05-01', 'nacional', NULL, true),
    ('Independência do Brasil', '2025-09-07', 'nacional', NULL, true),
    ('Nossa Senhora Aparecida', '2025-10-12', 'nacional', NULL, true),
    ('Finados', '2025-11-02', 'nacional', NULL, true),
    ('Proclamação da República', '2025-11-15', 'nacional', NULL, true),
    ('Natal', '2025-12-25', 'nacional', NULL, true)
ON CONFLICT (data) DO NOTHING;

-- Adicionar campos na tabela registros_ponto
ALTER TABLE registros_ponto 
ADD COLUMN IF NOT EXISTS tipo_dia VARCHAR(50) DEFAULT 'normal' CHECK (tipo_dia IN ('normal', 'sabado', 'domingo', 'feriado_nacional', 'feriado_estadual', 'feriado_local')),
ADD COLUMN IF NOT EXISTS feriado_id INTEGER REFERENCES feriados_nacionais(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_feriado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS observacoes_feriado TEXT;

-- Criar índice para busca por tipo de dia
CREATE INDEX IF NOT EXISTS idx_registros_ponto_tipo_dia ON registros_ponto(tipo_dia);
CREATE INDEX IF NOT EXISTS idx_registros_ponto_is_feriado ON registros_ponto(is_feriado);

-- Comentários nas colunas
COMMENT ON COLUMN registros_ponto.tipo_dia IS 'Tipo do dia: normal, sabado, domingo, feriado_nacional, feriado_estadual, feriado_local';
COMMENT ON COLUMN registros_ponto.feriado_id IS 'ID do feriado se for um dia de feriado';
COMMENT ON COLUMN registros_ponto.is_feriado IS 'Indica se o dia é feriado';
COMMENT ON COLUMN registros_ponto.observacoes_feriado IS 'Observações sobre o feriado informado pelo funcionário';

-- Função para determinar automaticamente o tipo de dia baseado na data
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
    
    -- Verificar se é feriado nacional
    SELECT * INTO feriado_record
    FROM feriados_nacionais
    WHERE data = data_registro
    AND ativo = true
    AND tipo = 'nacional'
    LIMIT 1;
    
    IF feriado_record IS NOT NULL THEN
        RETURN 'feriado_nacional';
    END IF;
    
    -- Verificar se é feriado estadual (se estado foi informado)
    IF estado_funcionario IS NOT NULL THEN
        SELECT * INTO feriado_record
        FROM feriados_nacionais
        WHERE data = data_registro
        AND ativo = true
        AND tipo = 'estadual'
        AND estado = estado_funcionario
        LIMIT 1;
        
        IF feriado_record IS NOT NULL THEN
            RETURN 'feriado_estadual';
        END IF;
    END IF;
    
    -- Verificar se é feriado local (se estado foi informado)
    IF estado_funcionario IS NOT NULL THEN
        SELECT * INTO feriado_record
        FROM feriados_nacionais
        WHERE data = data_registro
        AND ativo = true
        AND tipo = 'local'
        AND estado = estado_funcionario
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
COMMENT ON FUNCTION determinar_tipo_dia IS 'Determina automaticamente o tipo de dia (normal, sabado, domingo, feriado) baseado na data e estado';

