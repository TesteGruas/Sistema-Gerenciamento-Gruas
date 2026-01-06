-- Adicionar campos de assinatura digital à tabela certificados_colaboradores
-- Similar aos campos de assinatura em holerites

ALTER TABLE certificados_colaboradores 
ADD COLUMN IF NOT EXISTS assinatura_digital TEXT,
ADD COLUMN IF NOT EXISTS assinado_por INTEGER REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS assinado_em TIMESTAMP WITH TIME ZONE;

-- Comentários explicativos
COMMENT ON COLUMN certificados_colaboradores.assinatura_digital IS 'Assinatura digital em base64 (canvas) para aplicar no PDF do certificado';
COMMENT ON COLUMN certificados_colaboradores.assinado_por IS 'ID do usuário que assinou o certificado';
COMMENT ON COLUMN certificados_colaboradores.assinado_em IS 'Data e hora da assinatura do certificado';















