-- Itens de checklist adicionados pelo usuário (além dos 8 fixos)
ALTER TABLE livro_grua
ADD COLUMN IF NOT EXISTS checklist_itens_extras JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN livro_grua.checklist_itens_extras IS 'Array JSON: [{ "id", "label", "ok" }] — itens dinâmicos do checklist diário';

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
    lg.cabos,
    lg.polias,
    lg.estrutura,
    lg.movimentos,
    lg.freios,
    lg.limitadores,
    lg.indicadores,
    lg.aterramento,
    lg.checklist_itens_extras,
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
