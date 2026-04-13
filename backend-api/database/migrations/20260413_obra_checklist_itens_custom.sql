-- Itens adicionais de checklist diário do livro da grua, catalogados por obra
CREATE TABLE IF NOT EXISTS obra_checklist_itens_custom (
  id BIGSERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL REFERENCES obras (id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS obra_checklist_itens_custom_obra_label_lower
  ON obra_checklist_itens_custom (obra_id, lower(trim(label)));

COMMENT ON TABLE obra_checklist_itens_custom IS 'Labels de itens extras de checklist reutilizáveis por obra';
COMMENT ON COLUMN obra_checklist_itens_custom.label IS 'Texto exibido no checklist';
