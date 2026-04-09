-- Documentos de demissão (rescisão) com assinatura digital, alinhados aos admissionais

BEGIN;

CREATE TABLE IF NOT EXISTS documentos_demissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  data_validade DATE,
  arquivo VARCHAR(500),
  alerta_enviado BOOLEAN DEFAULT FALSE,
  assinatura_digital TEXT,
  assinado_em TIMESTAMP WITH TIME ZONE,
  assinado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documentos_demissao_funcionario_id ON documentos_demissao(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_demissao_data_validade ON documentos_demissao(data_validade);
CREATE INDEX IF NOT EXISTS idx_documentos_demissao_tipo ON documentos_demissao(tipo);

CREATE OR REPLACE FUNCTION update_documentos_demissao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_documentos_demissao_updated_at ON documentos_demissao;
CREATE TRIGGER trigger_update_documentos_demissao_updated_at
  BEFORE UPDATE ON documentos_demissao
  FOR EACH ROW
  EXECUTE FUNCTION update_documentos_demissao_updated_at();

COMMENT ON TABLE documentos_demissao IS 'Documentos de rescisão/demissão com opção de assinatura pelo colaborador';

COMMIT;
