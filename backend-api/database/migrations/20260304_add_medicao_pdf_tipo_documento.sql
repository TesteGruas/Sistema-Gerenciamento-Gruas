-- Migration: Adicionar tipo medicao_pdf aos documentos de medicao
-- Data: 2026-03-04
-- Descricao: Permite anexar PDF principal da medicao na tabela medicao_documentos

-- Remover constraint antiga
ALTER TABLE medicao_documentos
  DROP CONSTRAINT IF EXISTS medicao_documentos_tipo_documento_check;

-- Recriar constraint com novo tipo medicao_pdf
ALTER TABLE medicao_documentos
  ADD CONSTRAINT medicao_documentos_tipo_documento_check
  CHECK (tipo_documento IN ('nf_servico', 'nf_produto', 'nf_locacao', 'boleto', 'medicao_pdf'));

-- Comentario
COMMENT ON COLUMN medicao_documentos.tipo_documento IS
  'Tipo de documento: nf_servico, nf_produto, nf_locacao, boleto ou medicao_pdf';
