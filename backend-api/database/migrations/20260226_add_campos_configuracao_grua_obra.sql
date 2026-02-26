-- Migration: Adicionar campos de configuração técnica na tabela grua_obra
-- Data: 2026-02-26
-- Descrição: Suporta dados da seção "Configuração e Especificações Técnicas" do Livro da Grua

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS capacidade_1_cabo DECIMAL(10,2);

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS capacidade_2_cabos DECIMAL(10,2);

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS fundacao VARCHAR(255);

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS condicoes_ambiente TEXT;

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS raio_operacao DECIMAL(10,2);

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS raio DECIMAL(10,2);

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS altura DECIMAL(10,2);

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS manual_operacao VARCHAR(255);

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS procedimento_montagem BOOLEAN DEFAULT FALSE;

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS procedimento_operacao BOOLEAN DEFAULT FALSE;

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS procedimento_desmontagem BOOLEAN DEFAULT FALSE;

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS responsavel_tecnico VARCHAR(255);

ALTER TABLE grua_obra
ADD COLUMN IF NOT EXISTS crea_responsavel VARCHAR(100);

COMMENT ON COLUMN grua_obra.capacidade_1_cabo IS 'Capacidade com 1 cabo em kg para a obra';
COMMENT ON COLUMN grua_obra.capacidade_2_cabos IS 'Capacidade com 2 cabos em kg para a obra';
COMMENT ON COLUMN grua_obra.fundacao IS 'Tipo/descrição da fundação da grua na obra';
COMMENT ON COLUMN grua_obra.condicoes_ambiente IS 'Condições ambientais do local de operação';
COMMENT ON COLUMN grua_obra.raio_operacao IS 'Raio de operação da grua na obra (m)';
COMMENT ON COLUMN grua_obra.raio IS 'Campo legado de raio para compatibilidade';
COMMENT ON COLUMN grua_obra.altura IS 'Altura de operação da grua na obra (m)';
COMMENT ON COLUMN grua_obra.manual_operacao IS 'Referência ou descrição do manual de operação';
COMMENT ON COLUMN grua_obra.procedimento_montagem IS 'Indica se há procedimento de montagem cadastrado';
COMMENT ON COLUMN grua_obra.procedimento_operacao IS 'Indica se há procedimento de operação cadastrado';
COMMENT ON COLUMN grua_obra.procedimento_desmontagem IS 'Indica se há procedimento de desmontagem cadastrado';
COMMENT ON COLUMN grua_obra.responsavel_tecnico IS 'Responsável técnico vinculado à grua na obra';
COMMENT ON COLUMN grua_obra.crea_responsavel IS 'Registro CREA do responsável técnico';
