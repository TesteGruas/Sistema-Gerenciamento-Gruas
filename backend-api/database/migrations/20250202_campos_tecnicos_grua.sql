-- Migration: Campos Técnicos Obrigatórios no Cadastro de Grua
-- Data: 2025-02-02
-- Descrição: Adiciona campos técnicos obrigatórios conforme especificação do orçamento

-- Adicionar campo altura_final (altura final em metros)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS altura_final DECIMAL(10,2);

-- Adicionar campo tipo_base (tipo de base da grua)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS tipo_base VARCHAR(50);

-- Adicionar campo capacidade_1_cabo (capacidade com 1 cabo em kg)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS capacidade_1_cabo DECIMAL(10,2);

-- Adicionar campo capacidade_2_cabos (capacidade com 2 cabos em kg)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS capacidade_2_cabos DECIMAL(10,2);

-- Adicionar campo potencia_instalada (potência instalada em kVA)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS potencia_instalada DECIMAL(10,2);

-- Adicionar campo voltagem (voltagem em V)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS voltagem VARCHAR(10);

-- Adicionar campo velocidade_rotacao (velocidade de rotação em rpm)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS velocidade_rotacao DECIMAL(10,2);

-- Adicionar campo velocidade_elevacao (velocidade de elevação em m/min)
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS velocidade_elevacao DECIMAL(10,2);

-- Tornar campos obrigatórios (usando constraint NOT NULL após popular dados existentes)
-- Primeiro, vamos popular com valores padrão para registros existentes
UPDATE gruas 
SET 
  altura_final = COALESCE(altura_final, altura_maxima, 0),
  tipo_base = COALESCE(tipo_base, 'Chumbador'),
  capacidade_1_cabo = COALESCE(capacidade_1_cabo, CAST(capacidade AS DECIMAL), 0),
  capacidade_2_cabos = COALESCE(capacidade_2_cabos, CAST(capacidade AS DECIMAL) * 2, 0),
  potencia_instalada = COALESCE(potencia_instalada, 0),
  voltagem = COALESCE(voltagem, '380'),
  velocidade_rotacao = COALESCE(velocidade_rotacao, 0),
  velocidade_elevacao = COALESCE(velocidade_elevacao, 0)
WHERE altura_final IS NULL 
   OR tipo_base IS NULL 
   OR capacidade_1_cabo IS NULL 
   OR capacidade_2_cabos IS NULL 
   OR potencia_instalada IS NULL 
   OR voltagem IS NULL 
   OR velocidade_rotacao IS NULL 
   OR velocidade_elevacao IS NULL;

-- Agora tornar obrigatórios (com valores padrão)
DO $$
BEGIN
  -- Tornar altura_final obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'altura_final') THEN
    ALTER TABLE gruas 
    ALTER COLUMN altura_final SET NOT NULL,
    ALTER COLUMN altura_final SET DEFAULT 0;
  END IF;
  
  -- Tornar tipo_base obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'tipo_base') THEN
    ALTER TABLE gruas 
    ALTER COLUMN tipo_base SET NOT NULL,
    ALTER COLUMN tipo_base SET DEFAULT 'Chumbador';
  END IF;
  
  -- Tornar capacidade_1_cabo obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'capacidade_1_cabo') THEN
    ALTER TABLE gruas 
    ALTER COLUMN capacidade_1_cabo SET NOT NULL,
    ALTER COLUMN capacidade_1_cabo SET DEFAULT 0;
  END IF;
  
  -- Tornar capacidade_2_cabos obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'capacidade_2_cabos') THEN
    ALTER TABLE gruas 
    ALTER COLUMN capacidade_2_cabos SET NOT NULL,
    ALTER COLUMN capacidade_2_cabos SET DEFAULT 0;
  END IF;
  
  -- Tornar potencia_instalada obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'potencia_instalada') THEN
    ALTER TABLE gruas 
    ALTER COLUMN potencia_instalada SET NOT NULL,
    ALTER COLUMN potencia_instalada SET DEFAULT 0;
  END IF;
  
  -- Tornar voltagem obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'voltagem') THEN
    ALTER TABLE gruas 
    ALTER COLUMN voltagem SET NOT NULL,
    ALTER COLUMN voltagem SET DEFAULT '380';
  END IF;
  
  -- Tornar velocidade_rotacao obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'velocidade_rotacao') THEN
    ALTER TABLE gruas 
    ALTER COLUMN velocidade_rotacao SET NOT NULL,
    ALTER COLUMN velocidade_rotacao SET DEFAULT 0;
  END IF;
  
  -- Tornar velocidade_elevacao obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'velocidade_elevacao') THEN
    ALTER TABLE gruas 
    ALTER COLUMN velocidade_elevacao SET NOT NULL,
    ALTER COLUMN velocidade_elevacao SET DEFAULT 0;
  END IF;
END $$;

-- Adicionar campos se não existirem
ALTER TABLE gruas 
ADD COLUMN IF NOT EXISTS fabricante VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(50),
ADD COLUMN IF NOT EXISTS lanca VARCHAR(50),
ADD COLUMN IF NOT EXISTS ano INTEGER;

-- Tornar modelo e fabricante obrigatórios (após popular dados existentes)
UPDATE gruas 
SET modelo = COALESCE(modelo, 'Não informado'),
    fabricante = COALESCE(fabricante, 'Não informado')
WHERE modelo IS NULL OR fabricante IS NULL;

-- Tornar lanca obrigatório (após popular dados existentes)
UPDATE gruas 
SET lanca = COALESCE(lanca, 'Não informado')
WHERE lanca IS NULL;

-- Tornar ano obrigatório (após popular dados existentes)
UPDATE gruas 
SET ano = COALESCE(ano, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
WHERE ano IS NULL;

-- Tornar tipo obrigatório (após popular dados existentes)
UPDATE gruas 
SET tipo = COALESCE(tipo, 'Grua Torre')
WHERE tipo IS NULL;

-- Agora tornar obrigatórios (com valores padrão)
DO $$
BEGIN
  -- Tornar modelo obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'modelo') THEN
    ALTER TABLE gruas 
    ALTER COLUMN modelo SET NOT NULL,
    ALTER COLUMN modelo SET DEFAULT 'Não informado';
  END IF;
  
  -- Tornar fabricante obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'fabricante') THEN
    ALTER TABLE gruas 
    ALTER COLUMN fabricante SET NOT NULL,
    ALTER COLUMN fabricante SET DEFAULT 'Não informado';
  END IF;
  
  -- Tornar lanca obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'lanca') THEN
    ALTER TABLE gruas 
    ALTER COLUMN lanca SET NOT NULL,
    ALTER COLUMN lanca SET DEFAULT 'Não informado';
  END IF;
  
  -- Tornar ano obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'ano') THEN
    ALTER TABLE gruas 
    ALTER COLUMN ano SET NOT NULL,
    ALTER COLUMN ano SET DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  END IF;
  
  -- Tornar tipo obrigatório
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gruas' AND column_name = 'tipo') THEN
    ALTER TABLE gruas 
    ALTER COLUMN tipo SET NOT NULL,
    ALTER COLUMN tipo SET DEFAULT 'Grua Torre';
  END IF;
END $$;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_gruas_fabricante ON gruas(fabricante);
CREATE INDEX IF NOT EXISTS idx_gruas_modelo ON gruas(modelo);
CREATE INDEX IF NOT EXISTS idx_gruas_tipo_base ON gruas(tipo_base);
CREATE INDEX IF NOT EXISTS idx_gruas_ano ON gruas(ano);

-- Comentários nas colunas
COMMENT ON COLUMN gruas.altura_final IS 'Altura final da grua em metros';
COMMENT ON COLUMN gruas.tipo_base IS 'Tipo de base: Chumbador, Fixa, Móvel, etc.';
COMMENT ON COLUMN gruas.capacidade_1_cabo IS 'Capacidade de elevação com 1 cabo em kg';
COMMENT ON COLUMN gruas.capacidade_2_cabos IS 'Capacidade de elevação com 2 cabos em kg';
COMMENT ON COLUMN gruas.potencia_instalada IS 'Potência instalada em kVA';
COMMENT ON COLUMN gruas.voltagem IS 'Voltagem de operação em V (ex: 380, 220)';
COMMENT ON COLUMN gruas.velocidade_rotacao IS 'Velocidade de rotação em rpm';
COMMENT ON COLUMN gruas.velocidade_elevacao IS 'Velocidade de elevação em m/min';

