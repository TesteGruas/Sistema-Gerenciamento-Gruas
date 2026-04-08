-- Assinatura digital em documentos admissionais (alinhado a holerites / certificados)

BEGIN;

ALTER TABLE documentos_admissionais
  ADD COLUMN IF NOT EXISTS assinatura_digital TEXT,
  ADD COLUMN IF NOT EXISTS assinado_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS assinado_por INTEGER REFERENCES usuarios(id);

COMMENT ON COLUMN documentos_admissionais.assinatura_digital IS 'Assinatura em base64 (data URL PNG do canvas)';
COMMENT ON COLUMN documentos_admissionais.assinado_em IS 'Data/hora da assinatura pelo colaborador';
COMMENT ON COLUMN documentos_admissionais.assinado_por IS 'usuarios.id que assinou';

COMMIT;
