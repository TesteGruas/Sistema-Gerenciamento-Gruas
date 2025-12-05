-- Permitir que obra_id seja NULL na tabela obras_documentos
-- Isso permite criar documentos sem estar vinculados a uma obra específica

ALTER TABLE obras_documentos 
ALTER COLUMN obra_id DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN obras_documentos.obra_id IS 'ID da obra associada ao documento. Pode ser NULL para documentos gerais que não estão vinculados a uma obra específica.';

