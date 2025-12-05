-- Adicionar campo para armazenar assinatura base64 (canvas)
-- Este campo é necessário para aplicar assinaturas em todas as páginas do PDF

ALTER TABLE obras_documento_assinaturas 
ADD COLUMN IF NOT EXISTS assinatura_base64 TEXT;

-- Comentário explicativo
COMMENT ON COLUMN obras_documento_assinaturas.assinatura_base64 IS 'Armazena a assinatura digital em base64 (canvas) para aplicar em todas as páginas do PDF. O campo arquivo_assinado pode conter URL do PDF assinado ou base64 se couber.';

