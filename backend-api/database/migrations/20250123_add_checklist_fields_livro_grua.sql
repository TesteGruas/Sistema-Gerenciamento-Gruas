-- Migration: Adicionar campos do checklist diário à tabela livro_grua
-- Data: 2025-01-23
-- Descrição: Adiciona campos booleanos para os itens verificados no checklist diário

-- Adicionar colunas do checklist diário (todos opcionais, permitindo NULL)
ALTER TABLE livro_grua
ADD COLUMN IF NOT EXISTS cabos BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS polias BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS estrutura BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS movimentos BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS freios BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS limitadores BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS indicadores BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS aterramento BOOLEAN DEFAULT NULL;

-- Adicionar comentários nas colunas para documentação
COMMENT ON COLUMN livro_grua.cabos IS 'Verificação de cabos no checklist diário';
COMMENT ON COLUMN livro_grua.polias IS 'Verificação de polias no checklist diário';
COMMENT ON COLUMN livro_grua.estrutura IS 'Verificação de estrutura no checklist diário';
COMMENT ON COLUMN livro_grua.movimentos IS 'Verificação de movimentos no checklist diário';
COMMENT ON COLUMN livro_grua.freios IS 'Verificação de freios no checklist diário';
COMMENT ON COLUMN livro_grua.limitadores IS 'Verificação de limitadores no checklist diário';
COMMENT ON COLUMN livro_grua.indicadores IS 'Verificação de indicadores no checklist diário';
COMMENT ON COLUMN livro_grua.aterramento IS 'Verificação de aterramento no checklist diário';

-- Atualizar a view livro_grua_completo para incluir os novos campos do checklist
DROP VIEW IF EXISTS livro_grua_completo;

CREATE VIEW livro_grua_completo AS
SELECT 
    lg.id,
    lg.grua_id,
    g.modelo AS grua_modelo,
    g.fabricante AS grua_fabricante,
    g.tipo AS grua_tipo,
    g.capacidade AS grua_capacidade,
    lg.funcionario_id,
    f.nome AS funcionario_nome,
    f.cargo AS funcionario_cargo,
    f.telefone AS funcionario_telefone,
    f.email AS funcionario_email,
    lg.data_entrada,
    lg.hora_entrada,
    lg.tipo_entrada,
    lg.status_entrada,
    lg.descricao,
    lg.observacoes,
    lg.responsavel_resolucao,
    lg.data_resolucao,
    lg.status_resolucao,
    lg.anexos,
    -- Campos do checklist diário
    lg.cabos,
    lg.polias,
    lg.estrutura,
    lg.movimentos,
    lg.freios,
    lg.limitadores,
    lg.indicadores,
    lg.aterramento,
    lg.created_at,
    lg.updated_at,
    lg.created_by,
    lg.updated_by,
    CASE
        WHEN lg.status_entrada::text = 'ok'::text THEN 'success'::text
        WHEN lg.status_entrada::text = 'manutencao'::text THEN 'warning'::text
        WHEN lg.status_entrada::text = 'falha'::text THEN 'danger'::text
        ELSE 'info'::text
    END AS status_color,
    CASE
        WHEN lg.tipo_entrada::text = 'checklist'::text THEN 'Checklist Diário'::character varying
        WHEN lg.tipo_entrada::text = 'manutencao'::text THEN 'Manutenção'::character varying
        WHEN lg.tipo_entrada::text = 'falha'::text THEN 'Falha/Problema'::character varying
        WHEN lg.tipo_entrada::text = 'inspecao'::text THEN 'Inspeção'::character varying
        WHEN lg.tipo_entrada::text = 'calibracao'::text THEN 'Calibração'::character varying
        ELSE lg.tipo_entrada
    END AS tipo_entrada_display
FROM livro_grua lg
LEFT JOIN gruas g ON lg.grua_id::text = g.id::text
LEFT JOIN funcionarios f ON lg.funcionario_id = f.id;

