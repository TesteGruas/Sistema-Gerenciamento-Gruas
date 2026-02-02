-- Migration: Adicionar Campos Técnicos e de Logística à Tabela grua_obra
-- Data: 2025-02-02
-- Descrição: Adiciona campos técnicos e de serviços/logística para armazenar dados específicos de cada grua em cada obra

-- Parâmetros Técnicos
ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS tipo_base VARCHAR(50);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS altura_inicial DECIMAL(10,2);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS altura_final DECIMAL(10,2);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS velocidade_giro DECIMAL(10,2);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS velocidade_elevacao DECIMAL(10,2);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS velocidade_translacao DECIMAL(10,2);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS potencia_instalada DECIMAL(10,2);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS voltagem VARCHAR(10);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS tipo_ligacao VARCHAR(50);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS capacidade_ponta DECIMAL(10,2);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS capacidade_maxima_raio DECIMAL(10,2);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER;

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS vida_util INTEGER;

-- Serviços e Logística
ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS guindaste_montagem VARCHAR(100);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS quantidade_viagens INTEGER;

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS alojamento_alimentacao VARCHAR(100);

ALTER TABLE grua_obra 
ADD COLUMN IF NOT EXISTS responsabilidade_acessorios TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN grua_obra.tipo_base IS 'Tipo de base da grua nesta obra: Chumbador, Trilho, Cruzeta, Outro';
COMMENT ON COLUMN grua_obra.altura_inicial IS 'Altura inicial da grua nesta obra em metros';
COMMENT ON COLUMN grua_obra.altura_final IS 'Altura final da grua nesta obra em metros';
COMMENT ON COLUMN grua_obra.velocidade_giro IS 'Velocidade de giro em rpm';
COMMENT ON COLUMN grua_obra.velocidade_elevacao IS 'Velocidade de elevação em m/min';
COMMENT ON COLUMN grua_obra.velocidade_translacao IS 'Velocidade de translação em m/min';
COMMENT ON COLUMN grua_obra.potencia_instalada IS 'Potência instalada em kVA';
COMMENT ON COLUMN grua_obra.voltagem IS 'Voltagem de operação: 220V, 380V, 440V';
COMMENT ON COLUMN grua_obra.tipo_ligacao IS 'Tipo de ligação elétrica: Monofásica, Trifásica';
COMMENT ON COLUMN grua_obra.capacidade_ponta IS 'Capacidade na ponta em kg';
COMMENT ON COLUMN grua_obra.capacidade_maxima_raio IS 'Capacidade máxima por raio em kg';
COMMENT ON COLUMN grua_obra.ano_fabricacao IS 'Ano de fabricação da grua';
COMMENT ON COLUMN grua_obra.vida_util IS 'Vida útil estimada em anos';
COMMENT ON COLUMN grua_obra.guindaste_montagem IS 'Guindaste para montagem/desmontagem: Incluso, Por conta do cliente';
COMMENT ON COLUMN grua_obra.quantidade_viagens IS 'Quantidade de viagens de transporte necessárias';
COMMENT ON COLUMN grua_obra.alojamento_alimentacao IS 'Alojamento/Alimentação: Incluso, Por conta do cliente, Não aplicável';
COMMENT ON COLUMN grua_obra.responsabilidade_acessorios IS 'Responsabilidade por acessórios (estropos, caçambas, etc.)';
