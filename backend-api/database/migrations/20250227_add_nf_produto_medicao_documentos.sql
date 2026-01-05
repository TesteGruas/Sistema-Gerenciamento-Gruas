-- Migration: Adicionar tipo 'nf_produto' aos documentos de medição
-- Data: 2025-02-27
-- Descrição: Adiciona suporte para Nota Fiscal de Produto nos documentos de medição

-- Remover constraint antiga
ALTER TABLE medicao_documentos 
  DROP CONSTRAINT IF EXISTS medicao_documentos_tipo_documento_check;

-- Adicionar nova constraint com nf_produto
ALTER TABLE medicao_documentos 
  ADD CONSTRAINT medicao_documentos_tipo_documento_check 
  CHECK (tipo_documento IN ('nf_servico', 'nf_produto', 'nf_locacao', 'boleto'));

-- Comentário
COMMENT ON COLUMN medicao_documentos.tipo_documento IS 'Tipo de documento: nf_servico, nf_produto, nf_locacao ou boleto';












