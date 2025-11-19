-- Migration: Ajustes nos Componentes da Grua
-- Data: 2025-02-02
-- Descrição: Adiciona campos de localização, dimensões e vida útil, remove campos obsoletos

-- Adicionar campo de localização (tipo dropdown)
ALTER TABLE grua_componentes 
ADD COLUMN IF NOT EXISTS localizacao_tipo VARCHAR(50) DEFAULT 'Almoxarifado';

-- Adicionar campo obra_id para localização quando for "Obra X"
ALTER TABLE grua_componentes 
ADD COLUMN IF NOT EXISTS obra_id INTEGER REFERENCES obras(id);

-- Adicionar campos de dimensões
ALTER TABLE grua_componentes 
ADD COLUMN IF NOT EXISTS dimensoes_altura DECIMAL(10,2);

ALTER TABLE grua_componentes 
ADD COLUMN IF NOT EXISTS dimensoes_largura DECIMAL(10,2);

ALTER TABLE grua_componentes 
ADD COLUMN IF NOT EXISTS dimensoes_comprimento DECIMAL(10,2);

ALTER TABLE grua_componentes 
ADD COLUMN IF NOT EXISTS dimensoes_peso DECIMAL(10,2);

-- Adicionar campo vida útil (percentual 0-100)
ALTER TABLE grua_componentes 
ADD COLUMN IF NOT EXISTS vida_util_percentual INTEGER DEFAULT 100 CHECK (vida_util_percentual >= 0 AND vida_util_percentual <= 100);

-- Adicionar índice para localização_tipo
CREATE INDEX IF NOT EXISTS idx_grua_componentes_localizacao_tipo ON grua_componentes(localizacao_tipo);

-- Adicionar índice para obra_id
CREATE INDEX IF NOT EXISTS idx_grua_componentes_obra_id ON grua_componentes(obra_id);

-- Comentários nas colunas
COMMENT ON COLUMN grua_componentes.localizacao_tipo IS 'Tipo de localização: Obra X, Almoxarifado, Oficina, Em trânsito, Em manutenção';
COMMENT ON COLUMN grua_componentes.obra_id IS 'ID da obra quando localizacao_tipo for "Obra X"';
COMMENT ON COLUMN grua_componentes.dimensoes_altura IS 'Altura do componente em metros';
COMMENT ON COLUMN grua_componentes.dimensoes_largura IS 'Largura do componente em metros';
COMMENT ON COLUMN grua_componentes.dimensoes_comprimento IS 'Comprimento do componente em metros';
COMMENT ON COLUMN grua_componentes.dimensoes_peso IS 'Peso do componente em kg (opcional)';
COMMENT ON COLUMN grua_componentes.vida_util_percentual IS 'Vida útil do componente em percentual (0-100%)';

