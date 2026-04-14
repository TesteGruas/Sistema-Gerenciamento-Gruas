-- Separa catálogos de itens custom por obra: checklist diário vs manutenção (mesma obra, listas independentes)
ALTER TABLE obra_checklist_itens_custom
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(32) NOT NULL DEFAULT 'checklist_diario';

ALTER TABLE obra_checklist_itens_custom
  DROP CONSTRAINT IF EXISTS obra_checklist_itens_custom_tipo_check;

ALTER TABLE obra_checklist_itens_custom
  ADD CONSTRAINT obra_checklist_itens_custom_tipo_check
  CHECK (tipo IN ('checklist_diario', 'manutencao'));

COMMENT ON TABLE obra_checklist_itens_custom IS 'Itens extras reutilizáveis por obra, separados por tipo (checklist diário ou manutenção)';
COMMENT ON COLUMN obra_checklist_itens_custom.tipo IS 'checklist_diario: livro checklist diário; manutenção: checklist de manutenção';

DROP INDEX IF EXISTS obra_checklist_itens_custom_obra_label_lower;

CREATE UNIQUE INDEX IF NOT EXISTS obra_checklist_itens_custom_obra_tipo_label_lower
  ON obra_checklist_itens_custom (obra_id, tipo, lower(trim(label)));
