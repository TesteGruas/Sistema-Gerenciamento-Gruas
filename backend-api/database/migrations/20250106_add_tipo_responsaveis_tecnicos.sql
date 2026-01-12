-- Migration: Adicionar campo tipo e crea_empresa na tabela responsaveis_tecnicos
-- Data: 2025-01-06
-- Descrição: Adiciona campos para diferenciar tipos de responsáveis técnicos (obra, irbana_equipamentos, irbana_manutencoes, irbana_montagem_operacao)

-- Adicionar coluna tipo na tabela responsaveis_tecnicos
ALTER TABLE responsaveis_tecnicos
ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'obra';

-- Adicionar coluna crea_empresa na tabela responsaveis_tecnicos
ALTER TABLE responsaveis_tecnicos
ADD COLUMN IF NOT EXISTS crea_empresa VARCHAR(50);

-- Criar índice para melhorar performance de consultas por tipo
CREATE INDEX IF NOT EXISTS idx_responsaveis_tecnicos_tipo ON responsaveis_tecnicos(tipo);
CREATE INDEX IF NOT EXISTS idx_responsaveis_tecnicos_obra_tipo ON responsaveis_tecnicos(obra_id, tipo);

-- Comentário nas colunas
COMMENT ON COLUMN responsaveis_tecnicos.tipo IS 'Tipo do responsável técnico: obra (cliente), irbana_equipamentos, irbana_manutencoes, irbana_montagem_operacao';
COMMENT ON COLUMN responsaveis_tecnicos.crea_empresa IS 'Número do CREA da empresa (para IRBANA: SP 2494244)';

